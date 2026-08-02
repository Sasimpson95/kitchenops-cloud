import type { ReactNode } from "react";

type FilterBarProps = {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function FilterBar({ children, actions, className = "" }: FilterBarProps) {
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between ${className}`}>
      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
        {children}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
