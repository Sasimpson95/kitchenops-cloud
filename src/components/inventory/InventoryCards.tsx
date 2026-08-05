import {
  PackageSearch,
} from "lucide-react";

import InventoryCard from "@/components/inventory/InventoryCard";
import EmptyState from "@/components/ui/EmptyState";

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
      <EmptyState
        className="mt-6"
        compact
        icon={<PackageSearch className="h-6 w-6" />}
        title="No inventory products found"
        description="Try clearing the search or filters. Products appear here once they are active in the catalogue for this site."
      />
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
