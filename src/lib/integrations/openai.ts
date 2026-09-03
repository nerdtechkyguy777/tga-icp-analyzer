import OpenAI from "openai";
import type { ICPKnowledgeBase, ICPCriterion, MatchResult } from "@/lib/icp/types";
import type { CompanyData, AIClassification } from "@/lib/icp/scoring-engine";

export interface GPTCompanyEnrichment {
  industry: string;
  subIndustry?: string;
  businessModel: string;
  companyType: "product_platform" | "product_and_services" | "service_agency" | "lead_gen_competitor" | "unknown";
  summary: string;
  isLeadGenCompetitor: boolean;
}

/**
 * Use GPT to classify company industry, business model, and type from website content.
 * Primary source for industry — not Apollo or keyword heuristics.
 */
export async function enrichCompanyWithGPT(
  company: CompanyData,
  icp: ICPKnowledgeBase
): Promise<GPTCompanyEnrichment | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const targetIndustries =
    icp.criteria.find((c) => c.id === "target_industries")?.values ?? [];

  const websiteContent = (company.websiteContent as string) ?? company.description ?? "";
  if (!websiteContent && !company.name) return null;

  const openai = new OpenAI({ apiKey });

  const prompt = `You are a B2B company research analyst for TGA (The Global Associates), a B2B lead generation company.

Analyze this company from their website content and classify them accurately.

IMPORTANT DISTINCTIONS:
- Manufacturing, semiconductor, industrial B2B, electronics, and hardware companies are HIGH-PRIORITY targets for TGA — classify as MATCH when applicable.
- A SaaS/product company that sells sales enablement, revenue intelligence, or AI tools TO businesses is an IT Product / SaaS company — NOT a lead gen competitor.
- A lead gen COMPETITOR is a company whose PRIMARY business is selling lead generation, demand generation, or appointment-setting SERVICES to other companies (e.g. "we generate B2B leads for clients").
- Proshort, Gong, Clari, Outreach = product platforms (NOT lead gen agencies).
- Generic web dev or marketing agencies with NO own product = service providers (excluded).
- IT/cybersecurity/SaaS companies that sell OWN PRODUCTS and also offer consulting or implementation services = product_and_services (INCLUDED, not excluded).
- Skillmine-style companies: own software products + professional services = product_and_services.
- Solar, renewable energy, and clean-tech power companies = excluded (not ICP fit).

=== TARGET ICP INDUSTRIES (pick the best match) ===
${targetIndustries.join(", ")}

=== COMPANY ===
Name: ${company.name ?? "Unknown"}
Website: ${company.website ?? ""}
Current industry guess: ${company.industry ?? "Unknown"}
Description: ${company.description ?? ""}

=== WEBSITE CONTENT (excerpt) ===
${websiteContent.slice(0, 4000)}

Respond with JSON only:
{
  "industry": "<best matching ICP industry from the list above, or closest fit>",
  "subIndustry": "<specific niche e.g. Sales Enablement, Revenue Intelligence>",
  "businessModel": "B2B" | "B2C" | "B2B2C" | "Unknown",
  "companyType": "product_platform" | "product_and_services" | "service_agency" | "lead_gen_competitor" | "unknown",
  "summary": "<1-2 sentence description of what the company does>",
  "isLeadGenCompetitor": <true ONLY if they sell lead gen/demand gen services as their core business>
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as GPTCompanyEnrichment;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Use OpenAI to classify company data against AI-interpreted ICP criteria.
 * The ICP Knowledge Base is injected into the prompt — AI does NOT invent its own ICP.
 */
export async function classifyWithAI(
  icp: ICPKnowledgeBase,
  company: CompanyData
): Promise<AIClassification[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  const aiCriteria = icp.criteria.filter(
    (c) => c.active && !c.isHardRule && needsAIClassification(c)
  );

  if (aiCriteria.length === 0) {
    return [];
  }

  if (!apiKey) {
    return aiCriteria.map((c) => ({
      criterionId: c.id,
      result: "UNKNOWN" as MatchResult,
      reasoning: "OpenAI API key not configured — AI classification skipped",
    }));
  }

  const openai = new OpenAI({ apiKey });

  const icpContext = buildICPContext(icp, aiCriteria);
  const companyContext = buildCompanyContext(company);

  const prompt = `You are an ICP (Ideal Customer Profile) evaluation engine for TGA.

