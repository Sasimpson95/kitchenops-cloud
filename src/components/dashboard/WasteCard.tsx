export default function WasteCard() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Waste</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">This week</h3>
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          -12%
        </span>
      </div>

      <p className="mt-4 text-3xl font-semibold text-slate-950">3.2kg</p>
      <p className="text-sm text-slate-500">Below your target for the week</p>
    </div>
  );
}
