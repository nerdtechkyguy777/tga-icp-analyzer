import { getVersion } from "@/lib/icp/service";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ICPVersionPage({
  params,
}: {
  params: Promise<{ version: string }>;
}) {
  const { version } = await params;
  const record = await getVersion(version);

  if (!record) notFound();

  const kb = record.knowledgeBase;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/icp/history" className="btn-ghost mb-4 inline-flex">
        <ArrowLeft className="h-4 w-4" />
        Back to History
      </Link>

      <PageHeader
        title={`ICP Version ${record.version}`}
        description={`${record.changeSummary} — updated by ${record.updatedBy} on ${formatDate(record.updatedAt)}`}
        icon={<FileText className="h-6 w-6 text-white" />}
      />

      <div className="space-y-4">
        {kb.criteria
          .sort((a, b) => a.order - b.order)
          .map((criterion) => (
            <div key={criterion.id} className="card-teal p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                <h3 className="font-semibold text-tga-teal-800 break-words">{criterion.name}</h3>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <span className="badge-teal capitalize">
                    {criterion.type.replace(/_/g, " ")}
                  </span>
                  <span className="badge-orange">Weight: {criterion.weight}</span>
                  {!criterion.active && <span className="badge-gray">Disabled</span>}
                </div>
              </div>
              {criterion.description && (
                <p className="text-sm text-gray-600 mb-3">{criterion.description}</p>
              )}
              {criterion.values && criterion.values.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {criterion.values.map((v) => (
                    <span key={v} className="badge-teal">
                      {v}
                    </span>
                  ))}
                </div>
              )}
              {(criterion.minValue !== undefined || criterion.maxValue !== undefined) && (
                <p className="text-sm text-tga-teal-700 mt-2 font-medium">
                  Range: {criterion.minValue ?? "—"} to {criterion.maxValue ?? "—"}
                </p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
