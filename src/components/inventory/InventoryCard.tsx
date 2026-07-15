import {
  Clock3,
  History,
  MapPin,
  Package,
  Truck,
} from "lucide-react";

import InventorySparkline from "@/components/inventory/InventorySparkline";

import type {
  InventoryProductRecord,
} from "@/components/inventory/types";

const number = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 2,
  }).format(value);

const money = (
  value: number,
  maximumFractionDigits = 2
) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits,
  }).format(value);

const statusStyles = {
  Healthy: {
    badge:
      "bg-green-100 text-green-800",
    border: "border-t-green-600",
    bar: "bg-green-600",
  },
  "Low Stock": {
    badge:
      "bg-orange-100 text-orange-800",
    border: "border-t-orange-500",
    bar: "bg-orange-500",
  },
  Reorder: {
    badge:
      "bg-red-100 text-red-800",
    border: "border-t-red-600",
    bar: "bg-red-600",
  },
  "Out of Stock": {
    badge:
      "bg-gray-900 text-white",
    border: "border-t-gray-900",
    bar: "bg-gray-900",
  },
  Overstock: {
    badge:
      "bg-blue-100 text-blue-800",
    border: "border-t-blue-600",
    bar: "bg-blue-600",
  },
};

type InventoryCardProps = {
  record: InventoryProductRecord;
  onViewHistory: (
    record: InventoryProductRecord
  ) => void;
};

function formatMovementDate(
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
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

export default function InventoryCard({
  record,
  onViewHistory,
}: InventoryCardProps) {
  const {
    product,
    stock,
    unitCost,
    stockValue,
    status,
    lastMovement,
    movementCount,
    trendValues,
    trendDirection,
    sevenDayChange,
  } = record;

  const style = statusStyles[status];

  const maximum =
    product.maximumStock > 0
      ? product.maximumStock
      : 1;

  const stockPercentage = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (stock / maximum) * 100
      )
    )
  );

  return (
    <article
      className={`rounded-3xl border border-t-4 border-gray-200 ${style.border} bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-950">
            {product.name}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {product.category}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}
        >
          {status}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-gray-500">
            Current Stock
          </p>

          <p className="mt-1 text-3xl font-bold text-gray-950">
            {number(stock)}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {product.inventoryUnit}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">
            Stock Value
          </p>

          <p className="mt-1 text-3xl font-bold text-emerald-950">
            {money(stockValue)}
          </p>

          <p className="mt-1 text-xs text-emerald-700">
            {money(unitCost, 4)} per{" "}
            {product.inventoryUnit}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
          <span>Stock level</span>
          <span>{stockPercentage}% of maximum</span>
        </div>

        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all ${style.bar}`}
            style={{
              width: `${stockPercentage}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">
            Minimum
          </p>

          <p className="mt-1 font-bold text-gray-950">
            {number(
              product.minimumStock
            )}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">
            Reorder
          </p>

          <p className="mt-1 font-bold text-gray-950">
            {number(
              product.reorderPoint
            )}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">
            Maximum
          </p>

          <p className="mt-1 font-bold text-gray-950">
            {number(
              product.maximumStock
            )}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2 text-sm text-gray-600">
        <p className="flex items-center gap-2">
          <Truck size={16} />

          <span>
            <strong>Supplier:</strong>{" "}
            {product.supplierName}
          </span>
        </p>

        <p className="flex items-center gap-2">
          <MapPin size={16} />

          <span>
            <strong>Area:</strong>{" "}
            {product.location}
          </span>
        </p>

        <p className="flex items-center gap-2">
          <Package size={16} />

          <span>
            <strong>Purchase:</strong>{" "}
            {product.purchaseQuantity}{" "}
            {product.inventoryUnit} per{" "}
            {product.orderUnit}
          </span>
        </p>
      </div>

      <InventorySparkline
        values={trendValues}
        direction={trendDirection}
        change={sevenDayChange}
      />

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Clock3 size={16} />
          Last Movement
        </div>

        {lastMovement ? (
          <>
            <p className="mt-2 font-bold text-gray-950">
              {lastMovement.movementType}
              {" "}
              {lastMovement.quantity >= 0
                ? "+"
                : ""}
              {number(
                lastMovement.quantity
              )}{" "}
              {product.inventoryUnit}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {formatMovementDate(
                lastMovement.createdAt
              )}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            No movements recorded yet.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() =>
          onViewHistory(record)
        }
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-green-800 px-5 py-3 font-semibold text-green-800 transition hover:bg-green-50"
      >
        <History size={18} />
        View History ({movementCount})
      </button>
    </article>
  );
}
