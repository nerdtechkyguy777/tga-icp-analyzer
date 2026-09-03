import type { AnalysisResult, FitTag, Recommendation } from "./types";

export const FIT_TAG_THRESHOLDS = {
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25,
} as const;

export function deriveFitTag(
  icpScore: number,
  disqualified: boolean
): FitTag {
  if (disqualified || icpScore < FIT_TAG_THRESHOLDS.LOW) return "NOT_A_FIT";
  if (icpScore >= FIT_TAG_THRESHOLDS.HIGH) return "HIGH_FIT";
  if (icpScore >= FIT_TAG_THRESHOLDS.MEDIUM) return "MEDIUM_FIT";
  return "LOW_FIT";
}

export function recommendationToFitTag(recommendation: Recommendation): FitTag {
  const map: Record<Recommendation, FitTag> = {
    HIGH_PRIORITY: "HIGH_FIT",
    MEDIUM_PRIORITY: "MEDIUM_FIT",
    LOW_PRIORITY: "LOW_FIT",
    NOT_A_FIT: "NOT_A_FIT",
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
  NOT_A_FIT: {
    label: "Not a Fit",
    badge: "badge-red",
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
  },
};
