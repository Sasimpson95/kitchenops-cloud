import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

import type {
  InventoryTrendDirection,
} from "@/components/inventory/types";

type InventorySparklineProps = {
  values: number[];
  direction: InventoryTrendDirection;
  change: number;
};

const number = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 2,
  }).format(value);

function getPoints(
  values: number[],
  width: number,
  height: number
): string {
  if (values.length === 0) {
    return "";
  }

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;

  return values
    .map((value, index) => {
      const x =
        values.length === 1
          ? width / 2
          : (index /
              (values.length - 1)) *
            width;

      const y =
        height -
        ((value - minimum) / range) *
          height;

      return `${x},${y}`;
    })
    .join(" ");
}

export default function InventorySparkline({
  values,
  direction,
  change,
}: InventorySparklineProps) {
  const points = getPoints(
    values,
    180,
    42
  );

  const presentation =
    direction === "up"
      ? {
          label: "Stock increased",
          icon: ArrowUpRight,
          className:
            "text-green-800",
          lineClass:
            "stroke-green-700",
        }
      : direction === "down"
        ? {
            label: "Stock decreased",
            icon: ArrowDownRight,
            className:
              "text-red-700",
            lineClass:
              "stroke-red-600",
          }
        : {
            label: "Stock unchanged",
            icon: ArrowRight,
            className:
              "text-gray-600",
            lineClass:
              "stroke-gray-500",
          };

  const Icon = presentation.icon;

  return (
    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-700">
            7-Day Stock Trend
          </p>

          <div
            className={`mt-1 flex items-center gap-1 text-xs font-semibold ${presentation.className}`}
          >
            <Icon size={15} />

            <span>
              {presentation.label}
              {" • "}
              {change > 0 ? "+" : ""}
              {number(change)}
            </span>
          </div>
        </div>

        <svg
          width="180"
          height="42"
          viewBox="0 0 180 42"
          role="img"
          aria-label="Seven day inventory trend"
          className="max-w-[48%] overflow-visible"
        >
          <polyline
            points={points}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={
              presentation.lineClass
            }
          />
        </svg>
      </div>
    </div>
  );
}
