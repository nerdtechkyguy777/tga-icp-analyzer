"use client";

import { useState } from "react";
import type { ICPCriterion, ICPKnowledgeBase } from "@/lib/icp/types";
import { CriterionEditor } from "./CriterionEditor";
import { AddCriterionModal } from "./AddCriterionModal";
import { PublishConfirmModal } from "./PublishConfirmModal";
import { Plus, Save, GripVertical } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ICPEditorProps {
  initialICP: ICPKnowledgeBase;
}

export function ICPEditor({ initialICP }: ICPEditorProps) {
  const [icp, setIcp] = useState<ICPKnowledgeBase>(initialICP);
  const [isDirty, setIsDirty] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const sortedCriteria = [...icp.criteria].sort((a, b) => a.order - b.order);
  const activeWeight = sortedCriteria.filter((c) => c.active).reduce((s, c) => s + c.weight, 0);

  function updateCriterion(updated: ICPCriterion) {
    setIcp((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c) => (c.id === updated.id ? updated : c)),
    }));
    setIsDirty(true);
    setMessage(null);
  }

  function deleteCriterion(id: string) {
    setIcp((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((c) => c.id !== id),
    }));
    setIsDirty(true);
  }

  function addCriterion(criterion: ICPCriterion) {
    setIcp((prev) => ({
      ...prev,
      criteria: [...prev.criteria, { ...criterion, order: prev.criteria.length }],
    }));
    setIsDirty(true);
    setShowAddModal(false);
  }

  function moveCriterion(index: number, direction: "up" | "down") {
    const criteria = [...sortedCriteria];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= criteria.length) return;

    [criteria[index], criteria[targetIndex]] = [criteria[targetIndex], criteria[index]];
    const reordered = criteria.map((c, i) => ({ ...c, order: i }));

    setIcp((prev) => ({ ...prev, criteria: reordered }));
    setIsDirty(true);
  }

  async function handlePublish(changeSummary: string) {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/icp", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": "admin",
          "X-User-Email": "admin@tga.com",
        },
        body: JSON.stringify({
          knowledgeBase: {
            name: icp.name,
            description: icp.description,
            criteria: icp.criteria,
          },
          updatedBy: "Admin",
          changeSummary,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.errors?.join(", ") ?? data.error ?? "Publish failed" });
        return;
      }

      setIcp((prev) => ({
        ...prev,
        version: data.version,
        metadata: {
          ...prev.metadata,
          updatedAt: new Date().toISOString(),
          updatedBy: "Admin",
          changeSummary,
        },
      }));
      setIsDirty(false);
      setShowPublishModal(false);
      setMessage({ type: "success", text: `ICP Version ${data.version} published successfully` });
    } catch {
      setMessage({ type: "error", text: "Network error — could not publish ICP" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* ICP info bar */}
      <div className="card-teal p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-tga-teal-800">{icp.name}</h2>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
            <span className="badge-teal">Version {icp.version}</span>
            {icp.metadata?.updatedAt && (
              <span className="text-tga-teal-600">Updated {formatDate(icp.metadata.updatedAt)}</span>
            )}
            {icp.metadata?.updatedBy && (
              <span className="text-gray-500">by {icp.metadata.updatedBy}</span>
            )}
          </div>
          {icp.description && (
            <p className="text-gray-600 mt-2 text-sm">{icp.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button onClick={() => setShowAddModal(true)} className="btn-secondary flex-1 sm:flex-none">
            <Plus className="h-4 w-4" />
            Add
          </button>
          <button
            onClick={() => setShowPublishModal(true)}
            disabled={!isDirty || saving}
            className="btn-primary flex-1 sm:flex-none"
          >
            <Save className="h-4 w-4" />
            Publish
          </button>
        </div>
      </div>

      {/* Weight summary */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-l-4 border-l-tga-orange-500">
        <div>
          <span className="text-sm font-medium text-tga-teal-600">Total Active Weight</span>
          <span className={`ml-2 text-xl font-bold ${activeWeight > 100 ? "text-red-600" : "text-tga-teal-800"}`}>
            {activeWeight} / 100
          </span>
        </div>
        <div className="badge-orange w-fit">
          {sortedCriteria.filter((c) => c.active).length} active criteria
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Criteria list */}
      <div className="space-y-4">
        {sortedCriteria.map((criterion, index) => (
          <div key={criterion.id} className="flex gap-1 sm:gap-2">
            <div className="hidden sm:flex flex-col items-center pt-4 gap-1">
              <button
                onClick={() => moveCriterion(index, "up")}
                disabled={index === 0}
                className="btn-ghost p-1 disabled:opacity-30"
                title="Move up"
              >
                <GripVertical className="h-4 w-4 rotate-90" />
              </button>
            </div>
            <div className="flex-1">
              <CriterionEditor
                criterion={criterion}
                onChange={updateCriterion}
                onDelete={deleteCriterion}
              />
            </div>
          </div>
        ))}
      </div>

      {sortedCriteria.length === 0 && (
        <div className="card p-8 text-center text-gray-500">
          <p>No criteria defined. Add your first ICP criterion to get started.</p>
        </div>
      )}

      {showAddModal && (
        <AddCriterionModal
          onAdd={addCriterion}
          onClose={() => setShowAddModal(false)}
          nextOrder={icp.criteria.length}
        />
      )}

      {showPublishModal && (
        <PublishConfirmModal
          currentVersion={icp.version}
          onConfirm={handlePublish}
          onClose={() => setShowPublishModal(false)}
          saving={saving}
        />
      )}
    </div>
  );
}
