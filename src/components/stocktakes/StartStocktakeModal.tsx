"use client";

import {
  ClipboardList,
  X,
} from "lucide-react";

type StartStocktakeModalProps = {
  siteName: string;
  periodLabel: string;
  frequencyLabel: string;
  productCount: number;

  onClose: () => void;
  onStart: () => void;

  starting: boolean;
  error: string;
};

export default function StartStocktakeModal({
  siteName,
  periodLabel,
  frequencyLabel,
  productCount,
  onClose,
  onStart,
  starting,
  error,
}: StartStocktakeModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-violet-800">
              {siteName}
            </p>

            <h2 className="mt-1 text-3xl font-bold text-gray-950">
              Start Stocktake
            </h2>

            <p className="mt-2 text-gray-600">
              {frequencyLabel} schedule • {periodLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-gray-600 transition hover:bg-slate-200"
            aria-label="Close"
          >
            <X size={21} />
          </button>
        </div>

        <div className="mt-7 flex items-center gap-4 rounded-2xl bg-slate-50 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
            <ClipboardList size={24} />
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Products to count
            </p>

            <p className="text-2xl font-bold text-gray-950">
              {productCount}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-blue-50 p-5 text-sm text-blue-800">
          Progress saves automatically. When every product has been counted, Finish Stocktake immediately updates Inventory and saves a read-only result.
        </div>

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 font-semibold text-red-800">
            {error}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-slate-50"
          >
            Back
          </button>

          <button
            type="button"
            onClick={onStart}
            disabled={
              starting ||
              productCount === 0
            }
            className="flex-1 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white transition hover:bg-violet-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {starting
              ? "Starting..."
              : "Start Stocktake"}
          </button>
        </div>
      </div>
    </div>
  );
}
