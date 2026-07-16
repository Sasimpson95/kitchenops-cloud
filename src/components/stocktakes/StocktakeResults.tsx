"use client";

import {
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

import type {
  Stocktake,
} from "@/lib/stocktakeStore";

type StocktakeResultsProps = {
  stocktake: Stocktake;
  onBack: () => void;
};

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-GB",
    {
      maximumFractionDigits: 2,
    }
  ).format(value);
}

export default function StocktakeResults({
  stocktake,
  onBack,
}: StocktakeResultsProps) {
  const items = stocktake.items.map(
    (item) => ({
      ...item,

      difference:
        (item.countedQuantity ?? 0) -
        item.expectedQuantity,
    })
  );

  const variances = items.filter(
    (item) => item.difference !== 0
  );

  return (
    <div className="mx-auto max-w-6xl">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 font-semibold text-violet-800 hover:underline"
      >
        <ArrowLeft size={18} />
        Back to Stocktakes
      </button>

      <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold text-violet-800">
              {stocktake.stocktakeNumber}
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-950">
              {stocktake.siteName} Stocktake
            </h1>

            <p className="mt-2 text-gray-600">
              {stocktake.periodLabel}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl bg-violet-100 px-4 py-3 font-semibold text-violet-900">
            <CheckCircle2 size={20} />
            Completed
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm text-gray-500">
              Products Counted
            </p>

            <p className="mt-1 text-3xl font-bold text-gray-950">
              {items.length}
            </p>
          </div>

          <div className="rounded-2xl bg-orange-50 p-5">
            <p className="text-sm text-orange-700">
              Variances
            </p>

            <p className="mt-1 text-3xl font-bold text-orange-900">
              {variances.length}
            </p>
          </div>

          <div className="rounded-2xl bg-violet-50 p-5">
            <p className="text-sm text-violet-700">
              Completed By
            </p>

            <p className="mt-1 text-xl font-bold text-violet-900">
              {stocktake.completedBy}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-[1fr_auto_auto_auto] md:items-center"
            >
              <div>
                <p className="font-bold text-gray-950">
                  {item.productName}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {item.location}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Expected
                </p>

                <p className="font-bold text-gray-950">
                  {formatNumber(
                    item.expectedQuantity
                  )}{" "}
                  {item.inventoryUnit}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Counted
                </p>

                <p className="font-bold text-gray-950">
                  {formatNumber(
                    item.countedQuantity ?? 0
                  )}{" "}
                  {item.inventoryUnit}
                </p>
              </div>

              <div
                className={`rounded-xl px-4 py-2 text-center font-bold ${
                  item.difference > 0
                    ? "bg-violet-100 text-violet-900"
                    : item.difference < 0
                    ? "bg-red-100 text-red-900"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {item.difference > 0
                  ? "+"
                  : ""}
                {formatNumber(
                  item.difference
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
