import {
  AlertTriangle,
  CheckCircle2,
  Circle,
} from "lucide-react";

import type { Product } from "@/data/products";

type ProductHealthProps = {
  product: Product;
};

type HealthCheck = {
  label: string;
  complete: boolean;
  optional?: boolean;
};

export default function ProductHealth({
  product,
}: ProductHealthProps) {
  const checks: HealthCheck[] = [
    {
      label: "Preferred supplier assigned",
      complete:
        product.supplierId > 0 &&
        product.supplierName !==
          "Not assigned",
    },
    {
      label: "Supplier product code added",
      complete: Boolean(
        product.supplierCode.trim()
      ),
      optional: true,
    },
    {
      label: "Purchase conversion configured",
      complete:
        product.purchaseQuantity > 0 &&
        Boolean(
          product.orderUnit.trim()
        ) &&
        Boolean(
          product.inventoryUnit.trim()
        ),
    },
    {
      label: "Storage area assigned",
      complete: Boolean(
        product.storageArea.trim()
      ),
      optional: true,
    },
    {
      label: "Shelf or bin position added",
      complete:
        Boolean(product.shelf.trim()) ||
        Boolean(
          product.binLocation.trim()
        ),
      optional: true,
    },
    {
      label: "Stock levels configured",
      complete:
        product.maximumStock > 0 &&
        product.reorderPoint >= 0 &&
        product.minimumStock >= 0,
    },
    {
      label: "Delivery schedule configured",
      complete:
        product.deliveryDays.length > 0,
      optional: true,
    },
  ];

  const requiredChecks =
    checks.filter(
      (check) => !check.optional
    );

  const requiredComplete =
    requiredChecks.filter(
      (check) => check.complete
    ).length;

  const percentage =
    requiredChecks.length === 0
      ? 100
      : Math.round(
          (requiredComplete /
            requiredChecks.length) *
            100
        );

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-950">
            Product Health
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Checks that important product information is complete.
          </p>
        </div>

        <div
          className={`rounded-2xl px-4 py-3 text-center ${
            percentage === 100
              ? "bg-violet-100 text-violet-900"
              : "bg-orange-100 text-orange-900"
          }`}
        >
          <p className="text-2xl font-bold">
            {percentage}%
          </p>

          <p className="text-xs font-semibold">
            Complete
          </p>
        </div>
      </div>

      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${
            percentage === 100
              ? "bg-violet-700"
              : "bg-orange-600"
          }`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <div className="mt-5 space-y-3">
        {checks.map((check) => (
          <div
            key={check.label}
            className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
          >
            {check.complete ? (
              <CheckCircle2
                size={19}
                className="shrink-0 text-violet-700"
              />
            ) : check.optional ? (
              <Circle
                size={19}
                className="shrink-0 text-gray-400"
              />
            ) : (
              <AlertTriangle
                size={19}
                className="shrink-0 text-orange-700"
              />
            )}

            <p
              className={`text-sm font-semibold ${
                check.complete
                  ? "text-gray-800"
                  : check.optional
                    ? "text-gray-500"
                    : "text-orange-900"
              }`}
            >
              {check.label}
              {check.optional &&
                !check.complete && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    Optional
                  </span>
                )}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
