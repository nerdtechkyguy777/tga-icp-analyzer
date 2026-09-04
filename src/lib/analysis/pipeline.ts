import { v4 as uuidv4 } from "uuid";
import { getICP } from "@/lib/icp/service";
import { scoreICP } from "@/lib/icp/scoring-engine";
import { saveAnalysis } from "@/lib/icp/storage";
import { extractWebsiteData } from "@/lib/integrations/website-extractor";
import { enrichWithApollo } from "@/lib/integrations/apollo";
import { classifyWithAI, enrichCompanyWithGPT } from "@/lib/integrations/openai";
import type { AnalysisResult } from "@/lib/icp/types";
import type { CompanyData } from "@/lib/icp/scoring-engine";

/**
 * Full analysis pipeline:
 * Company URL → Website Extraction → GPT Enrichment → Apollo → ICP AI Classification → Scoring
 */
export async function analyzeCompany(url: string): Promise<AnalysisResult> {
  const icp = await getICP();

  // Step 1: Website extraction
  const websiteData = await extractWebsiteData(url);

  // Step 2: GPT enrichment — primary source for industry & company type
  let enriched: CompanyData = { ...websiteData };
  const gptEnrichment = await enrichCompanyWithGPT(enriched, icp);

  if (gptEnrichment) {
    enriched = {
      ...enriched,
      industry: gptEnrichment.industry,
      subIndustry: gptEnrichment.subIndustry,
      businessModel: gptEnrichment.businessModel,
      companyType: gptEnrichment.companyType,
      gptSummary: gptEnrichment.summary,
      description: gptEnrichment.summary || enriched.description,
      industrySource: "gpt",
    };

    if (gptEnrichment.isLeadGenCompetitor) {
      enriched.companyType = "lead_gen_competitor";
    }
    if (gptEnrichment.isSolarRenewablesCompany) {
      enriched.isSolarRenewablesCompany = true;
    }
  }

  // Step 3: Apollo enrichment (supplements employee count, location — not primary for industry)
  const { enriched: apolloEnriched, apolloData } = await enrichWithApollo(enriched);

  enriched = {
    ...apolloEnriched,
    // GPT industry always wins over Apollo/keyword guesses
    industry: enriched.industry ?? apolloEnriched.industry,
    subIndustry: enriched.subIndustry ?? apolloEnriched.subIndustry,
    businessModel: enriched.businessModel ?? apolloEnriched.businessModel,
    companyType: enriched.companyType,
    gptSummary: enriched.gptSummary,
    websiteContent: enriched.websiteContent ?? websiteData.websiteContent,
    industrySource: enriched.industrySource ?? (apolloEnriched.industry ? "apollo" : "heuristic"),
  };

  // Step 4: AI classification against ICP criteria
  const aiClassifications = await classifyWithAI(icp, enriched);

  // Step 5: Scoring engine
  const scoring = scoreICP(icp, enriched, aiClassifications);

  const result: AnalysisResult = {
    id: uuidv4(),
    companyUrl: url,
    companyName: enriched.name,
    icpVersion: icp.version,
    icpScore: scoring.icpScore,
    fitTag: scoring.fitTag,
    recommendation: scoring.recommendation,
    disqualified: scoring.disqualified,
    disqualificationReasons: scoring.disqualificationReasons,
    criterionEvaluations: scoring.criterionEvaluations,
    companyData: enriched,
    apolloData: apolloData ?? undefined,
    createdAt: new Date().toISOString(),
  };

  await saveAnalysis(result);
  return result;
}
