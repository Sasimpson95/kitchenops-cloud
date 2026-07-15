import {
  History,
} from "lucide-react";

import type {
  RecipeCostHistoryRecord,
} from "@/lib/recipeCostingStore";

function money(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-GB",
    {
      style: "currency",
      currency: "GBP",
    }
  ).format(value);
}

function formatDate(
  value: string
): string {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(
    new Date(value)
  );
}

export default function RecipeCostHistory({
  records,
}: {
  records: RecipeCostHistoryRecord[];
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <History
          size={22}
          className="text-green-800"
        />

        <div>
          <h2 className="text-xl font-bold text-gray-950">
            Cost History
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Snapshots created when the recipe cost or selling price changes.
          </p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-gray-500">
          No cost history has been recorded yet.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {records
            .slice(0, 20)
            .map((record) => (
              <div
                key={record.id}
                className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
              >
                <p className="text-sm font-semibold text-gray-600">
                  {formatDate(
                    record.createdAt
                  )}
                </p>

                <div>
                  <p className="text-xs text-gray-500">
                    Recipe cost
                  </p>

                  <p className="font-bold text-gray-950">
                    {money(
                      record.totalRecipeCost
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Cost / portion
                  </p>

                  <p className="font-bold text-gray-950">
                    {money(
                      record.costPerPortion
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    GP
                  </p>

                  <p className="font-bold text-green-800">
                    {record.sellingPrice >
                    0
                      ? `${record.grossProfitPercentage.toFixed(
                          1
                        )}%`
                      : "Not set"}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
