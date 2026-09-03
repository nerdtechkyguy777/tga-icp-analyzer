// ─── ICP Knowledge Base Types ───────────────────────────────────────────────
// Central schema — all ICP logic consumes these types dynamically.

export type CriterionType =
  | "industry"
  | "sub_industry"
  | "employee_size"
  | "revenue_range"
  | "country"
  | "location"
  | "business_model"
  | "product_service"
  | "technology"
  | "job_title"
  | "company_characteristic"
  | "signal"
  | "exclusion"
  | "custom";

export type RuleOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "in"
  | "not_in"
  | "gte"
  | "lte"
  | "between"
  | "exists";

export type MatchResult = "MATCH" | "PARTIAL_MATCH" | "NO_MATCH" | "UNKNOWN";

export type Recommendation =
  | "HIGH_PRIORITY"
  | "MEDIUM_PRIORITY"
  | "LOW_PRIORITY"
  | "NOT_A_FIT";

export type FitTag = "HIGH_FIT" | "MEDIUM_FIT" | "LOW_FIT" | "NOT_A_FIT";

export interface ICPRule {
  id: string;
  field: string;
  operator: RuleOperator;
  value: string | number | boolean | string[] | [number, number];
  description?: string;
  isHardRule: boolean;
}

export interface ICPCriterion {
  id: string;
  name: string;
  description?: string;
  type: CriterionType;
  weight: number;
  required: boolean;
  active: boolean;
  order: number;
  isHardRule: boolean;
  rules: ICPRule[];
  positiveSignals?: string[];
  negativeSignals?: string[];
  /** For list-type criteria (industries, technologies, etc.) */
  values?: string[];
  /** For range-type criteria (employee size, revenue) */
  minValue?: number;
  maxValue?: number;
  /** For business model criteria */
  preferredModels?: string[];
}

export interface ICPKnowledgeBase {
  version: string;
  name: string;
  description: string;
  criteria: ICPCriterion[];
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    updatedBy?: string;
    changeSummary?: string;
  };
}

export interface ICPVersionRecord {
  version: string;
  updatedAt: string;
  updatedBy: string;
  changeSummary: string;
  knowledgeBase: ICPKnowledgeBase;
}

export interface CriterionEvaluation {
  criterionId: string;
  criterionName: string;
  weight: number;
  result: MatchResult;
  score: number;
  isHardRule: boolean;
  disqualified: boolean;
  reasoning: string;
}

export interface AnalysisResult {
  id: string;
  companyUrl: string;
  companyName?: string;
  icpVersion: string;
  icpScore: number;
  fitTag?: FitTag;
  recommendation: Recommendation;
  disqualified: boolean;
  disqualificationReasons: string[];
  criterionEvaluations: CriterionEvaluation[];
  companyData: Record<string, unknown>;
  apolloData?: Record<string, unknown>;
  createdAt: string;
}

export interface UserRole {
  id: string;
  email: string;
  role: "admin" | "user";
}

export interface PublishICPRequest {
  knowledgeBase: Omit<ICPKnowledgeBase, "version" | "metadata">;
  updatedBy: string;
  changeSummary: string;
}

export interface UpdateCriterionRequest {
  criterion: ICPCriterion;
  updatedBy: string;
  changeSummary?: string;
}
