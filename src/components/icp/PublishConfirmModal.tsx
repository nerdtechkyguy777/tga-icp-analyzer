"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { incrementVersion } from "@/lib/utils";

interface PublishConfirmModalProps {
  currentVersion: string;
  onConfirm: (changeSummary: string) => void;
  onClose: () => void;
  saving: boolean;
}

export function PublishConfirmModal({
  currentVersion,
  onConfirm,
  onClose,
  saving,
}: PublishConfirmModalProps) {
  const [changeSummary, setChangeSummary] = useState("");
  const nextVersion = incrementVersion(currentVersion);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Publish ICP Changes</h2>
          <button onClick={onClose} className="btn-ghost p-1" disabled={saving}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">
                Publish ICP Version {nextVersion}?
              </p>
              <p className="text-amber-700 mt-1">
                New analyses will use Version {nextVersion}. Previous analyses
                will retain their original ICP version ({currentVersion}).
              </p>
            </div>
          </div>

          <div>
            <label className="label">Change Summary</label>
            <textarea
              className="input"
              rows={3}
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="Describe what changed in this version..."
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button
              onClick={() => onConfirm(changeSummary)}
              disabled={!changeSummary.trim() || saving}
              className="btn-primary"
            >
              {saving ? "Publishing..." : `Publish Version ${nextVersion}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
