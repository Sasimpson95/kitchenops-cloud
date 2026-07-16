type SiteOverviewCardProps = {
  site: string;
  onSelect: () => void;
};

export default function SiteOverviewCard({
  site,
  onSelect,
}: SiteOverviewCardProps) {
  return (
    <button
      onClick={onSelect}
      className="rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-950">
          {site}
        </h2>

        <span className="text-2xl text-violet-800">
          →
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-5">
          <h3 className="font-bold text-gray-900">
            Today's Handover
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            View today's notes.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5">
          <h3 className="font-bold text-gray-900">
            Today's Prep
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Wet Mix ×5 • Salted Caramel ×1
          </p>
        </div>
      </div>
    </button>
  );
}