import { ClipboardList } from "lucide-react";

import type { WasteRecord } from "@/lib/wasteStore";
import WasteCard from "@/components/waste/WasteCard";

type WasteHistoryProps = {
  records: WasteRecord[];
  emptyMessage?: string;
};

export default function WasteHistory({
  records,
  emptyMessage = "No waste records match the current filters.",
}: WasteHistoryProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
        <ClipboardList size={36} className="mx-auto text-gray-400" />

        <h2 className="mt-4 text-xl font-bold text-gray-950">
          No waste recorded
        </h2>

        <p className="mt-2 text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <WasteCard key={record.id} record={record} />
      ))}
    </div>
  );
}
