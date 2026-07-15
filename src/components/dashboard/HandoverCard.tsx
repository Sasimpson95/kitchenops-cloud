export default function HandoverCard() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Handover</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Service handover</h3>
        </div>
        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
          08:30
        </span>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        <li>• 3 lunch orders ready for dispatch</li>
        <li>• 2 allergy notes flagged</li>
        <li>• Staff briefing sent</li>
      </ul>
    </div>
  );
}
