"use client";

import { useRef, useState } from "react";
import type { AnalysisResult } from "@/lib/icp/types";
import { generateSampleCsv, parseUrlsFromCsv } from "@/lib/analysis/csv";
import { MAX_BULK_URLS } from "@/lib/analysis/constants";
import { normalizeCompanyUrl } from "@/lib/utils";
import { Upload, Loader2, FileSpreadsheet, Download } from "lucide-react";
import { downloadCsv } from "@/lib/analysis/csv";

interface BulkAnalyzePanelProps {
  onStart: (total: number) => void;
  onProgress?: (current: number, total: number, url: string) => void;
  onResult: (result: AnalysisResult) => void;
  onError: (error: { url: string; error: string }) => void;
  onFinished: () => void;
}

export function BulkAnalyzePanel({
  onStart,
  onProgress,
  onResult,
  onError,
  onFinished,
}: BulkAnalyzePanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewCount, setPreviewCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);

    const text = await selected.text();
    const rows = parseUrlsFromCsv(text);
    setPreviewCount(rows.length);

    if (rows.length === 0) {
      setError("No valid URLs found. CSV must have a header row with a single required column: url");
    } else if (rows.length > MAX_BULK_URLS) {
      setError(`Maximum ${MAX_BULK_URLS} URLs per batch. Your file has ${rows.length}.`);
    }
  }

  function downloadSample() {
    downloadCsv(generateSampleCsv(), "tga-icp-upload-template.csv");
  }

  async function handleBulkAnalyze() {
    if (!file) return;

    const rows = parseUrlsFromCsv(await file.text());
    if (rows.length === 0 || rows.length > MAX_BULK_URLS) return;

    setLoading(true);
    setError(null);
    setProgress({ current: 0, total: rows.length });
    onStart(rows.length);

    for (let i = 0; i < rows.length; i++) {
      const normalized = normalizeCompanyUrl(rows[i].url);
      setCurrentUrl(normalized);
      onProgress?.(i, rows.length, normalized);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: normalized }),
        });

        const data = await res.json();

        if (!res.ok) {
          onError({
            url: normalized,
            error: data.errors?.join(", ") ?? data.error ?? "Analysis failed",
          });
        } else {
          onResult(data as AnalysisResult);
        }
      } catch {
        onError({ url: normalized, error: "Network error" });
      }

      setProgress({ current: i + 1, total: rows.length });
    }

    setCurrentUrl(null);
    setLoading(false);
    onFinished();
  }

  return (
    <div className="card-teal p-4 sm:p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tga-orange-100 text-tga-orange-600">
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-tga-teal-800">Bulk CSV Upload</h3>
          <p className="text-sm text-gray-600 mt-1">
            Upload a CSV with company URLs — results appear one by one as each is analyzed (max{" "}
            {MAX_BULK_URLS}).
          </p>
        </div>
      </div>

      <div
        onClick={() => !loading && fileRef.current?.click()}
        className={`border-2 border-dashed border-tga-teal-300 rounded-xl p-8 text-center transition-colors ${
          loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-tga-orange-400 hover:bg-tga-orange-50/30"
        }`}
      >
        <Upload className="h-8 w-8 mx-auto mb-3 text-tga-teal-400" />
        {file ? (
          <>
            <p className="font-semibold text-tga-teal-800">{file.name}</p>
            <p className="text-sm text-tga-teal-600 mt-1">
              {previewCount} URL{previewCount !== 1 ? "s" : ""} detected
            </p>
          </>
        ) : (
          <>
            <p className="font-medium text-gray-700">Click to upload CSV</p>
            <p className="text-xs text-gray-500 mt-1">
              Required column: <code className="bg-gray-100 px-1 rounded">url</code> (website URL only)
            </p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          disabled={loading}
          onChange={handleFileSelect}
        />
      </div>

      <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
        <button onClick={downloadSample} className="btn-ghost text-sm" disabled={loading}>
          <Download className="h-4 w-4" />
          Download sample CSV template
        </button>

        <button
          onClick={handleBulkAnalyze}
          disabled={!file || previewCount === 0 || previewCount > MAX_BULK_URLS || loading}
          className="btn-primary w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing {progress.current}/{progress.total}...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Analyze {previewCount > 0 ? `${previewCount} Companies` : "CSV"}
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="mt-4">
          <div className="h-2 bg-tga-teal-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-tga-orange-500 transition-all duration-500 rounded-full"
              style={{
                width: progress.total
                  ? `${(progress.current / progress.total) * 100}%`
                  : "10%",
              }}
            />
          </div>
          <p className="text-xs text-tga-teal-600 mt-2 text-center">
            {currentUrl
              ? `Processing: ${currentUrl.replace(/^https?:\/\//, "")}`
              : "Starting bulk analysis..."}
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
