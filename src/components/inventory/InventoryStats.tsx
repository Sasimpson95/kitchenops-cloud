import {
  AlertTriangle,
  Ban,
  Boxes,
  CircleDollarSign,
  PackageOpen,
} from "lucide-react";

import type {
  InventoryStatus,
} from "@/lib/inventoryValuation";

type InventoryStatsProps = {
  inventoryValue: number;
  trackedProducts: number;
  lowStock: number;
  outOfStock: number;
  overstock: number;
  onFilterStatus: (
    status: "All" | InventoryStatus
  ) => void;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);

type StatButtonProps = {
  title: string;
  value: string | number;
  className: string;
  icon: React.ReactNode;
  onClick: () => void;
};

function StatButton({
  title,
  value,
  className,
  icon,
  onClick,
}: StatButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          {title}
        </p>

        {icon}
      </div>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-3 text-xs font-semibold opacity-70">
        Click to filter
      </p>
    </button>
  );
}

export default function InventoryStats({
  inventoryValue,
  trackedProducts,
  lowStock,
  outOfStock,
  overstock,
  onFilterStatus,
}: InventoryStatsProps) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatButton
        title="Inventory Value"
        value={money(inventoryValue)}
        className="bg-emerald-50 text-emerald-950 sm:col-span-2 xl:col-span-1"
        icon={
          <CircleDollarSign
            size={22}
            className="text-emerald-700"
          />
        }
        onClick={() =>
          onFilterStatus("All")
        }
      />

      <StatButton
        title="Tracked Products"
        value={trackedProducts}
        className="bg-white text-gray-950"
        icon={
          <Boxes
            size={22}
            className="text-gray-500"
          />
        }
        onClick={() =>
          onFilterStatus("All")
        }
      />

      <StatButton
        title="Low / Reorder"
        value={lowStock}
        className="bg-orange-50 text-orange-950"
        icon={
          <AlertTriangle
            size={22}
            className="text-orange-700"
          />
        }
        onClick={() =>
          onFilterStatus("Reorder")
        }
      />

      <StatButton
        title="Out of Stock"
        value={outOfStock}
        className="bg-red-50 text-red-950"
        icon={
          <Ban
            size={22}
            className="text-red-700"
          />
        }
        onClick={() =>
          onFilterStatus(
            "Out of Stock"
          )
        }
      />

      <StatButton
        title="Overstock"
        value={overstock}
        className="bg-blue-50 text-blue-950"
        icon={
          <PackageOpen
            size={22}
            className="text-blue-700"
          />
        }
        onClick={() =>
          onFilterStatus("Overstock")
        }
      />
    </div>
  );
}
