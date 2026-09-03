import { type ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, description, icon, action }: PageHeaderProps) {
  return (
    <div className="page-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
        {icon && (
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="break-words">{title}</h1>
          {description && <p className="break-words">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 w-full sm:w-auto">{action}</div>}
    </div>
  );
}
