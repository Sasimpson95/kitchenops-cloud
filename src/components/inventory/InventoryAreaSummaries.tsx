"use client";

import {
  AlertTriangle,
  Boxes,
  MapPin,
  PackageX,
} from "lucide-react";

import type {
  InventoryAreaSummary,
} from "@/components/inventory/types";

type InventoryAreaSummariesProps = {
  summaries: InventoryAreaSummary[];
  selectedArea: string;
  onSelectArea: (area: string) => void;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);

export default function InventoryAreaSummaries({
  summaries,
  selectedArea,
  onSelectArea,
}: InventoryAreaSummariesProps) {
  if (summaries.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-800">
          <MapPin size={22} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-950">
            Storage Areas
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Select an area to filter the inventory below.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaries.map((summary) => {
          const active =
            selectedArea === summary.area;

          return (
            <button
              type="button"
              key={summary.area}
              onClick={() =>
                onSelectArea(
                  active
                    ? "All Areas"
                    : summary.area
                )
              }
              className={`rounded-2xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-md ${
                active
                  ? "border-green-700 bg-green-50 ring-2 ring-green-100"
                  : "border-gray-200 bg-slate-50 hover:border-green-300 hover:bg-green-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-950">
                    {summary.area}
                  </p>

                  <p className="mt-1 text-2xl font-bold text-emerald-900">
                    {money(
                      summary.inventoryValue
                    )}
                  </p>
                </div>

                <MapPin
                  size={20}
                  className={
                    active
                      ? "text-green-800"
                      : "text-gray-400"
                  }
                />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white p-2">
                  <Boxes
                    size={15}
                    className="mx-auto text-gray-500"
                  />

                  <p className="mt-1 text-sm font-bold text-gray-950">
                    {summary.productCount}
                  </p>

                  <p className="text-[11px] text-gray-500">
                    Products
                  </p>
                </div>

                <div className="rounded-xl bg-orange-50 p-2">
                  <AlertTriangle
                    size={15}
                    className="mx-auto text-orange-700"
                  />

                  <p className="mt-1 text-sm font-bold text-orange-900">
                    {summary.lowStockCount}
                  </p>

                  <p className="text-[11px] text-orange-700">
                    Low
                  </p>
                </div>

                <div className="rounded-xl bg-red-50 p-2">
                  <PackageX
                    size={15}
                    className="mx-auto text-red-700"
                  />

                  <p className="mt-1 text-sm font-bold text-red-900">
                    {summary.outOfStockCount}
                  </p>

                  <p className="text-[11px] text-red-700">
                    Out
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs font-semibold text-green-800">
                {active
                  ? "Selected — click to clear"
                  : "View this area →"}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
