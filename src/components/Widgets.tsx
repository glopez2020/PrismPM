import type { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: { value: string; positive: boolean };
  icon?: ReactNode;
  subtitle?: string;
  className?: string;
}

export function KpiCard({ title, value, change, icon, subtitle, className = "" }: KpiCardProps) {
  return (
    <div className={`rounded-xl border border-navy-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-navy-500">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-navy-900">{value}</p>
          {change && (
            <p className={`flex items-center gap-1 text-sm font-medium ${change.positive ? "text-emerald-600" : "text-red-600"}`}>
              <span>{change.positive ? "↑" : "↓"}</span>
              <span>{change.value}</span>
            </p>
          )}
          {subtitle && <p className="text-xs text-navy-400">{subtitle}</p>}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

export function ProgressBar({ value, max = 100, label, showValue = true, variant = "default", className = "" }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const variantStyles = {
    default: "bg-indigo-600",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium text-navy-700">{label}</span>}
          {showValue && <span className="text-navy-500">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-navy-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${variantStyles[variant]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface TimelineItemProps {
  title: string;
  date: string;
  status: "completed" | "in-progress" | "pending" | "at-risk";
  description?: string;
}

export function TimelineItem({ title, date, status, description }: TimelineItemProps) {
  const statusColors = {
    completed: "bg-emerald-500",
    "in-progress": "bg-indigo-500",
    pending: "bg-navy-300",
    "at-risk": "bg-amber-500",
  };
  const statusLabels = {
    completed: "Completed",
    "in-progress": "In Progress",
    pending: "Pending",
    "at-risk": "At Risk",
  };

  return (
    <div className="flex gap-4 pb-6 last:pb-0">
      <div className="flex flex-col items-center">
        <div className={`h-3 w-3 rounded-full ${statusColors[status]} ring-2 ring-white`} />
        <div className="mt-1 w-px flex-1 bg-navy-200 last:hidden" />
      </div>
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-center gap-2">
          <p className="font-medium text-navy-900">{title}</p>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            status === "completed" ? "bg-emerald-50 text-emerald-700" :
            status === "in-progress" ? "bg-indigo-50 text-indigo-700" :
            status === "at-risk" ? "bg-amber-50 text-amber-700" :
            "bg-navy-100 text-navy-600"
          }`}>
            {statusLabels[status]}
          </span>
        </div>
        {description && <p className="mt-1 text-sm text-navy-500">{description}</p>}
        <p className="mt-0.5 text-xs text-navy-400">{date}</p>
      </div>
    </div>
  );
}