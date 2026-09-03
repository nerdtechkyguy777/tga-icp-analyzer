"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const ANALYSIS_STEPS = [
  "Scraping website content...",
  "GPT industry classification...",
  "Evaluating ICP criteria...",
  "Calculating fit score...",
];

interface AnalyzingPopupProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  progress?: { current: number; total: number };
  /** Cycle through pipeline steps (single URL). Off during bulk when progress is shown. */
  animateSteps?: boolean;
}

export function AnalyzingPopup({
  visible,
  title = "AI ICP Analysis",
  subtitle,
  progress,
  animateSteps = true,
}: AnalyzingPopupProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!visible || !animateSteps || progress) {
      setStepIndex(0);
      return;
    }
    const id = setInterval(() => {
      setStepIndex((i) => (i + 1) % ANALYSIS_STEPS.length);
    }, 2200);
    return () => clearInterval(id);
  }, [visible, animateSteps, progress]);

  if (!visible) return null;

  const statusText = progress
    ? `Analyzing ${Math.min(progress.current + 1, progress.total)} of ${progress.total}...`
    : animateSteps
      ? ANALYSIS_STEPS[stepIndex]
      : subtitle ?? "Processing...";

  const progressPct =
    progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-tga-teal-900/25 backdrop-blur-[3px]" />

      <div className="relative w-full max-w-sm rounded-2xl border border-tga-teal-100 bg-white shadow-2xl shadow-tga-teal-900/15 overflow-hidden ai-popup-enter">
        <div className="h-1 bg-gradient-to-r from-tga-teal-400 via-tga-orange-400 to-tga-teal-400 ai-shimmer-bar" />

        <div className="px-6 py-5">
          <div className="flex items-center gap-4">
            <AiOrb />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-tga-orange-500 shrink-0 ai-sparkle" />
                <p className="text-sm font-bold text-tga-teal-800">{title}</p>
              </div>
              <p key={statusText} className="text-xs text-gray-500 mt-0.5 ai-status-fade">
                {statusText}
              </p>
              {subtitle && (
                <p className="text-xs text-tga-teal-600 mt-1 truncate font-medium">
                  {subtitle.replace(/^https?:\/\//, "")}
                </p>
              )}
            </div>
          </div>

          {progressPct !== null && (
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>Progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1.5 bg-tga-teal-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-tga-teal-500 to-tga-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(progressPct, 4)}%` }}
                />
              </div>
            </div>
          )}

          {!progress && (
            <div className="flex gap-1 mt-4 justify-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-tga-orange-400 ai-dot"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AiOrb() {
  return (
    <div className="relative h-14 w-14 shrink-0">
      <div className="absolute inset-0 rounded-full bg-tga-teal-400/20 ai-pulse-ring" />
      <div
        className="absolute inset-1 rounded-full bg-tga-orange-400/15 ai-pulse-ring"
        style={{ animationDelay: "0.4s" }}
      />
      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-tga-teal-500 to-tga-orange-500 shadow-lg shadow-tga-teal-500/30 flex items-center justify-center">
        <span className="text-white text-xs font-bold tracking-tight">AI</span>
      </div>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute top-1/2 left-1/2 h-2 w-2 -ml-1 -mt-1 rounded-full bg-tga-orange-400 ai-orbit-dot"
          style={{ animationDelay: `${i * 0.9}s` }}
        />
      ))}
    </div>
  );
}
