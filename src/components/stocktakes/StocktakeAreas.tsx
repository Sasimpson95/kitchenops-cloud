"use client";

import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  PlayCircle,
} from "lucide-react";

import type { Stocktake } from "@/lib/stocktakeStore";

type StocktakeAreasProps = {
  stocktake: Stocktake;
  onSelectArea: (areaName: string) => void;
  onFinish: () => void;
  onExit: () => void;
  finishing: boolean;
  error: string;
};

type AreaSummary = {
  name: string;
  total: number;
  counted: number;
  firstUncountedIndex: number;
};

export default function StocktakeAreas({
  stocktake,
  onSelectArea,
  onFinish,
  onExit,
  finishing,
  error,
}: StocktakeAreasProps) {
  const areaMap = new Map<string, AreaSummary>();

  stocktake.items.forEach((item, index) => {
    const areaName = item.location || "Not assigned";
    const existing = areaMap.get(areaName);

    if (!existing) {
      areaMap.set(areaName, {
        name: areaName,
        total: 1,
        counted: item.countedQuantity === null ? 0 : 1,
        firstUncountedIndex:
          item.countedQuantity === null ? index : -1,
      });

      return;
    }

    existing.total += 1;

    if (item.countedQuantity !== null) {
      existing.counted += 1;
    } else if (existing.firstUncountedIndex === -1) {
      existing.firstUncountedIndex = index;
    }
  });

  const areas = Array.from(areaMap.values()).sort((first, second) =>
    first.name.localeCompare(second.name)
  );

  const totalCounted = stocktake.items.filter(
    (item) => item.countedQuantity !== null
  ).length;

  const allCounted = totalCounted === stocktake.items.length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 font-semibold text-green-800 hover:underline"
        >
          <ArrowLeft size={18} />
          Save and Exit
        </button>

        <div className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
          {stocktake.stocktakeNumber}
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-semibold text-green-800">
              {stocktake.siteName}
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-950">
              Choose a Storage Area
            </h1>

            <p className="mt-2 text-gray-600">{stocktake.periodLabel}</p>
          </div>

          <div className="rounded-2xl bg-green-50 px-5 py-4 text-right">
            <p className="text-sm text-green-700">Overall Progress</p>

            <p className="mt-1 text-2xl font-bold text-green-900">
              {totalCounted}/{stocktake.items.length}
            </p>
          </div>
        </div>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-green-700 transition-all"
            style={{
              width: `${
                stocktake.items.length === 0
                  ? 0
                  : Math.round(
                      (totalCounted / stocktake.items.length) * 100
                    )
              }%`,
            }}
          />
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {areas.map((area) => {
            const complete = area.counted === area.total;
            const percentage =
              area.total === 0
                ? 0
                : Math.round((area.counted / area.total) * 100);

            return (
              <button
                type="button"
                key={area.name}
                onClick={() => onSelectArea(area.name)}
                className={`rounded-3xl border p-6 text-left transition hover:-translate-y-1 hover:shadow-md ${
                  complete
                    ? "border-green-200 bg-green-50"
                    : area.counted > 0
                      ? "border-orange-200 bg-orange-50"
                      : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        complete
                          ? "bg-green-100 text-green-800"
                          : area.counted > 0
                            ? "bg-orange-100 text-orange-800"
                            : "bg-slate-100 text-gray-600"
                      }`}
                    >
                      {complete ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        <MapPin size={24} />
                      )}
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-gray-950">
                        {area.name}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        {area.counted}/{area.total} products counted
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      complete
                        ? "bg-green-100 text-green-800"
                        : area.counted > 0
                          ? "bg-orange-100 text-orange-800"
                          : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {complete
                      ? "Complete"
                      : area.counted > 0
                        ? "In Progress"
                        : "Not Started"}
                  </span>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/80">
                  <div
                    className={`h-full rounded-full ${
                      complete ? "bg-green-700" : "bg-orange-600"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-600">
                    {percentage}% complete
                  </p>

                  <span className="inline-flex items-center gap-2 font-semibold text-green-800">
                    <PlayCircle size={18} />
                    {complete ? "Review Area" : area.counted > 0 ? "Continue" : "Start"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-800">
            {error}
          </div>
        )}

        <div className="mt-8 flex justify-end border-t pt-6">
          <button
            type="button"
            onClick={onFinish}
            disabled={!allCounted || finishing}
            className="rounded-xl bg-green-800 px-6 py-3 font-semibold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
          >
            {finishing ? "Finishing..." : "Finish Stocktake"}
          </button>
        </div>

        {!allCounted && (
          <p className="mt-3 text-right text-sm text-gray-500">
            Every storage area must be complete before the stocktake can be finished.
          </p>
        )}
      </div>
    </div>
  );
}
