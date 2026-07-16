"use client";

import { useState } from "react";

type PrepItem = {
  id: number;
  name: string;
  planned: number;
  produced: number;
  status: "planned" | "completed";
  recipe: string[];
};

const startingPrep: PrepItem[] = [
  {
    id: 1,
    name: "Wet Mix",
    planned: 5,
    produced: 0,
    status: "planned",
    recipe: ["100 Eggs", "15L Milk", "10kg Flour"],
  },
  {
    id: 2,
    name: "Salted Caramel",
    planned: 1,
    produced: 0,
    status: "planned",
    recipe: ["2kg Sugar", "1L Cream", "500g Butter"],
  },
];

export default function PrepPlannerPage() {
  const [items, setItems] = useState<PrepItem[]>(startingPrep);
  const [tomorrowItems, setTomorrowItems] = useState<PrepItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PrepItem | null>(null);
  const [producedAmount, setProducedAmount] = useState(0);
  const [addRemainingToTomorrow, setAddRemainingToTomorrow] = useState(true);

  function openConfirmModal(item: PrepItem) {
    setSelectedItem(item);
    setProducedAmount(item.planned);
    setAddRemainingToTomorrow(true);
  }

  function confirmProduction() {
    if (!selectedItem) return;

    const remaining = Math.max(selectedItem.planned - producedAmount, 0);

    setItems(
      items.map((item) =>
        item.id === selectedItem.id
          ? { ...item, status: "completed", produced: producedAmount }
          : item
      )
    );

    if (remaining > 0 && addRemainingToTomorrow) {
      setTomorrowItems((currentItems) => {
        const existingItem = currentItems.find(
          (item) => item.name === selectedItem.name
        );

        if (existingItem) {
          return currentItems.map((item) =>
            item.name === selectedItem.name
              ? { ...item, planned: item.planned + remaining }
              : item
          );
        }

        return [
          ...currentItems,
          {
            id: Date.now(),
            name: selectedItem.name,
            planned: remaining,
            produced: 0,
            status: "planned",
            recipe: selectedItem.recipe,
          },
        ];
      });
    }

    setSelectedItem(null);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-gray-950">Prep Planner</h1>

        <p className="mt-2 text-gray-600">
          Confirm production and carry any remaining prep into tomorrow.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="text-2xl font-bold text-gray-900">
              Today&apos;s Prep
            </h2>

            <div className="mt-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {item.name} x{item.planned}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {item.status === "completed"
                          ? `Produced ${item.produced} of ${item.planned}`
                          : "Ready to produce"}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button className="rounded-xl border px-4 py-2 font-medium">
                        📖 Recipe
                      </button>

                      {item.status !== "completed" && (
                        <button
                          onClick={() => openConfirmModal(item)}
                          className="rounded-xl bg-violet-800 px-4 py-2 font-semibold text-white hover:bg-violet-900"
                        >
                          Confirm Production
                        </button>
                      )}

                      {item.status === "completed" && (
                        <span className="rounded-xl bg-violet-100 px-4 py-2 font-semibold text-violet-800">
                          Produced {item.produced}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.status === "completed" && (
                    <div className="mt-4 rounded-xl bg-violet-50 p-4 text-sm text-violet-900">
                      ✅ {item.name} x{item.produced} produced. Inventory would
                      now update using the recipe ingredients.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900">
              Tomorrow&apos;s Prep
            </h2>

            <div className="mt-4 space-y-4">
              {tomorrowItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-white p-6 text-gray-500">
                  Nothing added to tomorrow yet.
                </div>
              ) : (
                tomorrowItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border bg-white p-6 shadow-sm"
                  >
                    <h3 className="text-2xl font-bold text-gray-900">
                      {item.name} x{item.planned}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Ready for tomorrow
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-2xl">
              ✅
            </div>

            <h2 className="text-center text-2xl font-bold text-gray-950">
              Confirm Production
            </h2>

            <p className="mt-2 text-center text-gray-600">
              {selectedItem.name}
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-center">
              <p className="text-sm text-gray-500">Planned</p>
              <p className="mt-1 text-xl font-bold text-gray-950">
                {selectedItem.planned} batches
              </p>
            </div>

            <div className="mt-6">
              <p className="mb-4 text-center text-sm font-medium text-gray-700">
                How many batches did you produce?
              </p>

              <div className="flex items-center justify-center gap-8 rounded-2xl border p-5">
                <button
                  onClick={() =>
                    setProducedAmount(Math.max(0, producedAmount - 1))
                  }
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-3xl font-bold hover:bg-slate-200"
                >
                  -
                </button>

                <span className="w-12 text-center text-4xl font-bold text-gray-950">
                  {producedAmount}
                </span>

                <button
                  onClick={() => setProducedAmount(producedAmount + 1)}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-3xl font-bold hover:bg-slate-200"
                >
                  +
                </button>
              </div>
            </div>

            {producedAmount < selectedItem.planned && (
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={addRemainingToTomorrow}
                  onChange={(e) =>
                    setAddRemainingToTomorrow(e.target.checked)
                  }
                  className="mt-1"
                />

                <span>
                  Add remaining{" "}
                  <strong>{selectedItem.planned - producedAmount}</strong> to
                  tomorrow&apos;s prep
                </span>
              </label>
            )}

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 rounded-xl border px-4 py-3 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmProduction}
                className="flex-1 rounded-xl bg-violet-800 px-4 py-3 font-semibold text-white hover:bg-violet-900"
              >
                ✅ Confirm Production
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}