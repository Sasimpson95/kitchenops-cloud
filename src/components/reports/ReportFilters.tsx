import { CalendarDays, Search, X } from "lucide-react";
import type { ReportFiltersState } from "@/components/reports/types";

type ReportFiltersProps = {
  filters: ReportFiltersState;
  siteOptions: string[];
  supplierOptions: string[];
  categoryOptions: string[];
  lockSite: boolean;
  onChange: <K extends keyof ReportFiltersState>(field: K, value: ReportFiltersState[K]) => void;
  onReset: () => void;
};

const control = "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-800";

export default function ReportFilters({
  filters,
  siteOptions,
  supplierOptions,
  categoryOptions,
  lockSite,
  onChange,
  onReset,
}: ReportFiltersProps) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm print:hidden">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-800">
            <CalendarDays size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-950">Report Filters</h2>
            <p className="mt-1 text-sm text-gray-500">Filters remain applied while switching report tabs.</p>
          </div>
        </div>
        <button type="button" onClick={onReset} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50">
          Reset Filters
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Start Date</label>
          <input type="date" value={filters.startDate} onChange={(event) => onChange("startDate", event.target.value)} className={control} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">End Date</label>
          <input type="date" value={filters.endDate} onChange={(event) => onChange("endDate", event.target.value)} className={control} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Site</label>
          <select value={filters.site} disabled={lockSite} onChange={(event) => onChange("site", event.target.value)} className={`${control} disabled:bg-slate-100 disabled:text-gray-500`}>
            {siteOptions.map((site) => <option key={site} value={site}>{site}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Supplier</label>
          <select value={filters.supplier} onChange={(event) => onChange("supplier", event.target.value)} className={control}>
            {supplierOptions.map((supplier) => <option key={supplier} value={supplier}>{supplier}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Category</label>
          <select value={filters.category} onChange={(event) => onChange("category", event.target.value)} className={control}>
            {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Search</label>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={filters.search} onChange={(event) => onChange("search", event.target.value)} placeholder="Search report..." className={`${control} pl-11 pr-10`} />
            {filters.search && (
              <button type="button" onClick={() => onChange("search", "")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label="Clear search"><X size={17} /></button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
