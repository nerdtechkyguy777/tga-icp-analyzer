import type { AnalysisResult, FitTag, Recommendation } from "./types";

/** Score thresholds: High 80+, Medium 50–79, Low 20–49, Junk 0–19 */
export const FIT_TAG_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 50,
  LOW: 20,
} as const;

export const FIT_SCORE_RANGES = {
  HIGH_FIT: "80 – 100",
  MEDIUM_FIT: "50 – 79",
  LOW_FIT: "20 – 49",
  JUNK: "0 – 19",
} as const;

export function deriveFitTag(
  icpScore: number,
  disqualified: boolean
): FitTag {
  if (disqualified) return "NOT_A_FIT";
  if (icpScore < FIT_TAG_THRESHOLDS.LOW) return "JUNK";
  if (icpScore >= FIT_TAG_THRESHOLDS.HIGH) return "HIGH_FIT";
  if (icpScore >= FIT_TAG_THRESHOLDS.MEDIUM) return "MEDIUM_FIT";
  return "LOW_FIT";
}

export function deriveRecommendation(
  icpScore: number,
  disqualified: boolean
): Recommendation {
  if (disqualified) return "NOT_A_FIT";
  if (icpScore >= FIT_TAG_THRESHOLDS.HIGH) return "HIGH_PRIORITY";
  if (icpScore >= FIT_TAG_THRESHOLDS.MEDIUM) return "MEDIUM_PRIORITY";
  if (icpScore >= FIT_TAG_THRESHOLDS.LOW) return "LOW_PRIORITY";
  return "NOT_A_FIT";
}

export function recommendationToFitTag(recommendation: Recommendation): FitTag {
  const map: Record<Recommendation, FitTag> = {
    HIGH_PRIORITY: "HIGH_FIT",
    MEDIUM_PRIORITY: "MEDIUM_FIT",
    LOW_PRIORITY: "LOW_FIT",
    NOT_A_FIT: "JUNK",
  };
  return map[recommendation];
}

export function resolveFitTag(result: Pick<
  AnalysisResult,
  "fitTag" | "icpScore" | "disqualified" | "recommendation"
>): FitTag {
  if (result.fitTag) return result.fitTag;
  return deriveFitTag(result.icpScore, result.disqualified);
}

export const FIT_TAG_CONFIG: Record<
  FitTag,
  { label: string; badge: string; bg: string; text: string; border: string }
> = {
  HIGH_FIT: {
    label: "High Fit",
    badge: "badge-green",
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-200",
  },
  MEDIUM_FIT: {
    label: "Medium Fit",
    badge: "badge-yellow",
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    border: "border-yellow-200",
  },
  LOW_FIT: {
    label: "Low Fit",
    badge: "badge-blue",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  JUNK: {
    label: "Junk",
    badge: "badge-red",
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-300",
  },
  NOT_A_FIT: {
    label: "Not a Fit",
    badge: "badge-red",
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
  },
};
