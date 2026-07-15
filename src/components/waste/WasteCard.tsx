import {
  CalendarClock,
  MapPin,
  PackageMinus,
  UserRound,
} from "lucide-react";

import type { WasteRecord } from "@/lib/wasteStore";

type WasteCardProps = {
  record: WasteRecord;
};

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function WasteCard({ record }: WasteCardProps) {
  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-bold text-gray-950">
              {record.productName}
            </h3>

            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
              {record.reason}
            </span>
          </div>

          <p className="mt-2 text-sm font-semibold text-gray-500">
            {record.wasteNumber}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-red-800">
          <PackageMinus size={20} />

          <p className="text-xl font-bold">
            -{record.quantity} {record.inventoryUnit}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
          <MapPin size={17} className="text-gray-400" />
          <span>{record.siteName}</span>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
          <UserRound size={17} className="text-gray-400" />
          <span>{record.recordedBy}</span>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
          <CalendarClock size={17} className="text-gray-400" />
          <span>{formatDateTime(record.createdAt)}</span>
        </div>
      </div>

      {record.notes && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Notes
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
            {record.notes}
          </p>
        </div>
      )}
    </article>
  );
}
