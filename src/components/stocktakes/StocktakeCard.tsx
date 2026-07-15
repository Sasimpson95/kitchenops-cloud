"use client";

import {
  CheckCircle2,
  Clock3,
  RotateCcw,
} from "lucide-react";

import type {
  Stocktake,
} from "@/lib/stocktakeStore";

type StocktakeCardProps = {
  stocktake: Stocktake;
  onOpen?: () => void;
};

function formatDateTime(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

export default function StocktakeCard({
  stocktake,
  onOpen,
}: StocktakeCardProps) {
  const countedCount =
    stocktake.items.filter(
      (item) =>
        item.countedQuantity !== null
    ).length;

  const varianceCount =
    stocktake.items.filter(
      (item) =>
        item.countedQuantity !== null &&
        item.countedQuantity !==
          item.expectedQuantity
    ).length;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-green-800">
            {stocktake.stocktakeNumber}
          </p>

          <h3 className="mt-1 text-2xl font-bold text-gray-950">
            {stocktake.siteName}
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            {stocktake.periodLabel}
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            stocktake.status === "Completed"
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {stocktake.status === "Completed" ? (
            <CheckCircle2 size={18} />
          ) : (
            <Clock3 size={18} />
          )}

          {stocktake.status}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-gray-500">
            Products
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-950">
            {countedCount}/{stocktake.items.length}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-gray-500">
            Variances
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-950">
            {varianceCount}
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm text-gray-500">
        Started by {stocktake.startedBy} •{" "}
        {formatDateTime(stocktake.startedAt)}
      </p>

      {stocktake.completedAt && (
        <p className="mt-1 text-sm text-gray-500">
          Completed by {stocktake.completedBy} •{" "}
          {formatDateTime(stocktake.completedAt)}
        </p>
      )}

      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-800 px-5 py-3 font-semibold text-white transition hover:bg-green-900"
        >
          <RotateCcw size={18} />

          {stocktake.status === "Completed"
            ? "View Results"
            : "Resume Stocktake"}
        </button>
      )}
    </div>
  );
}
