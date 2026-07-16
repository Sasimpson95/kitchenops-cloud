export default function DashboardPreview() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-2xl">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">KitchenOps</p>
            <h3 className="text-xl font-bold text-gray-950">Dashboard</h3>
          </div>

          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
            All sites
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            ["Revenue", "£12,840"],
            ["Food Cost", "27.8%"],
            ["Stock Value", "£18,422"],
            ["Invoices", "4"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="mt-2 text-xl font-bold text-gray-950">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold text-gray-900">Action Centre</p>
            <p className="text-xs text-violet-800">View all</p>
          </div>

          <div className="space-y-3 text-sm">
            <p>🔴 3 invoices awaiting approval</p>
            <p>🟠 14 products below minimum stock</p>
            <p>🟢 Supplier prices updated today</p>
          </div>
        </div>
      </div>
    </div>
  );
}