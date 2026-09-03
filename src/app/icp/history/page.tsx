"use client";

import { useEffect, useState } from "react";
import type { ICPVersionRecord } from "@/lib/icp/types";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { History, RotateCcw, Eye } from "lucide-react";
import Link from "next/link";

export default function ICPHistoryPage() {
  const [history, setHistory] = useState<ICPVersionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/icp/history")
      .then((r) => r.json())
      .then(setHistory)
      .finally(() => setLoading(false));
  }, []);

  async function handleRestore(version: string) {
    if (!confirm(`Restore ICP from version ${version}? This will create a new version.`)) return;

    setRestoring(version);
    setMessage(null);

    try {
      const res = await fetch(`/api/icp/history/${version}`, {
        method: "POST",
        headers: {
          "X-User-Role": "admin",
          "X-User-Email": "admin@tga.com",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.errors?.join(", ") ?? "Restore failed");
        return;
      }

      setMessage(`Restored successfully. New version: ${data.version}`);
      const updated = await fetch("/api/icp/history").then((r) => r.json());
      setHistory(updated);
    } catch {
      setMessage("Network error during restore");
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="ICP Change History"
        description="Track all ICP Knowledge Base versions and restore previous configurations"
        icon={<History className="h-6 w-6 text-white" />}
      />

      {message && (
        <div className="mb-4 p-4 rounded-xl text-sm bg-emerald-50 text-emerald-800 border-2 border-emerald-200">
          {message}
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-tga-teal-600">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">No version history available.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-tga-teal-100 bg-tga-teal-50">
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-bold text-tga-teal-700 uppercase tracking-wide">
                  Version
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-bold text-tga-teal-700 uppercase tracking-wide">
                  Date
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-bold text-tga-teal-700 uppercase tracking-wide hidden sm:table-cell">
                  Updated By
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-bold text-tga-teal-700 uppercase tracking-wide">
                  Changes
                </th>
                <th className="text-right px-4 sm:px-6 py-3 text-xs font-bold text-tga-teal-700 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tga-teal-50">
              {history.map((record, index) => (
                <tr key={record.version} className="hover:bg-tga-teal-50/50 transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <span className="badge-teal">v{record.version}</span>
                    {index === 0 && <span className="ml-2 badge-orange">Current</span>}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(record.updatedAt)}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{record.updatedBy}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 max-w-[120px] sm:max-w-xs truncate">
                    {record.changeSummary}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/icp/history/${record.version}`}
                        className="btn-ghost p-2"
                        title="View version"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {index !== 0 && (
                        <button
                          onClick={() => handleRestore(record.version)}
                          disabled={restoring === record.version}
                          className="btn-ghost p-2 text-tga-orange-600 hover:bg-tga-orange-50"
                          title="Restore this version"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
