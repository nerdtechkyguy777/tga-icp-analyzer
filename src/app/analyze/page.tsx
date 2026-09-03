"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/icp/types";
import { AnalysisResultView } from "@/components/analysis/AnalysisResultView";
import { BulkAnalyzePanel } from "@/components/analysis/BulkAnalyzePanel";
import { AnalysisResultsTable } from "@/components/analysis/AnalysisResultsTable";
import { AnalyzingPopup } from "@/components/analysis/AnalyzingPopup";
import { PageHeader } from "@/components/layout/PageHeader";
import { Search, Loader2, List, Upload } from "lucide-react";
import { cn, normalizeCompanyUrl, isValidCompanyUrl } from "@/lib/utils";

type Tab = "single" | "bulk";

export default function AnalyzePage() {
  const [tab, setTab] = useState<Tab>("single");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [bulkResults, setBulkResults] = useState<AnalysisResult[]>([]);
  const [bulkErrors, setBulkErrors] = useState<{ url: string; error: string }[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkCurrentUrl, setBulkCurrentUrl] = useState<string | null>(null);
  const [selectedBulkResult, setSelectedBulkResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    if (!isValidCompanyUrl(trimmed)) {
      setError("Enter a valid domain or URL (e.g. konecranes.com or https://konecranes.com)");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizeCompanyUrl(trimmed) }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.errors?.join(", ") ?? data.error ?? "Analysis failed");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error — could not reach the analysis API");
    } finally {
      setLoading(false);
    }
  }

  function handleBulkStart(total: number) {
    setBulkResults([]);
    setBulkErrors([]);
    setSelectedBulkResult(null);
    setBulkProcessing(true);
    setBulkProgress({ current: 0, total });
    setBulkCurrentUrl(null);
    setResult(null);
  }

  function handleBulkProgress(current: number, total: number, analyzeUrl: string) {
    setBulkProgress({ current, total });
    setBulkCurrentUrl(analyzeUrl);
  }

  function handleBulkResult(result: AnalysisResult) {
    setBulkResults((prev) => [...prev, result]);
    setSelectedBulkResult((prev) => prev ?? result);
    setBulkProgress((p) => ({ ...p, current: p.current + 1 }));
  }

  function handleBulkError(err: { url: string; error: string }) {
    setBulkErrors((prev) => [...prev, err]);
    setBulkProgress((p) => ({ ...p, current: p.current + 1 }));
  }

  function handleBulkFinished() {
    setBulkProcessing(false);
    setBulkCurrentUrl(null);
  }

  const showBulkSection = tab === "bulk" && (bulkResults.length > 0 || bulkProcessing);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AnalyzingPopup
        visible={loading || bulkProcessing}
        title={bulkProcessing ? "Bulk ICP Analysis" : "AI ICP Analysis"}
        subtitle={
          bulkProcessing
            ? bulkCurrentUrl ?? undefined
            : url.trim()
              ? normalizeCompanyUrl(url.trim())
              : undefined
        }
        progress={bulkProcessing ? bulkProgress : undefined}
        animateSteps={!bulkProcessing}
      />

      <PageHeader
        title="Analyze Companies"
        description="Single URL analysis or bulk CSV upload against the current ICP Knowledge Base"
        icon={<Search className="h-6 w-6 text-white" />}
      />

      <div className="flex flex-col sm:flex-row gap-2 mb-6 p-1 bg-white rounded-xl border border-tga-teal-100 shadow-sm w-full sm:w-fit">
        <button
          onClick={() => setTab("single")}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-1 sm:flex-none",
            tab === "single"
              ? "bg-tga-teal-500 text-white shadow-md"
              : "text-tga-teal-700 hover:bg-tga-teal-50"
          )}
        >
          <Search className="h-4 w-4" />
          Single URL
        </button>
        <button
          onClick={() => setTab("bulk")}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-1 sm:flex-none",
            tab === "bulk"
              ? "bg-tga-orange-500 text-white shadow-md"
              : "text-tga-teal-700 hover:bg-tga-teal-50"
          )}
        >
          <Upload className="h-4 w-4" />
          Bulk CSV Upload
        </button>
      </div>

      {tab === "single" && (
        <form onSubmit={handleAnalyze} className="card-orange p-6 mb-8">
          <label className="label">Company URL</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              className="input flex-1 min-w-0"
              type="text"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="konecranes.com or https://example.com"
              required
            />
            <button type="submit" disabled={loading} className="btn-primary shrink-0 w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Analyze
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-tga-teal-600 mt-3 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-tga-orange-400" />
            GPT industry classification + ICP scoring + optional Apollo enrichment
          </p>
        </form>
      )}

      {tab === "bulk" && (
        <div className="mb-8">
          <BulkAnalyzePanel
            onStart={handleBulkStart}
            onProgress={handleBulkProgress}
            onResult={handleBulkResult}
            onError={handleBulkError}
            onFinished={handleBulkFinished}
          />
        </div>
      )}

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-red-50 text-red-800 border-2 border-red-200 text-sm">
          {error}
        </div>
      )}

      {tab === "single" && result && <AnalysisResultView result={result} />}

      {showBulkSection && (
        <div className="space-y-6">
          <AnalysisResultsTable
            results={bulkResults}
            selectedId={selectedBulkResult?.id}
            onSelectResult={setSelectedBulkResult}
            isProcessing={bulkProcessing}
            processingLabel={
              bulkProcessing
                ? `Analyzing ${bulkProgress.current + 1} of ${bulkProgress.total}...`
                : undefined
            }
          />

          {bulkErrors.length > 0 && (
            <div className="card p-4 border-l-4 border-l-red-500">
              <h4 className="font-semibold text-red-800 flex items-center gap-2">
                <List className="h-4 w-4" />
                {bulkErrors.length} URL{bulkErrors.length !== 1 ? "s" : ""} failed
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-red-700">
                {bulkErrors.map((e) => (
                  <li key={e.url}>
                    <span className="font-medium">{e.url}</span>: {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedBulkResult && (
            <div>
              <h3 className="font-bold text-tga-teal-800 mb-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                Detail View
                <span className="text-sm font-normal text-gray-500 truncate">
                  — {selectedBulkResult.companyName ?? selectedBulkResult.companyUrl}
                </span>
              </h3>
              <AnalysisResultView result={selectedBulkResult} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
