const actions = [
  { title: "3 invoices awaiting approval", tone: "bg-rose-100 text-rose-700" },
  { title: "14 products below minimum stock", tone: "bg-amber-100 text-amber-700" },
  { title: "Supplier prices updated today", tone: "bg-emerald-100 text-emerald-700" },
];

export default function ActionCentre() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Action Centre</h3>
        <button className="text-sm font-medium text-emerald-700">View all</button>
      </div>

      <div className="mt-5 space-y-3">
        {actions.map((action) => (
          <div
            key={action.title}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <p className="text-sm text-slate-700">{action.title}</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${action.tone}`}>
              Open
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
