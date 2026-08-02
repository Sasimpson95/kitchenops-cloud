import type { ReactNode } from "react";
import Card from "./Card";

type KpiCardProps = {
  label: string;
  value: ReactNode;
  supportingText?: ReactNode;
  icon?: ReactNode;
  trend?: ReactNode;
  onClick?: () => void;
  className?: string;
};

export default function KpiCard({
  label,
  value,
  supportingText,
  icon,
  trend,
  onClick,
  className = "",
}: KpiCardProps) {
  const content = (
    <Card interactive={Boolean(onClick)} className={`h-full ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <div className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</div>
        </div>
        {icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            {icon}
          </div>
        ) : null}
      </div>
      {supportingText || trend ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          {supportingText ? <span className="text-slate-500">{supportingText}</span> : <span />}
          {trend ? <span className="font-semibold text-slate-700">{trend}</span> : null}
        </div>
      ) : null}
    </Card>
  );

  if (!onClick) return content;
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {content}
    </button>
  );
}
