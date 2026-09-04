import type {
  ICPCriterion,
  ICPKnowledgeBase,
  CriterionEvaluation,
  MatchResult,
  Recommendation,
  FitTag,
} from "./types";
import { deriveFitTag, deriveRecommendation } from "./fit-tag";

interface CompanyData {
  name?: string;
  industry?: string;
  subIndustry?: string;
  employeeCount?: number;
  revenue?: number;
  country?: string;
  location?: string;
  businessModel?: string;
  technologies?: string[];
  description?: string;
  website?: string;
  websiteContent?: string;
  gptSummary?: string;
  companyType?: string;
  industrySource?: "gpt" | "apollo" | "heuristic";
  isSolarRenewablesCompany?: boolean;
  [key: string]: unknown;
}

interface AIClassification {
  criterionId: string;
  result: MatchResult;
  reasoning: string;
}

const MATCH_SCORES: Record<MatchResult, number> = {
  MATCH: 100,
  PARTIAL_MATCH: 50,
  NO_MATCH: 0,
  UNKNOWN: 25,
};

/** Maps ICP geography labels to matchable country/region strings */
const GEOGRAPHY_ALIASES: Record<string, string[]> = {
  india: ["india", "in"],
  usa: ["usa", "united states", "us", "u.s.", "u.s.a."],
  mea: [
    "mea",
    "middle east",
    "uae",
    "united arab emirates",
    "dubai",
    "saudi arabia",
    "qatar",
    "bahrain",
    "kuwait",
    "oman",
    "egypt",
    "south africa",
    "nigeria",
    "kenya",
    "israel",
    "jordan",
    "morocco",
  ],
  sea: [
    "sea",
    "southeast asia",
    "singapore",
    "malaysia",
    "indonesia",
    "thailand",
    "vietnam",
    "philippines",
    "myanmar",
    "cambodia",
  ],
};

function matchesGeography(country: string, targets: string[]): boolean {
  const normalized = country.toLowerCase().trim();
  return targets.some((target) => {
    const key = target.toLowerCase().trim();
    if (normalized === key) return true;
    const aliases = GEOGRAPHY_ALIASES[key];
    if (aliases) {
      return aliases.some(
        (alias) => normalized.includes(alias) || alias.includes(normalized)
      );
    }
    return normalized.includes(key) || key.includes(normalized);
  });
}

function textContainsAny(text: string, terms: string[]): string | null {
  const lower = text.toLowerCase();
  return terms.find((term) => lower.includes(term.toLowerCase())) ?? null;
}

function matchesTargetIndustry(
  company: CompanyData,
  icp: ICPKnowledgeBase
): boolean {
  const industry = (company.industry ?? "").toLowerCase();
  if (!industry || industry === "unknown") return false;

  const targets =
    icp.criteria.find((c) => c.id === "target_industries")?.values ?? [];

  return targets.some((target) => {
    const t = target.toLowerCase();
    return industry.includes(t) || t.includes(industry);
  });
}

function isProductLedCompany(company: CompanyData): boolean {
  return (
    company.companyType === "product_platform" ||
    company.companyType === "product_and_services"
  );
}

