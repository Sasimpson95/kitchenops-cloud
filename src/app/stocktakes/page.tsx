"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Building2,
  CalendarClock,
  ClipboardCheck,
  Plus,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import StartStocktakeModal from "@/components/stocktakes/StartStocktakeModal";
import StocktakeCard from "@/components/stocktakes/StocktakeCard";
import StocktakeAreas from "@/components/stocktakes/StocktakeAreas";
import StocktakeCounter from "@/components/stocktakes/StocktakeCounter";
import StocktakeResults from "@/components/stocktakes/StocktakeResults";

import type {
  User,
} from "@/config/roles";

import type {
  Product,
} from "@/data/products";

import {
  getCurrentUser,
} from "@/lib/currentUser";

import {
  getActiveProducts,
  subscribeToProductChanges,
} from "@/lib/productStore";

import {
  getBusinessSettings,
  subscribeToBusinessSettingsChanges,
  type BusinessSettings,
} from "@/lib/businessSettingsStore";

import {
  completeStocktake,
  getReadableFrequency,
  getStocktakeForPeriod,
  getStocktakePeriod,
  getStocktakes,
  saveStocktakeCount,
  setStocktakeCurrentIndex,
  startStocktake,
  subscribeToStocktakeChanges,
  type Stocktake,
} from "@/lib/stocktakeStore";

const SITE_OPTIONS = [
  "All Sites",
  "Beeston",
  "City",
  "Sherwood",
  "Bakery",
];

