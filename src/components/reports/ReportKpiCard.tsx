import type { LucideIcon } from "lucide-react";

type ReportKpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  tone?: "green" | "blue" | "orange" | "red" | "slate" | "purple";
};

const tones = {
  green: "bg-violet-50 text-violet-950",
  blue: "bg-blue-50 text-blue-950",
  orange: "bg-orange-50 text-orange-950",
  red: "bg-red-50 text-red-950",
  slate: "bg-white text-gray-950",
  purple: "bg-purple-50 text-purple-950",
};

const iconTones = {
  green: "bg-violet-100 text-violet-800",
  blue: "bg-blue-100 text-blue-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
  slate: "bg-slate-100 text-gray-700",
  purple: "bg-purple-100 text-purple-800",
};

export default function ReportKpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "slate",
}: ReportKpiCardProps) {
  return (
    <div className={`rounded-3xl p-5 shadow-sm ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold opacity-70">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {subtitle && <p className="mt-2 text-xs font-semibold opacity-60">{subtitle}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconTones[tone]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
