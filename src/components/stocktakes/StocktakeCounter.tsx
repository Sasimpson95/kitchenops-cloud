"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Save,
  Search,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Stocktake } from "@/lib/stocktakeStore";

type StocktakeCounterProps = {
  stocktake: Stocktake;
  areaName: string;
  onSaveCount: (
    itemId: string,
    quantity: number,
    nextIndex: number
  ) => void;
  onMove: (index: number) => void;
  onBackToAreas: () => void;
  error: string;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 2,
  }).format(value);
}

export default function StocktakeCounter({
  stocktake,
  areaName,
  onSaveCount,
  onMove,
  onBackToAreas,
  error,
}: StocktakeCounterProps) {
  const areaItems = useMemo(
    () =>
      stocktake.items
        .map((item, index) => ({
          ...item,
          index,
        }))
        .filter((item) => (item.location || "Not assigned") === areaName),
    [areaName, stocktake.items]
  );

  const currentAreaItem =
    areaItems.find((item) => item.index === stocktake.currentIndex) ??
    areaItems[0];

  const [countValue, setCountValue] = useState("");
  const [search, setSearch] = useState("");
  const [showProductJump, setShowProductJump] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (
      currentAreaItem &&
      currentAreaItem.index !== stocktake.currentIndex
    ) {
      onMove(currentAreaItem.index);
    }
  }, [
    currentAreaItem,
    onMove,
    stocktake.currentIndex,
  ]);

  useEffect(() => {
    setCountValue(
      currentAreaItem?.countedQuantity === null ||
        currentAreaItem?.countedQuantity === undefined
        ? ""
        : String(currentAreaItem.countedQuantity)
    );

    window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, [
    currentAreaItem?.id,
    currentAreaItem?.countedQuantity,
  ]);

  if (!currentAreaItem) {
    return null;
  }

  const countedCount = areaItems.filter(
    (item) => item.countedQuantity !== null
  ).length;

  const areaComplete = countedCount === areaItems.length;

  const parsedCount =
    countValue.trim() === "" ? null : Number(countValue);

  const liveDifference =
    parsedCount === null || !Number.isFinite(parsedCount)
      ? null
      : parsedCount - currentAreaItem.expectedQuantity;

  const filteredItems = areaItems.filter((item) => {
    const normalisedSearch = search.trim().toLowerCase();

    return (
      !normalisedSearch ||
      item.productName.toLowerCase().includes(normalisedSearch) ||
      item.category.toLowerCase().includes(normalisedSearch)
    );
  });

  function findNextUncountedIndex(currentIndex: number): number | null {
    const next = areaItems.find(
      (item) =>
        item.index > currentIndex &&
        item.countedQuantity === null
    );

    if (next) return next.index;

    const firstUncounted = areaItems.find(
      (item) => item.countedQuantity === null
    );

    return firstUncounted?.index ?? null;
  }

  function saveAndContinue(): void {
    const quantity = Number(countValue);

    if (
      countValue.trim() === "" ||
      !Number.isFinite(quantity) ||
      quantity < 0
    ) {
      return;
    }

    const nextIndex = findNextUncountedIndex(currentAreaItem.index);

    onSaveCount(
      currentAreaItem.id,
      quantity,
      nextIndex ?? currentAreaItem.index
    );

    const remainingUncounted = areaItems.filter(
      (item) =>
        item.id !== currentAreaItem.id &&
        item.countedQuantity === null
    );

    if (remainingUncounted.length === 0) {
      window.setTimeout(onBackToAreas, 0);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ): void {
    if (event.key !== "Enter") return;

    event.preventDefault();
    saveAndContinue();
  }

  function jumpToProduct(index: number): void {
    onMove(index);
    setShowProductJump(false);
    setSearch("");
  }

  const currentPosition =
    areaItems.findIndex(
      (item) => item.index === currentAreaItem.index
    ) + 1;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onBackToAreas}
          className="inline-flex items-center gap-2 font-semibold text-violet-800 hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Storage Areas
        </button>

        <div className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
          {stocktake.stocktakeNumber}
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold text-violet-800">
              {stocktake.siteName}
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-950">
              {areaName}
            </h1>

            <p className="mt-2 text-gray-600">
              {stocktake.periodLabel}
            </p>
          </div>

          <div className="rounded-2xl bg-violet-50 px-5 py-4 text-right">
            <p className="text-sm text-violet-700">
              Area Progress
            </p>

            <p className="mt-1 text-2xl font-bold text-violet-900">
              {countedCount}/{areaItems.length}
            </p>
          </div>
        </div>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-violet-700 transition-all"
            style={{
              width: `${
                areaItems.length === 0
                  ? 0
                  : Math.round(
                      (countedCount / areaItems.length) * 100
                    )
              }%`,
            }}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() =>
              setShowProductJump((current) => !current)
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-slate-50"
          >
            <Search size={18} />
            Find Product
            <ChevronDown size={18} />
          </button>
        </div>

        {showProductJump && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${areaName}...`}
                className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-11 outline-none focus:border-violet-800"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 hover:bg-slate-100"
                  aria-label="Clear search"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
              {filteredItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => jumpToProduct(item.index)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 text-left transition hover:bg-slate-100"
                >
                  <div>
                    <p className="font-semibold text-gray-950">
                      {item.productName}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {item.category}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.countedQuantity !== null
                        ? "bg-violet-100 text-violet-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {item.countedQuantity !== null
                      ? "Counted"
                      : "Not Counted"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 rounded-3xl border border-gray-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Product {currentPosition} of {areaItems.length}
          </p>

          <h2 className="mt-3 text-4xl font-bold text-gray-950">
            {currentAreaItem.productName}
          </h2>

          <p className="mt-2 text-gray-500">
            {currentAreaItem.category}
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-gray-500">
            <MapPin size={17} />
            {areaName}
          </div>

          <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Expected
              </p>

              <p className="mt-1 text-3xl font-bold text-gray-950">
                {formatNumber(
                  currentAreaItem.expectedQuantity
                )}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {currentAreaItem.inventoryUnit}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <label
                htmlFor="stocktake-count"
                className="text-sm font-semibold text-gray-700"
              >
                Counted
              </label>

              <input
                ref={inputRef}
                id="stocktake-count"
                type="number"
                min={0}
                step="0.01"
                value={countValue}
                onChange={(event) =>
                  setCountValue(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="0"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-4 text-center text-3xl font-bold outline-none focus:border-violet-800"
              />

              <p className="mt-2 text-sm text-gray-500">
                {currentAreaItem.inventoryUnit}
              </p>
            </div>

            <div
              className={`rounded-2xl p-5 shadow-sm ${
                liveDifference === null || liveDifference === 0
                  ? "bg-white"
                  : liveDifference > 0
                    ? "bg-violet-50"
                    : "bg-red-50"
              }`}
            >
              <p className="text-sm text-gray-500">
                Difference
              </p>

              <p
                className={`mt-1 text-3xl font-bold ${
                  liveDifference === null || liveDifference === 0
                    ? "text-gray-950"
                    : liveDifference > 0
                      ? "text-violet-900"
                      : "text-red-900"
                }`}
              >
                {liveDifference === null
                  ? "—"
                  : `${liveDifference > 0 ? "+" : ""}${formatNumber(
                      liveDifference
                    )}`}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {currentAreaItem.inventoryUnit}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 font-semibold text-red-800">
            {error}
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={onBackToAreas}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
            Storage Areas
          </button>

          <button
            type="button"
            onClick={saveAndContinue}
            disabled={countValue.trim() === ""}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white transition hover:bg-violet-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {areaComplete ? (
              <CheckCircle2 size={18} />
            ) : (
              <Save size={18} />
            )}

            Save & Continue

            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