IMPORTANT RULES:
- You MUST evaluate the company ONLY against the ICP criteria provided below.
- Do NOT invent your own criteria or change the ICP definition.
- The ICP Knowledge Base below is the SOURCE OF TRUTH.
- Classify as: MATCH, PARTIAL_MATCH, NO_MATCH, or UNKNOWN.
- For industry criteria: SaaS platforms, AI products, sales enablement tools, and revenue intelligence software ARE valid matches for IT Products / SaaS / AI / Analytics categories.
- Manufacturing, semiconductor, industrial B2B, electronics manufacturing, and hardware B2B companies are HIGH-PRIORITY — score as MATCH with strong reasoning.
- A product company is NOT excluded just because it mentions "sales", "pipeline", or "demand gen" in a product context.
- Companies offering BOTH own IT products/platforms AND professional services (hybrid model) should score as MATCH on company characteristics — they are NOT generic agencies.
- Solar and renewable energy companies should be classified as NO_MATCH / excluded.
- Provide brief reasoning citing evidence from the company data.

=== ICP KNOWLEDGE BASE (Version ${icp.version}) ===
${icpContext}

=== COMPANY DATA ===
${companyContext}

Respond with JSON:
{
  "classifications": [
    {
      "criterionId": "<criterion id>",
      "result": "MATCH" | "PARTIAL_MATCH" | "NO_MATCH" | "UNKNOWN",
      "reasoning": "<brief explanation>"
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);

    const results: AIClassification[] = Array.isArray(parsed)
      ? parsed
      : parsed.classifications ?? parsed.results ?? [];

    return aiCriteria.map((criterion) => {
      const found = results.find(
        (r: AIClassification) => r.criterionId === criterion.id
      );
      return {
        criterionId: criterion.id,
        result: (found?.result ?? "UNKNOWN") as MatchResult,
        reasoning: found?.reasoning
          ? `AI: ${found.reasoning}`
          : "No AI classification available",
      };
    });
  } catch (error) {
    return aiCriteria.map((c) => ({
      criterionId: c.id,
      result: "UNKNOWN" as MatchResult,
      reasoning: `AI classification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }));
  }
}

function needsAIClassification(criterion: ICPCriterion): boolean {
  const deterministicOnly = ["employee_size", "exclusion", "country", "revenue_range"];
  if (deterministicOnly.includes(criterion.type) && criterion.isHardRule) {
    return false;
  }

  // Always use AI for semantic criteria — industry must not rely on Apollo/keywords alone
  const alwaysAI: ICPCriterion["type"][] = [
    "industry",
    "sub_industry",
    "business_model",
    "job_title",
    "product_service",
    "company_characteristic",
    "signal",
    "custom",
  ];
  if (alwaysAI.includes(criterion.type)) return true;

  if (criterion.positiveSignals?.length || criterion.negativeSignals?.length) return true;
  return false;
}

function buildICPContext(icp: ICPKnowledgeBase, criteria: ICPCriterion[]): string {
  let context = `Name: ${icp.name}\nDescription: ${icp.description}\n\nCriteria to evaluate:\n`;

  for (const c of criteria) {
    context += `\n--- ${c.name} (ID: ${c.id}) ---\n`;
    context += `Type: ${c.type}\n`;
    context += `Weight: ${c.weight}\n`;
    context += `Required: ${c.required}\n`;
    if (c.description) context += `Description: ${c.description}\n`;
    if (c.values?.length) context += `Target values: ${c.values.join(", ")}\n`;
    if (c.preferredModels?.length) context += `Preferred models: ${c.preferredModels.join(", ")}\n`;
    if (c.positiveSignals?.length) context += `Positive signals: ${c.positiveSignals.join("; ")}\n`;
    if (c.negativeSignals?.length) context += `Negative signals: ${c.negativeSignals.join("; ")}\n`;
    if (c.minValue !== undefined) context += `Min value: ${c.minValue}\n`;
    if (c.maxValue !== undefined) context += `Max value: ${c.maxValue}\n`;
  }

  return context;
}

function buildCompanyContext(company: CompanyData): string {
  const lines: string[] = [];
  if (company.name) lines.push(`Name: ${company.name}`);
  if (company.website) lines.push(`Website: ${company.website}`);
  if (company.industry) lines.push(`Industry (GPT-classified): ${company.industry}`);
  if (company.subIndustry) lines.push(`Sub-industry: ${company.subIndustry}`);
  if (company.gptSummary) lines.push(`Summary: ${company.gptSummary}`);
  if (company.companyType) lines.push(`Company type: ${company.companyType}`);
  if (company.employeeCount) lines.push(`Employees: ${company.employeeCount}`);
  if (company.revenue) lines.push(`Revenue: $${company.revenue}M`);
  if (company.country) lines.push(`Country: ${company.country}`);
  if (company.location) lines.push(`Location: ${company.location}`);
  if (company.businessModel) lines.push(`Business Model: ${company.businessModel}`);
  if (company.description) lines.push(`Description: ${company.description}`);
  if (company.websiteContent) {
    lines.push(`\nWebsite content excerpt:\n${String(company.websiteContent).slice(0, 2500)}`);
  }
  return lines.join("\n");
}