/** Solar/renewables exclusion — primary business only, not incidental mentions or customer verticals. */
function evaluateSolarRenewablesExclusion(
  company: CompanyData,
  icp: ICPKnowledgeBase
): CriterionEvaluation {
  const criterion = icp.criteria.find((c) => c.id === "excluded_solar_renewables");
  const criterionName = criterion?.name ?? "Excluded: Solar & Renewables";

  // Product-led companies in target ICP industries are not solar providers
  // (e.g. Addverb serves "solar and battery" verticals but sells warehouse automation)
  if (isProductLedCompany(company) && matchesTargetIndustry(company, icp)) {
    return {
      criterionId: "excluded_solar_renewables",
      criterionName,
      weight: 0,
      result: "MATCH",
      score: 100,
      isHardRule: true,
      disqualified: false,
      reasoning:
        "Product/platform company in target ICP industry — not a solar/renewables provider (incidental mentions ignored)",
    };
  }

  const industry = (company.industry ?? "").toLowerCase().trim();
  const name = (company.name ?? "").toLowerCase();
  const website = (company.website ?? "").toLowerCase();
  const primaryText = `${company.gptSummary ?? ""} ${company.description ?? ""}`.toLowerCase();

  const PRIMARY_SOLAR_INDUSTRIES = [
    "solar energy",
    "solar power",
    "renewable energy",
    "renewables",
    "clean energy",
    "wind energy",
    "wind power",
    "photovoltaic",
    "green energy",
    "solar epc",
    "solar installation",
  ];

  for (const term of PRIMARY_SOLAR_INDUSTRIES) {
    if (
      industry === term ||
      industry.startsWith(`${term} `) ||
      industry.endsWith(` ${term}`) ||
      industry.includes(`${term} company`)
    ) {
      return solarDisqualified(criterionName, term, `Primary industry: ${company.industry}`);
    }
  }

  // Company/domain name signals (e.g. vikramsolar.com)
  const SOLAR_NAME_PATTERNS = [
    "solar",
    "renewable",
    "photovoltaic",
    "windpower",
    "wind-power",
    "greentech energy",
  ];
  for (const pattern of SOLAR_NAME_PATTERNS) {
    if (name.includes(pattern) || website.includes(pattern)) {
      return solarDisqualified(criterionName, pattern, `Company/domain name indicates solar/renewables focus`);
    }
  }

  // Strong phrases indicating solar/renewables IS the core business (not sustainability copy)
  const PRIMARY_BUSINESS_PHRASES = [
    "solar panel manufacturer",
    "solar panel manufacturing",
    "solar module manufacturer",
    "manufacturer of solar panels",
    "solar panel installation",
    "solar epc contractor",
    "solar epc company",
    "renewable energy solutions provider",
    "renewable energy company",
    "leading solar company",
    "solar power company",
    "photovoltaic modules",
    "wind farm developer",
    "wind energy company",
    "clean energy provider",
    "we manufacture solar",
    "solar modules production",
  ];

  for (const phrase of PRIMARY_BUSINESS_PHRASES) {
    if (primaryText.includes(phrase)) {
      return solarDisqualified(criterionName, phrase, "Primary business description indicates solar/renewables");
    }
  }

  if (company.isSolarRenewablesCompany === true) {
    return solarDisqualified(criterionName, "Solar/Renewables", "GPT classified as primary solar/renewables company");
  }

  return {
    criterionId: "excluded_solar_renewables",
    criterionName,
    weight: 0,
    result: industry || primaryText ? "MATCH" : "UNKNOWN",
    score: industry || primaryText ? 100 : 25,
    isHardRule: true,
    disqualified: false,
    reasoning: "No primary solar/renewables business detected — incidental mentions ignored",
  };
}

function solarDisqualified(
  criterionName: string,
  match: string,
  detail: string
): CriterionEvaluation {
  return {
    criterionId: "excluded_solar_renewables",
    criterionName,
    weight: 0,
    result: "NO_MATCH",
    score: 0,
    isHardRule: true,
    disqualified: true,
    reasoning: `Solar/renewables company detected: ${match} — ${detail} — score 0`,
  };
}

