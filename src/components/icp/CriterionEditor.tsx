"use client";

import { useState } from "react";
import type { ICPCriterion } from "@/lib/icp/types";
import { TagInput } from "./TagInput";
import { ChevronDown, ChevronUp, Trash2, Shield, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface CriterionEditorProps {
  criterion: ICPCriterion;
  onChange: (criterion: ICPCriterion) => void;
  onDelete: (id: string) => void;
}

export function CriterionEditor({ criterion, onChange, onDelete }: CriterionEditorProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("card", !criterion.active && "opacity-60")}>
      <div
        className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h3 className="font-semibold text-tga-teal-800 break-words">{criterion.name}</h3>
          <span className="badge-teal capitalize">{criterion.type.replace(/_/g, " ")}</span>
          {criterion.isHardRule && (
            <span className="badge-red flex items-center gap-1">
              <Shield className="h-3 w-3" /> Hard Rule
            </span>
          )}
          {!criterion.isHardRule && (
            <span className="badge-blue flex items-center gap-1">
              <Brain className="h-3 w-3" /> AI
            </span>
          )}
          {!criterion.active && <span className="badge-gray">Disabled</span>}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
          <span className="text-sm text-gray-500">Weight: {criterion.weight}</span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 sm:px-6 pb-6 border-t border-gray-100 pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Criterion Name</label>
              <input
                className="input"
                value={criterion.name}
                onChange={(e) => onChange({ ...criterion, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={criterion.type}
                onChange={(e) =>
                  onChange({ ...criterion, type: e.target.value as ICPCriterion["type"] })
                }
              >
                {[
                  "industry", "sub_industry", "employee_size", "revenue_range",
                  "country", "location", "business_model", "product_service",
                  "technology", "job_title", "company_characteristic", "signal",
                  "exclusion", "custom",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={2}
              value={criterion.description ?? ""}
              onChange={(e) => onChange({ ...criterion, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="label">Weight</label>
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                value={criterion.weight}
                onChange={(e) => onChange({ ...criterion, weight: Number(e.target.value) })}
              />
            </div>

            {(criterion.type === "employee_size" || criterion.type === "revenue_range") && (
              <>
                <div>
                  <label className="label">Minimum</label>
                  <input
                    className="input"
                    type="number"
                    value={criterion.minValue ?? ""}
                    onChange={(e) =>
                      onChange({ ...criterion, minValue: Number(e.target.value) || undefined })
                    }
                  />
                </div>
                <div>
                  <label className="label">Maximum</label>
                  <input
                    className="input"
                    type="number"
                    value={criterion.maxValue ?? ""}
                    onChange={(e) =>
                      onChange({ ...criterion, maxValue: Number(e.target.value) || undefined })
                    }
                  />
                </div>
              </>
            )}
          </div>

          {/* Values (industries, countries, technologies, exclusions) */}
          {["industry", "sub_industry", "country", "location", "technology", "exclusion", "product_service", "job_title"].includes(criterion.type) && (
            <div>
              <label className="label">
                {criterion.type === "exclusion" ? "Excluded Values" : "Target Values"}
              </label>
              <TagInput
                tags={criterion.values ?? []}
                onChange={(values) => onChange({ ...criterion, values })}
                placeholder="Type and press Enter..."
              />
            </div>
          )}

          {criterion.type === "business_model" && (
            <div>
              <label className="label">Preferred Business Models</label>
              <div className="flex gap-4 mt-1">
                {["B2B", "B2C", "B2B2C"].map((model) => (
                  <label key={model} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={criterion.preferredModels?.includes(model) ?? false}
                      onChange={(e) => {
                        const current = criterion.preferredModels ?? [];
                        const updated = e.target.checked
                          ? [...current, model]
                          : current.filter((m) => m !== model);
                        onChange({ ...criterion, preferredModels: updated });
                      }}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    {model}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Positive Signals</label>
              <TagInput
                tags={criterion.positiveSignals ?? []}
                onChange={(positiveSignals) => onChange({ ...criterion, positiveSignals })}
                placeholder="Add positive signal..."
              />
            </div>
            <div>
              <label className="label">Negative Signals</label>
              <TagInput
                tags={criterion.negativeSignals ?? []}
                onChange={(negativeSignals) => onChange({ ...criterion, negativeSignals })}
                placeholder="Add negative signal..."
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={criterion.required}
                onChange={(e) => onChange({ ...criterion, required: e.target.checked })}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Required
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={criterion.isHardRule}
                onChange={(e) => onChange({ ...criterion, isHardRule: e.target.checked })}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Hard Rule (auto-disqualify)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={criterion.active}
                onChange={(e) => onChange({ ...criterion, active: e.target.checked })}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Active
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                if (confirm(`Delete criterion "${criterion.name}"?`)) {
                  onDelete(criterion.id);
                }
              }}
              className="btn-ghost text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
