export default function PrepCard() {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Tomorrow's Prep
        </h2>

        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
          2 Items
        </span>
      </div>

      <div className="mt-6 space-y-3">

        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
          <span>🥣 Wet Mix</span>
          <span className="font-bold">x5</span>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
          <span>🍮 Salted Caramel</span>
          <span className="font-bold">x1</span>
        </div>

      </div>

      <button className="mt-6 w-full rounded-xl bg-green-800 py-3 font-semibold text-white hover:bg-green-900">
        Open Prep Planner
      </button>

    </div>
  );
}