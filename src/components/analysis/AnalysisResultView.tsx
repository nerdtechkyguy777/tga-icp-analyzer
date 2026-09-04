"use client";

import type { AnalysisResult } from "@/lib/icp/types";
import { formatDate } from "@/lib/utils";
import { FIT_TAG_CONFIG, FIT_SCORE_RANGES, resolveFitTag } from "@/lib/icp/fit-tag";
import { FitTagBadge } from "./FitTagBadge";
import { CompanyDataSection } from "./CompanyDataSection";
import { analysesToCsv, downloadCsv } from "@/lib/analysis/csv";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Shield,
  Download,
} from "lucide-react";

interface AnalysisResultViewProps {
  result: AnalysisResult;
}

export function AnalysisResultView({ result }: AnalysisResultViewProps) {
  const fitTag = resolveFitTag(result);
  const fit = FIT_TAG_CONFIG[fitTag];

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className={`card p-4 sm:p-6 border-2 ${fit.bg} ${fit.border}`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words">
              {result.companyName ?? "Unknown Company"}
            </h2>
            <p className="text-sm text-gray-600 mt-1 break-all">{result.companyUrl}</p>
            <div className="mt-3">
              <FitTagBadge fitTag={fitTag} size="lg" />
            </div>
          </div>
          <div className="sm:text-right shrink-0">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              ICP Score
            </div>
            <div className={`text-4xl font-bold ${fit.text}`}>{result.icpScore}</div>
            <div className={`text-sm font-medium ${fit.text}`}>/ 100</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-4 text-sm text-gray-600">
          <span>
            ICP Version: <strong>{result.icpVersion}</strong>
          </span>
          <span>Analyzed: {formatDate(result.createdAt)}</span>
          <button
            onClick={() =>
              downloadCsv(
                analysesToCsv([result]),
                `tga-icp-${result.companyName?.replace(/\s+/g, "-").toLowerCase() ?? "analysis"}.csv`
              )
            }
            className="btn-secondary text-xs py-1 sm:ml-auto w-full sm:w-auto justify-center"
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </button>
        </div>

        {result.disqualified && result.disqualificationReasons.length > 0 && (
          <div className="mt-4 p-3 bg-red-100 rounded-lg">
            <p className="text-sm font-medium text-red-800 flex items-center gap-1">
              <Shield className="h-4 w-4" /> Disqualified
            </p>
            <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
              {result.disqualificationReasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Fit summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <FitSummaryCard
          label="High Fit"
          range={FIT_SCORE_RANGES.HIGH_FIT}
          active={fitTag === "HIGH_FIT"}
          color="border-green-500 bg-green-50"
        />
        <FitSummaryCard
          label="Medium Fit"
          range={FIT_SCORE_RANGES.MEDIUM_FIT}
          active={fitTag === "MEDIUM_FIT"}
          color="border-yellow-500 bg-yellow-50"
        />
        <FitSummaryCard
          label="Low Fit"
          range={FIT_SCORE_RANGES.LOW_FIT}
          active={fitTag === "LOW_FIT"}
          color="border-blue-500 bg-blue-50"
        />
        <FitSummaryCard
          label="Junk"
          range={FIT_SCORE_RANGES.JUNK}
          active={fitTag === "JUNK"}
          color="border-gray-400 bg-gray-50"
        />
      </div>

      {/* Criterion evaluations */}
      <div className="card">
        <div className="px-6 py-4 border-b border-tga-teal-100 bg-tga-teal-50">
          <h3 className="font-bold text-tga-teal-800">Criterion Evaluations</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {result.criterionEvaluations.map((eval_) => (
            <div key={eval_.criterionId} className="px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-start sm:items-center gap-2 min-w-0">
                  <ResultIcon result={eval_.result} />
                  <span className="font-medium text-gray-900 break-words">{eval_.criterionName}</span>
                  {eval_.isHardRule && (
                    <span className="badge-red text-xs shrink-0">Hard Rule</span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 ml-7 sm:ml-0 flex-wrap">
                  <MatchBadge result={eval_.result} />
                  {eval_.weight > 0 ? (
                    <span className="text-sm text-gray-500">Weight: {eval_.weight}</span>
                  ) : (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Info only</span>
                  )}
                  <span className="text-sm font-medium">{eval_.score}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1 ml-0 sm:ml-7 break-words">{eval_.reasoning}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Company data */}
      <CompanyDataSection
        companyData={result.companyData}
        companyUrl={result.companyUrl}
        companyName={result.companyName}
        apolloData={result.apolloData}
      />
    </div>
  );
}

function FitSummaryCard({
  label,
  range,
  active,
  color,
}: {
  label: string;
  range: string;
  active: boolean;
  color: string;
}) {
  return (
    <div
      className={`card p-4 border-2 transition-all ${
        active ? color : "border-transparent opacity-50"
      }`}
    >
      <p className="font-semibold text-gray-900 text-sm">{label}</p>
      <p className="text-xs text-gray-500 mt-1">Score {range}</p>
      {active && (
        <p className="text-xs font-medium text-gray-700 mt-2">← Current</p>
      )}
    </div>
  );
}

function ResultIcon({ result }: { result: string }) {
  switch (result) {
    case "MATCH":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "PARTIAL_MATCH":
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    case "NO_MATCH":
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <HelpCircle className="h-5 w-5 text-gray-400" />;
  }
}

function MatchBadge({ result }: { result: string }) {
  const styles: Record<string, string> = {
    MATCH: "badge-green",
    PARTIAL_MATCH: "badge-yellow",
    NO_MATCH: "badge-red",
    UNKNOWN: "badge-gray",
  };
  const labels: Record<string, string> = {
    MATCH: "Match",
    PARTIAL_MATCH: "Partial",
    NO_MATCH: "No Match",
    UNKNOWN: "Unknown",
  };
  return (
    <span className={styles[result] ?? "badge-gray"}>
      {labels[result] ?? result}
    </span>
  );
}
