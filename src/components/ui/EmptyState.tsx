import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import Button from "./Button";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: ReactNode;
  compact?: boolean;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryAction,
  compact = false,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 text-center ${compact ? "py-8" : "py-12 sm:py-16"} ${className}`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm ring-1 ring-slate-200">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
        {description}
      </p>
      {actionLabel || secondaryAction ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionLabel ? <Button onClick={onAction}>{actionLabel}</Button> : null}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