function getSiteId(
  siteName: string
): string {
  return siteName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export default function StocktakesPage() {
  const router = useRouter();

  const [
    currentUser,
    setCurrentUser,
  ] = useState<User | null>(null);

  const [
    loadingUser,
    setLoadingUser,
  ] = useState(true);

  const [
    productList,
    setProductList,
  ] = useState<Product[]>([]);

  const [
    stocktakeList,
    setStocktakeList,
  ] = useState<Stocktake[]>([]);

  const [
    settings,
    setSettings,
  ] = useState<BusinessSettings>(
    getBusinessSettings()
  );

  const [
    selectedSite,
    setSelectedSite,
  ] = useState("All Sites");

  const [
    activeStocktakeId,
    setActiveStocktakeId,
  ] = useState<string | null>(
    null
  );

  const [
    selectedArea,
    setSelectedArea,
  ] = useState<string | null>(
    null
  );

  const [
    resultsStocktakeId,
    setResultsStocktakeId,
  ] = useState<string | null>(
    null
  );

  const [
    showStartModal,
    setShowStartModal,
  ] = useState(false);

  const [
    starting,
    setStarting,
  ] = useState(false);

  const [
    finishing,
    setFinishing,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const isOperations =
    currentUser?.role === "operations";

  const refreshProducts =
    useCallback(() => {
      setProductList(
        getActiveProducts()
      );
    }, []);

  const refreshStocktakes =
    useCallback(() => {
      setStocktakeList(
        getStocktakes()
      );
    }, []);

  const refreshSettings =
    useCallback(() => {
      setSettings(
        getBusinessSettings()
      );
    }, []);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "chef") {
      router.replace("/home");
      return;
    }

    setCurrentUser(user);

    setSelectedSite(
      user.role === "operations"
        ? "All Sites"
        : user.site
    );

    setLoadingUser(false);
  }, [router]);

  useEffect(() => {
    refreshProducts();
    refreshStocktakes();
    refreshSettings();

    const unsubscribeProducts =
      subscribeToProductChanges(
        refreshProducts
      );

    const unsubscribeStocktakes =
      subscribeToStocktakeChanges(
        refreshStocktakes
      );

    const unsubscribeSettings =
      subscribeToBusinessSettingsChanges(
        refreshSettings
      );

    return () => {
      unsubscribeProducts();
      unsubscribeStocktakes();
      unsubscribeSettings();
    };
  }, [
    refreshProducts,
    refreshStocktakes,
    refreshSettings,
  ]);

  const currentPeriod =
    useMemo(
      () =>
        getStocktakePeriod(
          settings
        ),
      [settings]
    );

  const activeStocktake =
    activeStocktakeId
      ? stocktakeList.find(
          (stocktake) =>
            stocktake.id ===
            activeStocktakeId
        ) ?? null
      : null;

  const resultsStocktake =
    resultsStocktakeId
      ? stocktakeList.find(
          (stocktake) =>
            stocktake.id ===
            resultsStocktakeId
        ) ?? null
      : null;

  const selectedSiteId =
    selectedSite === "All Sites"
      ? null
      : getSiteId(selectedSite);

  const selectedSiteStocktakes =
    selectedSiteId
      ? stocktakeList.filter(
          (stocktake) =>
            stocktake.siteId ===
            selectedSiteId
        )
      : [];

  const openStocktake =
    selectedSiteStocktakes.find(
      (stocktake) =>
        stocktake.status ===
        "In Progress"
    );

  const currentPeriodStocktake =
    selectedSiteId
      ? getStocktakeForPeriod(
          selectedSiteId,
          currentPeriod.key
        )
      : undefined;

  const completedStocktakes =
    selectedSiteStocktakes.filter(
      (stocktake) =>
        stocktake.status ===
        "Completed"
    );

  const siteSummaries =
    SITE_OPTIONS.filter(
      (site) =>
        site !== "All Sites"
    ).map((site) => {
      const siteId =
        getSiteId(site);

      const siteStocktakes =
        stocktakeList.filter(
          (stocktake) =>
            stocktake.siteId ===
            siteId
        );

      const current =
        siteStocktakes.find(
          (stocktake) =>
            stocktake.periodKey ===
            currentPeriod.key
        );

      const open =
        siteStocktakes.find(
          (stocktake) =>
            stocktake.status ===
            "In Progress"
        );

      return {
        site,
        current,
        open,
        completedCount:
          siteStocktakes.filter(
            (stocktake) =>
              stocktake.status ===
              "Completed"
          ).length,
      };
    });

  function changeSite(
    site: string
  ): void {
    if (!isOperations) {
      return;
    }

    setSelectedSite(site);
    setActiveStocktakeId(null);
    setSelectedArea(null);
    setResultsStocktakeId(null);
    setShowStartModal(false);
    setError("");
  }

  function handleStart(): void {
    if (
      !currentUser ||
      !selectedSiteId ||
      selectedSite === "All Sites"
    ) {
      return;
    }

    try {
      setStarting(true);
      setError("");

      const stocktake =
        startStocktake({
          siteId:
            selectedSiteId,

          siteName:
            selectedSite,

          products:
            productList,

          startedBy:
            currentUser.name,

          settings,
        });

      setShowStartModal(false);

      setActiveStocktakeId(
        stocktake.id
      );

      setSelectedArea(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The stocktake could not be started."
      );
    } finally {
      setStarting(false);
    }
  }

  function handleSaveCount(
    itemId: string,
    quantity: number,
    nextIndex: number
  ): void {
    if (!activeStocktake) {
      return;
    }

    try {
      setError("");

      saveStocktakeCount(
        activeStocktake.id,
        itemId,
        quantity,
        nextIndex
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The count could not be saved."
      );
    }
  }

  function handleMove(
    index: number
  ): void {
    if (!activeStocktake) {
      return;
    }

    try {
      setError("");

      setStocktakeCurrentIndex(
        activeStocktake.id,
        index
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The product could not be opened."
      );
    }
  }

  function handleFinish(): void {
    if (
      !activeStocktake ||
      !currentUser
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Finish this stocktake? Inventory will update immediately and the completed result cannot be edited."
      );

    if (!confirmed) {
      return;
    }

    try {
      setFinishing(true);
      setError("");

      const completed =
        completeStocktake(
          activeStocktake.id,
          currentUser.name
        );

      setActiveStocktakeId(null);

      setResultsStocktakeId(
        completed.id
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The stocktake could not be finished."
      );
    } finally {
      setFinishing(false);
    }
  }

  if (
    loadingUser ||
    !currentUser
  ) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="font-semibold text-gray-600">
            Loading Stocktakes...
          </p>
        </main>
      </ProtectedPage>
    );
  }

  if (activeStocktake) {
    const activeAreaItems = selectedArea
      ? activeStocktake.items.filter(
          (item) =>
            (item.location || "Not assigned") ===
            selectedArea
        )
      : [];

    const firstAreaIndex =
      activeAreaItems.findIndex(
        (item) =>
          item.countedQuantity === null
      );

    const selectedAreaStartIndex =
      selectedArea
        ? activeStocktake.items.findIndex(
            (item) =>
              (item.location || "Not assigned") ===
                selectedArea &&
              (
                firstAreaIndex < 0 ||
                item.id ===
                  activeAreaItems[firstAreaIndex]
                    ?.id
              )
          )
        : -1;

    function openArea(
      areaName: string
    ): void {
      setSelectedArea(areaName);

      const currentStocktake = activeStocktake;

      if (!currentStocktake) {
        return;
      }

      const areaItems =
        currentStocktake.items
          .map((item, index) => ({
            ...item,
            index,
          }))
          .filter(
            (item) =>
              (item.location ||
                "Not assigned") ===
              areaName
          );

      const firstUncounted =
        areaItems.find(
          (item) =>
            item.countedQuantity === null
        );

      const firstItem =
        firstUncounted ??
        areaItems[0];

      if (firstItem) {
        handleMove(firstItem.index);
      }
    }

    return (
      <ProtectedPage>
        <main className="min-h-screen bg-slate-100 p-8">
          {selectedArea ? (
            <StocktakeCounter
              stocktake={
                activeStocktake
              }
              areaName={selectedArea}
              onSaveCount={
                handleSaveCount
              }
              onMove={handleMove}
              onBackToAreas={() =>
                setSelectedArea(null)
              }
              error={error}
            />
          ) : (
            <StocktakeAreas
              stocktake={
                activeStocktake
              }
              onSelectArea={
                openArea
              }
              onFinish={
                handleFinish
              }
              onExit={() => {
                setActiveStocktakeId(
                  null
                );
                setSelectedArea(null);
              }}
              finishing={finishing}
              error={error}
            />
          )}
        </main>
      </ProtectedPage>
    );
  }

  if (resultsStocktake) {
    return (
      <ProtectedPage>
        <main className="min-h-screen bg-slate-100 p-8">
          <StocktakeResults
            stocktake={
              resultsStocktake
            }
            onBack={() =>
              setResultsStocktakeId(
                null
              )
            }
          />
        </main>
      </ProtectedPage>
    );
  }

  const canStart =
    selectedSite !== "All Sites" &&
    !openStocktake &&
    (
      settings.stocktakeFrequency ===
        "manual" ||
      !currentPeriodStocktake
    );

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-950">
                Stocktakes
              </h1>

              <p className="mt-2 text-gray-600">
                Count stock and update Inventory as soon as the stocktake is finished.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                setShowStartModal(true);
              }}
              disabled={!canStart}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-800 px-6 py-3 font-semibold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
            >
              <Plus size={20} />
              New Stocktake
            </button>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <label className="text-sm font-semibold text-gray-600">
                Viewing Site
              </label>

              {isOperations ? (
                <select
                  value={selectedSite}
                  onChange={(event) =>
                    changeSite(
                      event.target.value
                    )
                  }
                  className="mt-2 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-900 outline-none focus:border-green-800"
                >
                  {SITE_OPTIONS.map(
                    (site) => (
                      <option
                        key={site}
                        value={site}
                      >
                        {site}
                      </option>
                    )
                  )}
                </select>
              ) : (
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-slate-50 px-4 py-3">
                  <Building2
                    size={20}
                    className="text-green-800"
                  />

                  <span className="font-semibold text-gray-900">
                    {selectedSite}
                  </span>

                  <span className="ml-auto text-xs font-semibold text-gray-500">
                    Assigned site
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CalendarClock
                  size={22}
                  className="text-green-800"
                />

                <div>
                  <p className="text-sm text-gray-500">
                    Current Schedule
                  </p>

                  <p className="font-bold text-gray-950">
                    {getReadableFrequency(
                      settings.stocktakeFrequency
                    )}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-600">
                {settings.stocktakeFrequency ===
                "manual"
                  ? "No scheduled period. Stocktakes can be started when required."
                  : currentPeriod.label}
              </p>
            </div>
          </div>

          {selectedSite ===
          "All Sites" ? (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-950">
                Current Stocktake Status
              </h2>

              <p className="mt-2 text-gray-600">
                Select a site to start, resume or inspect its stocktakes.
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {siteSummaries.map(
                  (summary) => (
                    <button
                      type="button"
                      key={summary.site}
                      onClick={() =>
                        changeSite(
                          summary.site
                        )
                      }
                      className="rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-green-300 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-800">
                            <ClipboardCheck
                              size={24}
                            />
                          </div>

                          <h3 className="text-2xl font-bold text-gray-950">
                            {summary.site}
                          </h3>
                        </div>

                        <span className="text-2xl text-green-800">
                          →
                        </span>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div
                          className={`rounded-2xl p-4 ${
                            summary.open
                              ? "bg-blue-50"
                              : summary.current?.status ===
                                "Completed"
                              ? "bg-green-50"
                              : "bg-red-50"
                          }`}
                        >
                          <p className="text-sm text-gray-600">
                            Current Period
                          </p>

                          <p className="mt-1 text-xl font-bold text-gray-950">
                            {summary.open
                              ? "In Progress"
                              : summary.current?.status ===
                                "Completed"
                              ? "Complete"
                              : settings.stocktakeFrequency ===
                                "manual"
                              ? "Manual"
                              : "Not Started"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm text-gray-500">
                            Completed Total
                          </p>

                          <p className="mt-1 text-2xl font-bold text-gray-950">
                            {summary.completedCount}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            <>
              {openStocktake ? (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold text-gray-950">
                    Open Stocktake
                  </h2>

                  <div className="mt-5 max-w-xl">
                    <StocktakeCard
                      stocktake={
                        openStocktake
                      }
                      onOpen={() => {
                        setActiveStocktakeId(
                          openStocktake.id
                        );
                        setSelectedArea(null);
                      }}
                    />
                  </div>
                </div>
              ) : currentPeriodStocktake &&
                settings.stocktakeFrequency !==
                  "manual" ? (
                <div className="mt-8 rounded-3xl bg-green-50 p-8">
                  <div className="flex items-center gap-4">
                    <ClipboardCheck
                      size={34}
                      className="text-green-800"
                    />

                    <div>
                      <h2 className="text-2xl font-bold text-green-950">
                        Current stocktake complete
                      </h2>

                      <p className="mt-2 text-green-800">
                        {currentPeriodStocktake.periodLabel}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setResultsStocktakeId(
                        currentPeriodStocktake.id
                      )
                    }
                    className="mt-5 rounded-xl border border-green-800 px-5 py-3 font-semibold text-green-800 transition hover:bg-green-100"
                  >
                    View Results
                  </button>
                </div>
              ) : (
                <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center">
                  <ClipboardCheck
                    size={38}
                    className="mx-auto text-gray-400"
                  />

                  <h2 className="mt-4 text-2xl font-bold text-gray-950">
                    No open stocktake
                  </h2>

                  <p className="mt-2 text-gray-600">
                    {settings.stocktakeFrequency ===
                    "manual"
                      ? `Start a stocktake for ${selectedSite} when required.`
                      : `${currentPeriod.label} has not been started for ${selectedSite}.`}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setShowStartModal(
                        true
                      )
                    }
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-800 px-6 py-3 font-semibold text-white transition hover:bg-green-900"
                  >
                    <Plus size={19} />
                    New Stocktake
                  </button>
                </div>
              )}

              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-950">
                  Stocktake History
                </h2>

                {completedStocktakes.length ===
                0 ? (
                  <div className="mt-5 rounded-3xl bg-white p-10 text-center shadow-sm">
                    <p className="font-semibold text-gray-700">
                      No completed stocktakes yet.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {completedStocktakes.map(
                      (stocktake) => (
                        <StocktakeCard
                          key={
                            stocktake.id
                          }
                          stocktake={
                            stocktake
                          }
                          onOpen={() =>
                            setResultsStocktakeId(
                              stocktake.id
                            )
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {showStartModal &&
            selectedSite !==
              "All Sites" && (
              <StartStocktakeModal
                siteName={selectedSite}
                periodLabel={
                  currentPeriod.label
                }
                frequencyLabel={getReadableFrequency(
                  settings.stocktakeFrequency
                )}
                productCount={
                  productList.length
                }
                onClose={() => {
                  setShowStartModal(
                    false
                  );
                  setError("");
                }}
                onStart={handleStart}
                starting={starting}
                error={error}
              />
            )}
        </div>
      </main>
    </ProtectedPage>
  );
}
