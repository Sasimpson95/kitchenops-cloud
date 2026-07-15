const updates = [
  { title: "Prep confirmed", detail: "Wet Mix completed for 5 batches", time: "10 mins ago" },
  { title: "Inventory synced", detail: "Ingredients updated from recipe usage", time: "32 mins ago" },
  { title: "Staff note", detail: "Allergy cross-check completed", time: "1 hr ago" },
];

export default function ActivityFeed() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Activity Feed</h3>
        <button className="text-sm font-medium text-emerald-700">Refresh</button>
      </div>

      <div className="mt-5 space-y-4">
        {updates.map((entry) => (
          <div key={entry.title} className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{entry.title}</p>
                <p className="mt-1 text-sm text-slate-600">{entry.detail}</p>
              </div>
              <p className="text-xs text-slate-500">{entry.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
