"use client";

import {
  ArrowDown,
  ArrowUp,
  History,
  X,
} from "lucide-react";

import type {
  InventoryProductRecord,
} from "@/components/inventory/types";

import type {
  InventoryMovement,
} from "@/lib/inventoryStore";

type InventoryHistoryModalProps = {
  record: InventoryProductRecord;
  movements: InventoryMovement[];
  onClose: () => void;
};

const number = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 2,
  }).format(value);

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

export default function InventoryHistoryModal({
  record,
  movements,
  onClose,
}: InventoryHistoryModalProps) {
  const productMovements =
    movements
      .filter(
        (movement) =>
          movement.productId ===
          record.product.id
      )
      .sort(
        (first, second) =>
          new Date(
            second.createdAt
          ).getTime() -
          new Date(
            first.createdAt
          ).getTime()
      );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4 border-b p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-800">
              <History size={24} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-950">
                {record.product.name}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Movement History
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-gray-600 transition hover:bg-slate-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-3 border-b bg-slate-50 p-6 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm text-gray-500">
              Current Stock
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-950">
              {number(record.stock)}{" "}
              {record.product.inventoryUnit}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm text-gray-500">
              Movements
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-950">
              {productMovements.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm text-gray-500">
              Status
            </p>

            <p className="mt-1 text-xl font-bold text-gray-950">
              {record.status}
            </p>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-6">
          {productMovements.length ===
          0 ? (
            <div className="rounded-2xl bg-slate-50 p-10 text-center text-gray-500">
              No movements recorded for
              this product.
            </div>
          ) : (
            <div className="space-y-3">
              {productMovements.map(
                (movement) => (
                  <div
                    key={movement.id}
                    className="grid gap-4 rounded-2xl border border-gray-200 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        movement.quantity >= 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {movement.quantity >=
                      0 ? (
                        <ArrowUp
                          size={20}
                        />
                      ) : (
                        <ArrowDown
                          size={20}
                        />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-gray-950">
                          {
                            movement.movementType
                          }
                        </p>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          {
                            movement.referenceNumber
                          }
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        {formatDateTime(
                          movement.createdAt
                        )}
                      </p>
                    </div>

                    <p
                      className={`text-xl font-bold ${
                        movement.quantity >= 0
                          ? "text-green-800"
                          : "text-red-700"
                      }`}
                    >
                      {movement.quantity >= 0
                        ? "+"
                        : ""}
                      {number(
                        movement.quantity
                      )}{" "}
                      {
                        record.product
                          .inventoryUnit
                      }
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
