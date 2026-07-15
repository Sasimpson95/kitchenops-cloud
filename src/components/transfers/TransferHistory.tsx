import { PackageSearch } from "lucide-react";

import type { StockTransfer } from "@/lib/transferStore";
import TransferCard from "@/components/transfers/TransferCard";

type TransferHistoryProps = {
  transfers: StockTransfer[];
};

export default function TransferHistory({
  transfers,
}: TransferHistoryProps) {
  if (transfers.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
        <PackageSearch size={38} className="mx-auto text-gray-400" />

        <h2 className="mt-4 text-2xl font-bold text-gray-950">
          No transfers recorded
        </h2>

        <p className="mt-2 text-gray-500">
          Completed stock transfers will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {transfers.map((transfer) => (
        <TransferCard key={transfer.id} transfer={transfer} />
      ))}
    </div>
  );
}