function evaluateHardRule(
  criterion: ICPCriterion,
  company: CompanyData,
  icp?: ICPKnowledgeBase
): CriterionEvaluation {
  let disqualified = false;
  let result: MatchResult = "UNKNOWN";
  const reasons: string[] = [];

  switch (criterion.type) {
    case "employee_size": {
      const count = company.employeeCount;
      if (count === undefined || count === null) {
        result = "UNKNOWN";
        reasons.push("Employee count not available");
      } else {
        const min = criterion.minValue ?? 0;
        const max = criterion.maxValue ?? Infinity;
        if (count < min) {
          disqualified = criterion.isHardRule;
          result = "NO_MATCH";
          reasons.push(`Employee count (${count}) below minimum (${min})`);
        } else if (count > max) {
          disqualified = criterion.isHardRule;
          result = "NO_MATCH";
          reasons.push(`Employee count (${count}) above maximum (${max})`);
        } else {
          result = "MATCH";
          reasons.push(`Employee count (${count}) within range ${min}-${max}`);
        }
      }
      break;
    }

    case "exclusion": {
      if (criterion.id === "excluded_solar_renewables" && icp) {
        return evaluateSolarRenewablesExclusion(company, icp);
      }

      const industry = (company.industry ?? "").toLowerCase();
      const description = (company.description ?? "").toLowerCase();
      const name = (company.name ?? "").toLowerCase();
      const websiteContent = String(company.websiteContent ?? "").toLowerCase();
      const combinedText = `${name} ${industry} ${description} ${websiteContent}`;

      // GPT-confirmed product companies are NOT lead gen competitors
      if (
        criterion.id === "excluded_lead_gen_competitors" &&
        isProductLedCompany(company)
      ) {
        result = "MATCH";
        reasons.push("GPT classified as product/platform company — not a lead gen competitor");
        break;
      }

      // Product + services hybrids and product platforms are NOT generic agencies
      if (criterion.id === "excluded_services" && isProductLedCompany(company)) {
        result = "MATCH";
        reasons.push(
          "GPT classified as product-led company (with or without services) — not a generic service provider"
        );
        break;
      }

      const excluded = criterion.values ?? [];
      const negativeSignals = criterion.negativeSignals ?? [];

      const industryMatch = excluded.find(
        (e) =>
          industry.includes(e.toLowerCase()) || e.toLowerCase().includes(industry)
      );
      const nameMatch = excluded.find(
        (e) =>
          name.includes(e.toLowerCase()) || e.toLowerCase().includes(name)
      );
      const textMatch =
        textContainsAny(combinedText, excluded) ??
        textContainsAny(combinedText, negativeSignals);

      const match = industryMatch ?? nameMatch ?? textMatch;
      if (match) {
        // Target-industry companies with incidental service mentions (e.g. IT Products + web dev services)
        if (
          criterion.id === "excluded_services" &&
          icp &&
          textMatch &&
          !industryMatch &&
          !nameMatch &&
          matchesTargetIndustry(company, icp)
        ) {
          result = "MATCH";
          reasons.push(
            `Target ICP industry "${company.industry}" with own products — incidental service offering ignored`
          );
          break;
        }

        disqualified = true;
        result = "NO_MATCH";
        const isLeadGenRule = criterion.id === "excluded_lead_gen_competitors";
        reasons.push(
          isLeadGenRule
            ? `Competitor detected (B2B lead gen/demand gen): ${match} — score 0`
            : `Excluded service/provider detected: ${match}`
        );
      } else if (industry || description || name) {
        result = "MATCH";
        reasons.push("No excluded service provider signals detected");
      } else {
        result = "UNKNOWN";
        reasons.push("Insufficient data for exclusion check");
      }
      break;
    }

    case "country": {
      const country = company.country ?? company.location ?? "";
      const targets = criterion.values ?? [];
      if (!country) {
        result = "UNKNOWN";
        reasons.push("Country/location not available");
      } else if (matchesGeography(country, targets)) {
        result = "MATCH";
        reasons.push(`Geography (${country}) matches target regions`);
      } else {
        if (criterion.isHardRule) disqualified = true;
        result = "NO_MATCH";
        reasons.push(`Geography (${country}) not in target regions (India, MEA, SEA, USA)`);
      }
      break;
    }

    case "revenue_range": {
      const revenue = company.revenue;
      if (revenue === undefined || revenue === null) {
        result = "UNKNOWN";
        reasons.push("Revenue not available");
      } else {
        const min = criterion.minValue ?? 0;
        const max = criterion.maxValue ?? Infinity;
        if (revenue >= min && revenue <= max) {
          result = "MATCH";
          reasons.push(`Revenue ($${revenue}M) within range`);
        } else {
          result = revenue < min ? "NO_MATCH" : "PARTIAL_MATCH";
          reasons.push(`Revenue ($${revenue}M) outside ideal range ${min}-${max}M`);
        }
      }
      break;
    }

    default:
      result = "UNKNOWN";
      reasons.push("Hard rule evaluation not applicable for this criterion type");
  }

  const score = disqualified ? 0 : MATCH_SCORES[result];

  return {
    criterionId: criterion.id,
    criterionName: criterion.name,
    weight: criterion.weight,
    result,
    score,
    isHardRule: criterion.isHardRule,
    disqualified,
    reasoning: reasons.join("; "),
  };
}

