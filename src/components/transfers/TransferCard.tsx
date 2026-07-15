import { ArrowRight, CheckCircle2 } from "lucide-react";

import type { StockTransfer } from "@/lib/transferStore";

type TransferCardProps = {
  transfer: StockTransfer;
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

function formatQuantity(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 2,
  }).format(value);
}

export default function TransferCard({ transfer }: TransferCardProps) {
  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-gray-950">
              {transfer.transferNumber}
            </h2>

            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
              <CheckCircle2 size={14} />
              {transfer.status}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            {formatDateTime(transfer.createdAt)} • {transfer.transferredBy}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
          <p className="text-2xl font-bold text-gray-950">
            {formatQuantity(transfer.quantity)}
          </p>
          <p className="text-sm text-gray-500">{transfer.inventoryUnit}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-5">
        <p className="text-lg font-bold text-gray-950">{transfer.productName}</p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1 rounded-xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              From
            </p>
            <p className="mt-1 font-bold text-gray-950">
              {transfer.fromSiteName}
            </p>
          </div>

          <ArrowRight className="mx-auto shrink-0 text-green-800" size={24} />

          <div className="flex-1 rounded-xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              To
            </p>
            <p className="mt-1 font-bold text-gray-950">{transfer.toSiteName}</p>
          </div>
        </div>
      </div>

      {transfer.reason && (
        <div className="mt-4 rounded-2xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Reason</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {transfer.reason}
          </p>
        </div>
      )}
    </article>
  );
}
