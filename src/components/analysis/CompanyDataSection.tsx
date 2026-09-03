"use client";

import type { AnalysisResult } from "@/lib/icp/types";
import {
  Building2,
  Globe,
  Briefcase,
  Users,
  DollarSign,
  MapPin,
  TrendingUp,
  FileText,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface CompanyDataSectionProps {
  companyData: Record<string, unknown>;
  companyUrl: string;
  companyName?: string;
  apolloData?: Record<string, unknown>;
}

interface DataField {
  key: string;
  label: string;
  icon: React.ReactNode;
  format?: (value: unknown) => React.ReactNode;
}

const FIELD_GROUPS: {
  title: string;
  fields: DataField[];
}[] = [
  {
    title: "Company Overview",
    fields: [
      {
        key: "name",
        label: "Company Name",
        icon: <Building2 className="h-4 w-4" />,
      },
      {
        key: "website",
        label: "Website",
        icon: <Globe className="h-4 w-4" />,
        format: (v) => <WebsiteLink url={String(v)} />,
      },
      {
        key: "businessModel",
        label: "Business Model",
        icon: <TrendingUp className="h-4 w-4" />,
        format: (v) => <ModelBadge model={String(v)} />,
      },
    ],
  },
  {
    title: "Firmographics",
    fields: [
      {
        key: "industry",
        label: "Industry",
        icon: <Briefcase className="h-4 w-4" />,
      },
      {
        key: "subIndustry",
        label: "Sub-Industry",
        icon: <Briefcase className="h-4 w-4" />,
      },
      {
        key: "employeeCount",
        label: "Employees",
        icon: <Users className="h-4 w-4" />,
        format: (v) => (
          <span className="font-semibold text-tga-teal-800">
            {Number(v).toLocaleString()}
          </span>
        ),
      },
      {
        key: "revenue",
        label: "Revenue",
        icon: <DollarSign className="h-4 w-4" />,
        format: (v) => (
          <span className="font-semibold text-tga-teal-800">${Number(v)}M USD</span>
        ),
      },
    ],
  },
  {
    title: "Location",
    fields: [
      {
        key: "country",
        label: "Country",
        icon: <MapPin className="h-4 w-4" />,
      },
      {
        key: "location",
        label: "Location",
        icon: <MapPin className="h-4 w-4" />,
      },
    ],
  },
];

function getValue(data: Record<string, unknown>, key: string): unknown {
  return data[key];
}

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

export function CompanyDataSection({
  companyData,
  companyUrl,
  companyName,
  apolloData,
}: CompanyDataSectionProps) {
  const description =
    (companyData.gptSummary as string) ||
    (companyData.description as string) ||
    undefined;
  const industrySource = companyData.industrySource as string | undefined;
  const website = (companyData.website as string) || companyUrl;

  const enrichedViaApollo = Boolean(apolloData && Object.keys(apolloData).length > 0);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-tga-teal-100 bg-tga-teal-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tga-teal-500 text-white shadow-sm shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-tga-teal-800">Company Data</h3>
            <p className="text-xs text-tga-teal-600 mt-0.5">
              Extracted from website{enrichedViaApollo ? " + Apollo enrichment" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {enrichedViaApollo && (
            <span className="badge-orange flex items-center gap-1 shrink-0">
              <Sparkles className="h-3 w-3" />
              Apollo Enriched
            </span>
          )}
          {industrySource === "gpt" && (
            <span className="badge-teal flex items-center gap-1 shrink-0">
              <Sparkles className="h-3 w-3" />
              GPT Classified
            </span>
          )}
        </div>
      </div>

      {/* Company hero strip */}
      <div className="px-4 sm:px-6 py-5 bg-gradient-to-r from-tga-teal-50 to-white border-b border-tga-teal-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-tga-teal-600 mb-1">
              Analyzed Company
            </p>
            <h4 className="text-xl font-bold text-tga-teal-900">
              {companyName ?? (companyData.name as string) ?? "Unknown Company"}
            </h4>
          </div>
          <a
            href={website.startsWith("http") ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-tga-teal-200 text-tga-teal-700 text-sm font-medium hover:border-tga-orange-400 hover:text-tga-orange-600 transition-colors shadow-sm w-full sm:w-auto"
          >
            <Globe className="h-4 w-4" />
            Visit Website
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </a>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Description */}
        {hasValue(description) && (
          <div className="rounded-xl border-2 border-tga-teal-100 bg-tga-teal-50/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-tga-teal-600" />
              <span className="text-xs font-bold uppercase tracking-wide text-tga-teal-700">
                About
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
          </div>
        )}

        {/* Grouped fields */}
        <div className="grid md:grid-cols-2 gap-6">
          {FIELD_GROUPS.map((group) => {
            const visibleFields = group.fields.filter((f) => {
              if (f.key === "website") return hasValue(website);
              return hasValue(getValue(companyData, f.key));
            });

            if (visibleFields.length === 0) return null;

            return (
              <div key={group.title} className="rounded-xl border border-tga-teal-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-tga-teal-50/80 border-b border-tga-teal-100">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-tga-teal-700">
                    {group.title}
                  </h4>
                </div>
                <div className="divide-y divide-tga-teal-50">
                  {visibleFields.map((field) => {
                    const raw =
                      field.key === "website"
                        ? website
                        : getValue(companyData, field.key);
                    const display = field.format
                      ? field.format(raw)
                      : String(raw);

                    return (
                      <div
                        key={field.key}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-tga-teal-50/30 transition-colors"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tga-orange-100 text-tga-orange-600">
                          {field.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500">{field.label}</p>
                          <div className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                            {display}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state for sparse data */}
        {!hasValue(description) &&
          FIELD_GROUPS.every((g) =>
            g.fields.every((f) => !hasValue(getValue(companyData, f.key)))
          ) && (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-10 w-10 mx-auto mb-3 text-tga-teal-300" />
              <p className="text-sm">Limited company data available from this URL.</p>
              <p className="text-xs mt-1">
                Add an Apollo API key for richer firmographic enrichment.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}

function WebsiteLink({ url }: { url: string }) {
  const href = url.startsWith("http") ? url : `https://${url}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-tga-teal-600 hover:text-tga-orange-600 transition-colors break-all"
    >
      {url.replace(/^https?:\/\//, "")}
      <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
    </a>
  );
}

function ModelBadge({ model }: { model: string }) {
  const isB2B = model.toUpperCase().includes("B2B");
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-bold ${
        isB2B
          ? "bg-tga-teal-100 text-tga-teal-800 ring-1 ring-tga-teal-200"
          : "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
      }`}
    >
      {model}
    </span>
  );
}