function evaluateDeterministic(
  criterion: ICPCriterion,
  company: CompanyData
): CriterionEvaluation | null {
  if (criterion.type === "industry" && criterion.values?.length) {
    const industry = (company.industry ?? "").toLowerCase();
    if (!industry || industry === "unknown") return null;

    const targets = criterion.values.map((v) => v.toLowerCase());
    const match = targets.some(
      (t) => industry.includes(t) || t.includes(industry)
    );

    // Only trust deterministic industry on confident MATCH — defer NO_MATCH to GPT
    if (!match) return null;

    return {
      criterionId: criterion.id,
      criterionName: criterion.name,
      weight: criterion.weight,
      result: "MATCH",
      score: 100,
      isHardRule: false,
      disqualified: false,
      reasoning: `Industry "${company.industry}" matches target industries`,
    };
  }

  if (criterion.type === "business_model" && criterion.preferredModels?.length) {
    const model = (company.businessModel ?? "").toUpperCase();
    if (!model || model === "UNKNOWN") return null;

    const preferred = criterion.preferredModels.map((m) => m.toUpperCase());
    const match = preferred.some((p) => model.includes(p));

    if (!match) return null;

    return {
      criterionId: criterion.id,
      criterionName: criterion.name,
      weight: criterion.weight,
      result: "MATCH",
      score: 100,
      isHardRule: false,
      disqualified: false,
      reasoning: `Business model "${company.businessModel}" matches preferred models`,
    };
  }

  if (criterion.type === "technology" && criterion.values?.length && company.technologies?.length) {
    const companyTech = company.technologies.map((t) => t.toLowerCase());
    const targetTech = criterion.values.map((v) => v.toLowerCase());
    const matches = targetTech.filter((t) =>
      companyTech.some((ct) => ct.includes(t) || t.includes(ct))
    );
    const ratio = matches.length / targetTech.length;

    let result: MatchResult;
    if (ratio >= 0.5) result = "MATCH";
    else if (ratio > 0) result = "PARTIAL_MATCH";
    else result = "NO_MATCH";

    return {
      criterionId: criterion.id,
      criterionName: criterion.name,
      weight: criterion.weight,
      result,
      score: MATCH_SCORES[result],
      isHardRule: false,
      disqualified: false,
      reasoning: `Technology overlap: ${matches.join(", ") || "none"}`,
    };
  }

  return null;
}

