import {
  PackageSearch,
} from "lucide-react";

import InventoryCard from "@/components/inventory/InventoryCard";

import type {
  InventoryProductRecord,
} from "@/components/inventory/types";

type InventoryCardsProps = {
  records: InventoryProductRecord[];
  onViewHistory: (
    record: InventoryProductRecord
  ) => void;
};

export default function InventoryCards({
  records,
  onViewHistory,
}: InventoryCardsProps) {
  if (records.length === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-slate-50 p-10 text-center">
        <PackageSearch
          size={36}
          className="mx-auto text-gray-400"
        />

        <h3 className="mt-4 text-xl font-bold text-gray-950">
          No products found
        </h3>

        <p className="mt-2 text-gray-500">
          Try changing the search or
          filters.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {records.map((record) => (
        <InventoryCard
          key={record.product.id}
          record={record}
          onViewHistory={
            onViewHistory
          }
        />
      ))}
    </div>
  );
}
