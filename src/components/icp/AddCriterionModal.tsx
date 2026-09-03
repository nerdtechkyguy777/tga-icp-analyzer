"use client";

import { useState } from "react";
import type { ICPCriterion } from "@/lib/icp/types";
import { X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface AddCriterionModalProps {
  onAdd: (criterion: ICPCriterion) => void;
  onClose: () => void;
  nextOrder: number;
}

export function AddCriterionModal({ onAdd, onClose, nextOrder }: AddCriterionModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ICPCriterion["type"]>("custom");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState(10);
  const [isHardRule, setIsHardRule] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      id: uuidv4(),
      name: name.trim(),
      description,
      type,
      weight,
      required: false,
      active: true,
      order: nextOrder,
      isHardRule,
      rules: [],
      positiveSignals: [],
      negativeSignals: [],
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Add ICP Criterion</h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Criterion Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Target Job Titles"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value as ICPCriterion["type"])}
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

          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Weight</label>
            <input
              className="input"
              type="number"
              min={0}
              max={100}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isHardRule}
              onChange={(e) => setIsHardRule(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Hard Rule (auto-disqualify on failure)
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Criterion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