export function scoreICP(
  icp: ICPKnowledgeBase,
  company: CompanyData,
  aiClassifications: AIClassification[] = []
): {
  icpScore: number;
  fitTag: FitTag;
  recommendation: Recommendation;
  disqualified: boolean;
  disqualificationReasons: string[];
  criterionEvaluations: CriterionEvaluation[];
} {
  const activeCriteria = icp.criteria
    .filter((c) => c.active)
    .sort((a, b) => a.order - b.order);

  const evaluations: CriterionEvaluation[] = [];
  const disqualificationReasons: string[] = [];

  const deterministicTypes = new Set([
    "employee_size",
    "country",
    "revenue_range",
    "exclusion",
  ]);

  for (const criterion of activeCriteria) {
    let evaluation: CriterionEvaluation | null = null;

    // Deterministic criteria (size, geo, revenue, exclusions) — always evaluated.
    // Only exclusions and criteria flagged isHardRule can auto-disqualify.
    if (criterion.isHardRule || deterministicTypes.has(criterion.type)) {
      evaluation = evaluateHardRule(criterion, company, icp);
      if (evaluation.disqualified) {
        disqualificationReasons.push(
          `${criterion.name}: ${evaluation.reasoning}`
        );
      }
    }

    // Deterministic non-hard rules — only use on confident MATCH
    if (!evaluation) {
      const deterministic = evaluateDeterministic(criterion, company);
      if (deterministic?.result === "MATCH") {
        evaluation = deterministic;
      }
    }

    // AI classifications (primary for industry, business model, etc.)
    if (!evaluation) {
      const aiResult = aiClassifications.find(
        (a) => a.criterionId === criterion.id
      );
      if (aiResult) {
        evaluation = {
          criterionId: criterion.id,
          criterionName: criterion.name,
          weight: criterion.weight,
          result: aiResult.result,
          score: MATCH_SCORES[aiResult.result],
          isHardRule: false,
          disqualified: false,
          reasoning: aiResult.reasoning,
        };
      }
    }

    // Fallback for unevaluated criteria
    if (!evaluation) {
      evaluation = {
        criterionId: criterion.id,
        criterionName: criterion.name,
        weight: criterion.weight,
        result: "UNKNOWN",
        score: MATCH_SCORES.UNKNOWN,
        isHardRule: criterion.isHardRule,
        disqualified: false,
        reasoning: "Insufficient data to evaluate this criterion",
      };
    }

    evaluations.push(evaluation);
  }

  // If any hard rule disqualified, return NOT_A_FIT
  if (disqualificationReasons.length > 0) {
    return {
      icpScore: 0,
      fitTag: "NOT_A_FIT",
      recommendation: "NOT_A_FIT",
      disqualified: true,
      disqualificationReasons,
      criterionEvaluations: evaluations,
    };
  }

  // Weighted score calculation
  const scorableCriteria = evaluations.filter((e) => e.weight > 0);
  const totalWeight = scorableCriteria.reduce((sum, e) => sum + e.weight, 0);

  let icpScore = 0;
  if (totalWeight > 0) {
    const weightedSum = scorableCriteria.reduce(
      (sum, e) => sum + (e.score / 100) * e.weight,
      0
    );
    icpScore = Math.round((weightedSum / totalWeight) * 100);
  }

  // Check required criteria — only NO_MATCH fails, not UNKNOWN
  for (const criterion of activeCriteria) {
    if (!criterion.required) continue;
    const eval_ = evaluations.find((e) => e.criterionId === criterion.id);
    if (eval_ && eval_.result === "NO_MATCH") {
      disqualificationReasons.push(
        `Required criterion failed: ${criterion.name}`
      );
    }
  }

  if (disqualificationReasons.length > 0) {
    const cappedScore = Math.min(icpScore, 30);
    return {
      icpScore: cappedScore,
      fitTag: "NOT_A_FIT",
      recommendation: "NOT_A_FIT",
      disqualified: true,
      disqualificationReasons,
      criterionEvaluations: evaluations,
    };
  }

  let recommendation = deriveRecommendation(icpScore, false);
  const fitTag = deriveFitTag(icpScore, false);

  return {
    icpScore,
    fitTag,
    recommendation,
    disqualified: false,
    disqualificationReasons: [],
    criterionEvaluations: evaluations,
  };
}

export type { CompanyData, AIClassification };
