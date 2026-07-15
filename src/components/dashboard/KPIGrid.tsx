const stats = [
  { label: "Revenue", value: "£12,840", accent: "text-slate-900" },
  { label: "Food Cost", value: "27.8%", accent: "text-slate-900" },
  { label: "Stock Value", value: "£18,422", accent: "text-slate-900" },
  { label: "Invoices", value: "4", accent: "text-slate-900" },
];

export default function KPIGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <p className="text-sm text-slate-500">{stat.label}</p>
          <p className={`mt-3 text-2xl font-semibold ${stat.accent}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
