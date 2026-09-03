import type { FitTag } from "@/lib/icp/types";
import { FIT_TAG_CONFIG } from "@/lib/icp/fit-tag";
import { cn } from "@/lib/utils";

interface FitTagBadgeProps {
  fitTag: FitTag;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function FitTagBadge({ fitTag, size = "md", className }: FitTagBadgeProps) {
  const config = FIT_TAG_CONFIG[fitTag];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-4 py-1.5 text-sm font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        config.badge,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}
