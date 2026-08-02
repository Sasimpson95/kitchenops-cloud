import type { ReactNode } from "react";

type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "purple";

type StatusBadgeProps = {
  status?: string;
  children?: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-800",
  purple: "border-violet-200 bg-violet-50 text-violet-800",
};

function inferTone(status: string): BadgeTone {
  const value = status.toLowerCase();
  if (["complete", "completed", "received", "active", "approved", "success"].some((item) => value.includes(item))) return "success";
  if (["cancel", "overdue", "failed", "error", "inactive", "out of stock"].some((item) => value.includes(item))) return "danger";
  if (["draft", "waiting", "pending", "reorder", "low stock", "in progress"].some((item) => value.includes(item))) return "warning";
  if (["sent", "dispatched", "requested", "open"].some((item) => value.includes(item))) return "info";
  return "purple";
}

export default function StatusBadge({
  status,
  children,
  tone,
  dot = false,
  className = "",
}: StatusBadgeProps) {
  const label = children ?? status ?? "Status";
  const resolvedTone = tone ?? inferTone(String(label));

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold leading-none ${toneClasses[resolvedTone]} ${className}`}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {label}
    </span>
  );
}
