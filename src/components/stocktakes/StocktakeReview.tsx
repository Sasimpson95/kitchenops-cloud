"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Edit3,
} from "lucide-react";

import type {
  Stocktake,
} from "@/lib/stocktakeStore";

type StocktakeReviewProps = {
  stocktake: Stocktake;
  onEditProduct: (
    productId: number
  ) => void;
  onBackToCounting: () => void;
  onApply: () => void;
  onExit: () => void;
  applying: boolean;
  error: string;
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

export default function StocktakeReview({
  stocktake,
  onEditProduct,
  onBackToCounting,
  onApply,
  onExit,
  applying,
  error,
}: StocktakeReviewProps) {
  const variances = stocktake.items
    .map((item) => ({
      ...item,

      difference:
        (item.countedQuantity ?? 0) -
        item.expectedQuantity,
    }))
    .filter(
      (item) =>
        item.difference !== 0
    );

  const positiveVariances =
    variances.filter(
      (item) => item.difference > 0
    ).length;

  const negativeVariances =
    variances.filter(
      (item) => item.difference < 0
    ).length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 font-semibold text-green-800 hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Stocktakes
        </button>

        <div className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
          {stocktake.stocktakeNumber}
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold text-green-800">
              {stocktake.siteName}
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-950">
              Review Stocktake
            </h1>

            <p className="mt-2 text-gray-600">
              Check the differences before applying them to Inventory.
            </p>
          </div>

          <div className="rounded-2xl bg-blue-50 px-5 py-4 text-right">
            <p className="text-sm text-blue-700">
              Products Counted
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-900">
              {stocktake.items.length}
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-orange-50 p-5">
            <p className="text-sm text-orange-700">
              Variances
            </p>

            <p className="mt-1 text-3xl font-bold text-orange-900">
              {variances.length}
            </p>
          </div>

          <div className="rounded-2xl bg-green-50 p-5">
            <p className="text-sm text-green-700">
              Counted Higher
            </p>

            <p className="mt-1 text-3xl font-bold text-green-900">
              {positiveVariances}
            </p>
          </div>

          <div className="rounded-2xl bg-red-50 p-5">
            <p className="text-sm text-red-700">
              Counted Lower
            </p>

            <p className="mt-1 text-3xl font-bold text-red-900">
              {negativeVariances}
            </p>
          </div>
        </div>

        {variances.length === 0 ? (
          <div className="mt-7 flex items-center gap-4 rounded-2xl bg-green-50 p-6 text-green-900">
            <CheckCircle2 size={28} />

            <div>
              <h2 className="text-xl font-bold">
                No variances found
              </h2>

              <p className="mt-1 text-sm text-green-800">
                Every counted quantity matches the expected stock.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-7">
            <div className="flex items-center gap-3">
              <AlertTriangle
                size={22}
                className="text-orange-700"
              />

              <h2 className="text-xl font-bold text-gray-950">
                Variances to Apply
              </h2>
            </div>

            <div className="mt-4 space-y-3">
              {variances.map((item) => (
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

                  <div className="text-sm">
                    <p className="text-gray-500">
                      Expected
                    </p>

                    <p className="font-bold text-gray-950">
                      {formatNumber(
                        item.expectedQuantity
                      )}{" "}
                      {item.inventoryUnit}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-500">
                      Counted
                    </p>

                    <p className="font-bold text-gray-950">
                      {formatNumber(
                        item.countedQuantity ?? 0
                      )}{" "}
                      {item.inventoryUnit}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 md:justify-end">
                    <div
                      className={`rounded-xl px-4 py-2 text-lg font-bold ${
                        item.difference > 0
                          ? "bg-green-100 text-green-900"
                          : "bg-red-100 text-red-900"
                      }`}
                    >
                      {item.difference > 0
                        ? "+"
                        : ""}
                      {formatNumber(
                        item.difference
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onEditProduct(
                          item.productId
                        )
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 transition hover:bg-slate-100"
                      aria-label={`Edit ${item.productName} count`}
                    >
                      <Edit3 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-800">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onBackToCounting}
            className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-slate-50"
          >
            Back to Counting
          </button>

          <button
            type="button"
            onClick={onApply}
            disabled={applying}
            className="rounded-xl bg-green-800 px-6 py-3 font-semibold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {applying
              ? "Applying..."
              : variances.length === 0
              ? "Complete Stocktake"
              : `Apply ${variances.length} ${
                  variances.length === 1
                    ? "Variance"
                    : "Variances"
                }`}
          </button>
        </div>

        <p className="mt-4 text-right text-xs text-gray-500">
          Applying creates Stocktake movements and updates Inventory once.
        </p>
      </div>
    </div>
  );
}
