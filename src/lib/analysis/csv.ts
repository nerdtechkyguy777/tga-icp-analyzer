import type { AnalysisResult } from "@/lib/icp/types";
import { resolveFitTag } from "@/lib/icp/fit-tag";
import { FIT_TAG_CONFIG } from "@/lib/icp/fit-tag";
import { normalizeCompanyUrl } from "@/lib/utils";

export interface ParsedCsvRow {
  url: string;
}

/** Parse CSV — requires a header row with `url` column; each row is one website URL */
export function parseUrlsFromCsv(csvText: string): ParsedCsvRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z_]/g, ""));
  const urlIdx = header.findIndex((h) => h === "url");

  if (urlIdx < 0) {
    return [];
  }

  const rows: ParsedCsvRow[] = [];
  const seen = new Set<string>();

  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const rawUrl = cols[urlIdx]?.trim();
    if (!rawUrl) continue;

    const normalized = normalizeCompanyUrl(rawUrl);
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    rows.push({ url: normalized });
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function generateSampleCsv(): string {
  return `url
konecranes.com
https://proshort.ai/`;
}

export function analysesToCsv(results: AnalysisResult[]): string {
  const headers = [
    "company_name",
    "company_url",
    "icp_score",
    "fit_tag",
    "recommendation",
    "icp_version",
    "disqualified",
    "disqualification_reasons",
    "industry",
    "sub_industry",
    "business_model",
    "employee_count",
    "country",
    "location",
    "company_type",
    "industry_source",
    "analyzed_at",
  ];

  const rows = results.map((r) => {
    const d = r.companyData;
    const fitTag = resolveFitTag(r);
    return [
      r.companyName ?? String(d.name ?? ""),
      r.companyUrl,
      String(r.icpScore),
      FIT_TAG_CONFIG[fitTag].label,
      r.recommendation,
      r.icpVersion,
      r.disqualified ? "Yes" : "No",
      r.disqualificationReasons.join("; "),
      String(d.industry ?? ""),
      String(d.subIndustry ?? ""),
      String(d.businessModel ?? ""),
      d.employeeCount != null ? String(d.employeeCount) : "",
      String(d.country ?? ""),
      String(d.location ?? ""),
      String(d.companyType ?? ""),
      String(d.industrySource ?? ""),
      r.createdAt,
    ].map(escapeCsvField);
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
