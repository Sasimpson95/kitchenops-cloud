"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import Greeting from "./Greeting";
import SiteOverviewCard from "./SiteOverviewCard";
import RecipeModal from "@/components/recipes/RecipeModal";

import { stocktakes } from "@/data/stocktakes";
import { handoverNotes } from "@/data/handovers";
import { deliveries } from "@/data/deliveries";

import type {
  ProductionItem,
} from "@/data/production";

import {
  type Recipe,
  findRecipe,
} from "@/data/recipes";

import {
  approvePrepItem,
  getPrepItems,
  subscribeToPrepChanges,
} from "@/lib/prepStore";

const sites = [
  "All Sites",
  "Beeston",
  "City",
  "Sherwood",
  "Bakery",
];

export default function Dashboard() {
  const [selectedSite, setSelectedSite] =
    useState("All Sites");

  const [
    prepItems,
    setPrepItems,
  ] = useState<ProductionItem[]>([]);

  const [
    reviewItem,
    setReviewItem,
  ] = useState<ProductionItem | null>(
    null
  );

  const [
    preparedAmount,
    setPreparedAmount,
  ] = useState(0);

  const [
    addRemainingToTomorrow,
    setAddRemainingToTomorrow,
  ] = useState(true);

  const [
    selectedRecipe,
    setSelectedRecipe,
  ] = useState<Recipe | null>(null);

  const [
    selectedRecipeBatches,
    setSelectedRecipeBatches,
  ] = useState(1);

  const [approvalError, setApprovalError] =
    useState("");

  const refreshPrep =
    useCallback(() => {
      setPrepItems(getPrepItems());
    }, []);

  useEffect(() => {
    refreshPrep();

    const unsubscribe =
      subscribeToPrepChanges(
        refreshPrep
      );

    return unsubscribe;
  }, [refreshPrep]);

  const money = (value: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(value);

  const selectedSitePrep =
    prepItems.filter(
      (item) =>
        item.site === selectedSite
    );

  const awaitingApproval =
    selectedSitePrep.filter(
      (item) =>
        item.day === "today" &&
        item.status ===
          "awaitingApproval"
    );

  const todaysPrep =
    selectedSitePrep.filter(
      (item) =>
        item.day === "today" &&
        item.status !== "approved"
    );

  const tomorrowsPrep =
    selectedSitePrep.filter(
      (item) =>
        item.day === "tomorrow"
    );

  function openRecipe(
    item: ProductionItem
  ): void {
    const recipe = findRecipe(
      item.name
    );

    if (!recipe) {
      window.alert(
        "The matching recipe could not be found."
      );

      return;
    }

    setSelectedRecipe(recipe);

    setSelectedRecipeBatches(
      item.produced > 0
        ? item.produced
        : item.planned
    );
  }

  function openManagerReview(
    item: ProductionItem
  ): void {
    if (
      item.status !==
      "awaitingApproval"
    ) {
      return;
    }

    setApprovalError("");
    setReviewItem(item);

    setPreparedAmount(
      item.produced > 0
        ? item.produced
        : item.planned
    );

    setAddRemainingToTomorrow(true);
  }

  function closeReview(): void {
    setReviewItem(null);
    setPreparedAmount(0);
    setApprovalError("");
  }

  function approvePrep(): void {
    if (!reviewItem) {
      return;
    }

    try {
      approvePrepItem({
        id: reviewItem.id,

        approvedQuantity:
          preparedAmount,

        addRemainingToTomorrow,
      });

      closeReview();
    } catch (caughtError) {
      setApprovalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Prep could not be approved."
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl p-8">
        <Greeting />

        <div className="mt-6 flex items-end justify-between">
          <div>
            <label className="text-sm font-semibold text-gray-600">
              Viewing
            </label>

            <select
              value={selectedSite}
              onChange={(event) =>
                setSelectedSite(
                  event.target.value
                )
              }
              className="mt-2 block w-64 rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-900 shadow-sm"
            >
              {sites.map((site) => (
                <option key={site}>
                  {site}
                </option>
              ))}
            </select>
          </div>

          {selectedSite !==
            "All Sites" && (
            <button
              type="button"
              onClick={() =>
                setSelectedSite(
                  "All Sites"
                )
              }
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-slate-50"
            >
              ← Back to All Sites
            </button>
          )}
        </div>

        {selectedSite ===
        "All Sites" ? (
          <>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {sites
                .filter(
                  (site) =>
                    site !== "All Sites"
                )
                .map((site) => (
                  <SiteOverviewCard
                    key={site}
                    site={site}
                    onSelect={() =>
                      setSelectedSite(site)
                    }
                  />
                ))}
            </div>

            <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-950">
                Latest Stocktake
              </h2>

              <div className="mt-6 grid gap-4 lg:grid-cols-4">
                {stocktakes.map(
                  (stocktake) => {
                    const difference =
                      stocktake.latestValue -
                      stocktake.previousValue;

                    return (
                      <div
                        key={
                          stocktake.site
                        }
                        className="rounded-2xl bg-slate-50 p-5"
                      >
                        <h3 className="text-lg font-bold text-gray-950">
                          {
                            stocktake.site
                          }
                        </h3>

                        <p className="mt-4 text-sm text-gray-500">
                          Latest Stocktake
                        </p>

                        <p className="font-semibold text-gray-900">
                          {
                            stocktake.latestDate
                          }{" "}
                          —{" "}
                          {money(
                            stocktake.latestValue
                          )}
                        </p>

                        <p className="mt-3 text-sm text-gray-500">
                          Previous Stocktake
                        </p>

                        <p className="font-semibold text-gray-900">
                          {
                            stocktake.previousDate
                          }{" "}
                          —{" "}
                          {money(
                            stocktake.previousValue
                          )}
                        </p>

                        <div className="mt-5 rounded-xl bg-white p-4">
                          <p className="text-sm text-gray-500">
                            Difference
                          </p>

                          <p
                            className={`mt-1 text-2xl font-bold ${
                              difference >= 0
                                ? "text-violet-800"
                                : "text-red-700"
                            }`}
                          >
                            {difference >= 0
                              ? "+"
                              : ""}
                            {money(
                              difference
                            )}
                          </p>

                          <div className="mt-5">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">
                                Completion
                              </span>

                              <span className="font-semibold">
                                {
                                  stocktake.completion
                                }
                                %
                              </span>
                            </div>

                            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-violet-700"
                                style={{
                                  width: `${stocktake.completion}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-xl font-bold">
                Prep Awaiting Approval (
                {awaitingApproval.length})
              </h2>

              {awaitingApproval.length ===
              0 ? (
                <p className="mt-5 rounded-2xl bg-violet-50 p-5 font-semibold text-violet-800">
                  ✅ Nothing awaiting
                  approval.
                </p>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {awaitingApproval.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl bg-slate-50 p-5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xl font-bold">
                              {item.emoji}{" "}
                              {item.name}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              Planned x
                              {item.planned}
                            </p>

                            <p className="mt-1 text-sm font-semibold text-yellow-700">
                              Chef entered x
                              {item.produced}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              Prepared by{" "}
                              {item.chef ??
                                "Chef"}{" "}
                              at{" "}
                              {item.readyTime ??
                                "now"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              openManagerReview(
                                item
                              )
                            }
                            className="rounded-xl bg-violet-800 px-4 py-2 font-semibold text-white hover:bg-violet-900"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">
                {selectedSite} — Today&apos;s
                Handover
              </h2>

              <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-gray-700">
                <ul className="space-y-3">
                  {handoverNotes.map(
                    (note) => (
                      <li key={note}>
                        • {note}
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div className="mt-5 border-t pt-5">
                <h3 className="font-bold">
                  Tomorrow&apos;s Handover
                </h3>

                <button
                  type="button"
                  className="mt-4 rounded-xl border border-violet-800 px-5 py-3 font-semibold text-violet-800 hover:bg-violet-50"
                >
                  Prepare Tomorrow
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">
                {selectedSite} — Today&apos;s
                Prep
              </h2>

              <div className="mt-5 space-y-4">
                {todaysPrep.length === 0 ? (
                  <p className="rounded-2xl bg-violet-50 p-5 font-semibold text-violet-800">
                    ✅ All prep complete.
                  </p>
                ) : (
                  todaysPrep.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold">
                            {item.emoji}{" "}
                            {item.name}
                          </p>

                          <p className="text-sm text-gray-500">
                            Planned x
                            {item.planned}
                          </p>

                          {item.status ===
                            "awaitingApproval" && (
                            <p className="mt-1 text-sm font-semibold text-yellow-700">
                              Awaiting manager
                              approval — entered x
                              {item.produced}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openRecipe(item)
                            }
                            className="rounded-xl border px-3 py-2 text-sm font-semibold"
                          >
                            📖 Recipe
                          </button>

                          {item.status ===
                            "awaitingApproval" && (
                            <button
                              type="button"
                              onClick={() =>
                                openManagerReview(
                                  item
                                )
                              }
                              className="rounded-xl bg-yellow-500 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
                            >
                              Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 border-t pt-5">
                <h3 className="font-bold">
                  Tomorrow&apos;s Prep
                </h3>

                {tomorrowsPrep.length === 0 ? (
                  <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-500">
                    Nothing planned for tomorrow
                    yet.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {tomorrowsPrep.map(
                      (item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                        >
                          <div>
                            <p className="font-bold">
                              {item.emoji}{" "}
                              {item.name}
                            </p>

                            <p className="text-sm text-gray-500">
                              Planned x
                              {item.planned}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              openRecipe(item)
                            }
                            className="rounded-xl border border-violet-800 px-3 py-2 text-sm font-semibold text-violet-800"
                          >
                            📖 Recipe
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}

                <Link
                  href="/production"
                  className="mt-4 inline-block rounded-xl border border-violet-800 px-5 py-3 font-semibold text-violet-800 hover:bg-violet-50"
                >
                  + Add to Tomorrow
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">
                Receive Deliveries
              </h2>

              <div className="mt-5 space-y-4">
                {deliveries.map(
                  (delivery) => (
                    <div
                      key={
                        delivery.supplier
                      }
                      className="rounded-2xl bg-slate-50 p-5"
                    >
                      <p className="font-bold">
                        {
                          delivery.supplier
                        }
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {
                          delivery.expected
                        }
                      </p>

                      <Link
                        href="/purchasing"
                        className="mt-4 inline-block rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white"
                      >
                        Receive Order
                      </Link>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">
                Waste
              </h2>

              <p className="mt-4 text-4xl font-bold">
                £24.50
              </p>

              <p className="mt-2 text-gray-500">
                3 entries today
              </p>

              <Link
                href="/waste"
                className="mt-6 inline-block rounded-xl bg-red-600 px-5 py-3 font-semibold text-white"
              >
                Record Waste
              </Link>
            </div>
          </div>
        )}

        {reviewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
              <h2 className="text-center text-2xl font-bold text-gray-950">
                Review Prep
              </h2>

              <p className="mt-2 text-center text-gray-600">
                {reviewItem.emoji}{" "}
                {reviewItem.name}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5 text-center">
                  <p className="text-sm text-gray-500">
                    Planned
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-950">
                    {reviewItem.planned}
                  </p>
                </div>

                <div className="rounded-2xl bg-yellow-50 p-5 text-center">
                  <p className="text-sm text-yellow-700">
                    Chef entered
                  </p>

                  <p className="mt-1 text-xl font-bold text-yellow-900">
                    {reviewItem.produced}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-4 text-center font-medium text-gray-700">
                  Confirm the number of batches
                  prepared
                </p>

                <div className="flex items-center justify-center gap-8 rounded-2xl border p-5">
                  <button
                    type="button"
                    onClick={() =>
                      setPreparedAmount(
                        Math.max(
                          0,
                          preparedAmount - 1
                        )
                      )
                    }
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-3xl font-bold hover:bg-slate-200"
                  >
                    −
                  </button>

                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={preparedAmount}
                    onChange={(event) =>
                      setPreparedAmount(
                        Math.max(
                          0,

                          Number(
                            event.target.value
                          ) || 0
                        )
                      )
                    }
                    className="w-24 rounded-xl border border-gray-300 px-3 py-3 text-center text-3xl font-bold outline-none focus:border-violet-800"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setPreparedAmount(
                        preparedAmount + 1
                      )
                    }
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-3xl font-bold hover:bg-slate-200"
                  >
                    +
                  </button>
                </div>
              </div>

              {preparedAmount <
                reviewItem.planned && (
                <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={
                      addRemainingToTomorrow
                    }
                    onChange={(event) =>
                      setAddRemainingToTomorrow(
                        event.target.checked
                      )
                    }
                    className="mt-1"
                  />

                  <span>
                    Add remaining{" "}
                    <strong>
                      {reviewItem.planned -
                        preparedAmount}
                    </strong>{" "}
                    to tomorrow&apos;s prep
                  </span>
                </label>
              )}

              {approvalError && (
                <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">
                  {approvalError}
                </div>
              )}

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={closeReview}
                  className="flex-1 rounded-xl border px-4 py-3 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={approvePrep}
                  className="flex-1 rounded-xl bg-violet-800 px-4 py-3 font-semibold text-white hover:bg-violet-900"
                >
                  Approve Prep
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-gray-500">
                Ingredients will only be
                deducted after approval.
              </p>
            </div>
          </div>
        )}

        {selectedRecipe && (
          <RecipeModal
            recipe={selectedRecipe}
            initialBatches={
              selectedRecipeBatches
            }
            onClose={() =>
              setSelectedRecipe(null)
            }
          />
        )}
      </div>
    </main>
  );
}