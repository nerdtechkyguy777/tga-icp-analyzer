"use client";

import { useMemo, useState } from "react";
import type { AnalysisResult } from "@/lib/icp/types";
import { resolveFitTag } from "@/lib/icp/fit-tag";
import { FIT_TAG_CONFIG } from "@/lib/icp/fit-tag";
import { FitTagBadge } from "./FitTagBadge";
import { Download, ExternalLink, Search, Loader2 } from "lucide-react";
import { analysesToCsv, downloadCsv } from "@/lib/analysis/csv";
import { formatDate } from "@/lib/utils";

interface AnalysisResultsTableProps {
  results: AnalysisResult[];
  onSelectResult?: (result: AnalysisResult) => void;
  selectedId?: string;
  isProcessing?: boolean;
  processingLabel?: string;
}

export function AnalysisResultsTable({
  results,
  onSelectResult,
  selectedId,
  isProcessing = false,
  processingLabel,
}: AnalysisResultsTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return results;

    return results.filter((r) => {
      const fitLabel = FIT_TAG_CONFIG[resolveFitTag(r)].label.toLowerCase();
      const haystack = [
        r.companyName,
        r.companyUrl,
        String(r.companyData.industry ?? ""),
        String(r.companyData.subIndustry ?? ""),
        fitLabel,
        String(r.icpScore),
        r.recommendation,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [results, search]);

  function handleDownload() {
    const exportRows = search.trim() ? filtered : results;
    const csv = analysesToCsv(exportRows);
    downloadCsv(csv, `tga-icp-bulk-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function handleServerDownload() {
    const exportRows = search.trim() ? filtered : results;
    const ids = exportRows.map((r) => r.id).join(",");
    window.open(`/api/analyze/export?ids=${encodeURIComponent(ids)}`, "_blank");
  }

  if (results.length === 0 && !isProcessing) return null;

  return (
    <div className="card overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-tga-teal-50 border-b border-tga-teal-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-tga-teal-800">Bulk Results</h3>
            <p className="text-xs text-tga-teal-600 mt-0.5">
              {results.length} completed
              {isProcessing && " — more loading..."}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownload}
              disabled={filtered.length === 0}
              className="btn-secondary text-xs py-1.5 flex-1 sm:flex-none justify-center"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV
            </button>
            <button
              onClick={handleServerDownload}
              disabled={filtered.length === 0}
              className="btn-teal text-xs py-1.5 flex-1 sm:flex-none justify-center"
            >
              <Download className="h-3.5 w-3.5" />
              Export via API
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tga-teal-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, URL, industry, fit tag, or score..."
            className="input pl-9 w-full bg-white"
          />
        </div>
        {search && (
          <p className="text-xs text-tga-teal-600">
            Showing {filtered.length} of {results.length} results
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="border-b border-tga-teal-100 bg-white">
              <th className="text-left px-3 sm:px-4 py-3 font-semibold text-tga-teal-700">Company</th>
              <th className="text-left px-3 sm:px-4 py-3 font-semibold text-tga-teal-700">Score</th>
              <th className="text-left px-3 sm:px-4 py-3 font-semibold text-tga-teal-700">Fit</th>
              <th className="text-left px-3 sm:px-4 py-3 font-semibold text-tga-teal-700 hidden md:table-cell">Industry</th>
              <th className="text-left px-3 sm:px-4 py-3 font-semibold text-tga-teal-700 hidden lg:table-cell">ICP Ver.</th>
              <th className="text-left px-3 sm:px-4 py-3 font-semibold text-tga-teal-700 hidden sm:table-cell">Date</th>
              <th className="px-3 sm:px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-tga-teal-50">
            {filtered.length === 0 && !isProcessing && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No results match your search.
                </td>
              </tr>
            )}
            {filtered.map((result) => (
              <tr
                key={result.id}
                className={`hover:bg-tga-teal-50/50 transition-colors ${
                  selectedId === result.id ? "bg-tga-orange-50" : ""
                } ${onSelectResult ? "cursor-pointer" : ""}`}
                onClick={() => onSelectResult?.(result)}
              >
                <td className="px-3 sm:px-4 py-3">
                  <p className="font-semibold text-gray-900 truncate max-w-[140px] sm:max-w-none">
                    {result.companyName ?? "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[160px] sm:max-w-[220px]">
                    {result.companyUrl}
                  </p>
                </td>
                <td className="px-3 sm:px-4 py-3">
                  <span className="text-lg font-bold text-tga-teal-800">{result.icpScore}</span>
                </td>
                <td className="px-3 sm:px-4 py-3">
                  <FitTagBadge fitTag={resolveFitTag(result)} size="sm" />
                </td>
                <td className="px-3 sm:px-4 py-3 text-gray-600 max-w-[160px] truncate hidden md:table-cell">
                  {String(result.companyData.industry ?? "—")}
                </td>
                <td className="px-3 sm:px-4 py-3 text-gray-500 hidden lg:table-cell">v{result.icpVersion}</td>
                <td className="px-3 sm:px-4 py-3 text-gray-500 text-xs hidden sm:table-cell whitespace-nowrap">
                  {formatDate(result.createdAt)}
                </td>
                <td className="px-3 sm:px-4 py-3">
                  <a
                    href={result.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-tga-teal-600 hover:text-tga-orange-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
            {isProcessing && (
              <tr className="bg-tga-orange-50/50">
                <td colSpan={7} className="px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-tga-teal-700">
                    <Loader2 className="h-4 w-4 animate-spin text-tga-orange-500" />
                    {processingLabel ?? "Analyzing next company..."}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
