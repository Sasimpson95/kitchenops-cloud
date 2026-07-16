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
  CalendarDays,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import WasteComplianceCalendar from "@/components/waste/WasteComplianceCalendar";
import WasteHistory from "@/components/waste/WasteHistory";
import WasteModal from "@/components/waste/WasteModal";

import type { User } from "@/config/roles";
import type { Product } from "@/data/products";

import { getCurrentUser } from "@/lib/currentUser";
import {
  getActiveProducts,
  subscribeToProductChanges,
} from "@/lib/productStore";
import {
  getWasteRecords,
  subscribeToWasteChanges,
  type WasteReason,
  type WasteRecord,
} from "@/lib/wasteStore";

const SITE_OPTIONS = [
  "All Sites",
  "Beeston",
  "City",
  "Sherwood",
  "Bakery",
];

const SITE_NAMES = SITE_OPTIONS.filter((site) => site !== "All Sites");

const REASON_OPTIONS: Array<"All" | WasteReason> = [
  "All",
  "Burnt",
  "Damaged",
  "Over Production",
  "Customer Return",
  "Expired",
  "Quality Issue",
  "Other",
];

function toDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getWeekStart(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);
  result.setHours(0, 0, 0, 0);

  return result;
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);

  end.setDate(start.getDate() + 6);

  return end;
}

function isToday(value: string): boolean {
  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isSameDate(value: string, dateKey: string): boolean {
  return toDateKey(new Date(value)) === dateKey;
}

export default function WastePage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [productList, setProductList] = useState<Product[]>([]);
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);

  const [selectedSite, setSelectedSite] = useState("All Sites");
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState<"All" | WasteReason>("All");
  const [selectedRecordDate, setSelectedRecordDate] = useState("");
  const [showModal, setShowModal] = useState(false);

  const initialWeekStart = getWeekStart(new Date());
  const initialWeekEnd = getWeekEnd(new Date());

  const [complianceStartDate, setComplianceStartDate] = useState(
    toDateKey(initialWeekStart)
  );
  const [complianceEndDate, setComplianceEndDate] = useState(
    toDateKey(initialWeekEnd)
  );

  const isOperations = currentUser?.role === "operations";

  const refreshProducts = useCallback(() => {
    setProductList(getActiveProducts());
  }, []);

  const refreshWaste = useCallback(() => {
    setWasteRecords(getWasteRecords());
  }, []);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setCurrentUser(user);
    setSelectedSite(user.role === "operations" ? "All Sites" : user.site);
    setLoadingUser(false);
  }, [router]);

  useEffect(() => {
    refreshProducts();
    refreshWaste();

    const unsubscribeProducts = subscribeToProductChanges(refreshProducts);
    const unsubscribeWaste = subscribeToWasteChanges(refreshWaste);

    return () => {
      unsubscribeProducts();
      unsubscribeWaste();
    };
  }, [refreshProducts, refreshWaste]);

  const visibleRecords = useMemo(() => {
    const normalisedSearch = search.trim().toLowerCase();

    return wasteRecords.filter((record) => {
      const matchesSite =
        selectedSite === "All Sites" || record.siteName === selectedSite;

      const matchesReason =
        reasonFilter === "All" || record.reason === reasonFilter;

      const matchesDate =
        !selectedRecordDate || isSameDate(record.createdAt, selectedRecordDate);

      const matchesSearch =
        !normalisedSearch ||
        record.productName.toLowerCase().includes(normalisedSearch) ||
        record.wasteNumber.toLowerCase().includes(normalisedSearch) ||
        record.recordedBy.toLowerCase().includes(normalisedSearch) ||
        record.notes.toLowerCase().includes(normalisedSearch);

      return matchesSite && matchesReason && matchesDate && matchesSearch;
    });
  }, [
    wasteRecords,
    selectedSite,
    reasonFilter,
    selectedRecordDate,
    search,
  ]);

  const todayRecords = visibleRecords.filter((record) =>
    isToday(record.createdAt)
  );

  const todayQuantity = todayRecords.reduce(
    (total, record) => total + record.quantity,
    0
  );

  const siteSummary = useMemo(() => {
    return SITE_NAMES.map((site) => {
      const records = wasteRecords.filter((record) => record.siteName === site);
      const today = records.filter((record) => isToday(record.createdAt));

      return {
        site,
        todayRecords: today.length,
        totalRecords: records.length,
        todayQuantity: today.reduce(
          (total, record) => total + record.quantity,
          0
        ),
      };
    });
  }, [wasteRecords]);

  function changeSite(site: string): void {
    if (!isOperations) return;

    setSelectedSite(site);
    setSearch("");
    setReasonFilter("All");
    setSelectedRecordDate("");
  }

  function openSiteDate(site: string, date: string): void {
    if (!isOperations) return;

    setSelectedSite(site);
    setSelectedRecordDate(date);
    setSearch("");
    setReasonFilter("All");
  }

  function clearSelectedDate(): void {
    setSelectedRecordDate("");
  }

  if (loadingUser || !currentUser) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="font-semibold text-gray-600">Loading Waste...</p>
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-950">Waste</h1>

              <p className="mt-2 text-gray-600">
                Record discarded stock and keep inventory accurate.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              disabled={selectedSite === "All Sites" && isOperations}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
            >
              <Plus size={20} />
              New Waste Record
            </button>
          </div>

          <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
            <label className="text-sm font-semibold text-gray-600">
              Viewing Site
            </label>

            {isOperations ? (
              <select
                value={selectedSite}
                onChange={(event) => changeSite(event.target.value)}
                className="mt-2 block w-full max-w-sm rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-900 outline-none focus:border-violet-800"
              >
                {SITE_OPTIONS.map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-2 flex max-w-sm items-center gap-3 rounded-xl border border-gray-200 bg-slate-50 px-4 py-3">
                <Building2 size={20} className="text-violet-800" />

                <span className="font-semibold text-gray-900">
                  {selectedSite}
                </span>

                <span className="ml-auto text-xs font-semibold text-gray-500">
                  Assigned site
                </span>
              </div>
            )}

            {selectedSite === "All Sites" && (
              <p className="mt-4 text-sm text-blue-800">
                Select a site before creating a waste record. All Sites is an
                overview only.
              </p>
            )}
          </div>

          {selectedSite === "All Sites" ? (
            <div className="mt-8 space-y-8">
              {isOperations && (
                <WasteComplianceCalendar
                  records={wasteRecords}
                  sites={SITE_NAMES}
                  startDate={complianceStartDate}
                  endDate={complianceEndDate}
                  onStartDateChange={setComplianceStartDate}
                  onEndDateChange={setComplianceEndDate}
                  onSelectSiteDate={openSiteDate}
                />
              )}

              <div>
                <h2 className="text-2xl font-bold text-gray-950">
                  All Sites Waste Overview
                </h2>

                <p className="mt-2 text-gray-600">
                  Select a site to record waste or inspect its full history.
                </p>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {siteSummary.map((summary) => (
                    <button
                      type="button"
                      key={summary.site}
                      onClick={() => changeSite(summary.site)}
                      className="rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-red-300 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                            <Trash2 size={24} />
                          </div>

                          <h3 className="text-2xl font-bold text-gray-950">
                            {summary.site}
                          </h3>
                        </div>

                        <span className="text-2xl text-red-700">→</span>
                      </div>

                      <div className="mt-6 grid grid-cols-3 gap-3">
                        <div className="rounded-2xl bg-red-50 p-4">
                          <p className="text-sm text-red-700">Today</p>

                          <p className="mt-1 text-2xl font-bold text-red-900">
                            {summary.todayRecords}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm text-gray-500">Qty Today</p>

                          <p className="mt-1 text-2xl font-bold text-gray-950">
                            {summary.todayQuantity}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm text-gray-500">All Records</p>

                          <p className="mt-1 text-2xl font-bold text-gray-950">
                            {summary.totalRecords}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-red-50 p-5 shadow-sm">
                  <p className="text-sm text-red-700">Waste Records Today</p>

                  <p className="mt-1 text-3xl font-bold text-red-900">
                    {todayRecords.length}
                  </p>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Quantity Today</p>

                  <p className="mt-1 text-3xl font-bold text-gray-950">
                    {todayQuantity}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Across mixed inventory units
                  </p>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">
                    {selectedRecordDate ? "Records on Selected Date" : "Total Records"}
                  </p>

                  <p className="mt-1 text-3xl font-bold text-gray-950">
                    {visibleRecords.length}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="flex items-center gap-3">
                    <CalendarDays size={24} className="text-red-700" />

                    <div>
                      <h2 className="text-2xl font-bold text-gray-950">
                        {selectedSite} Waste History
                      </h2>

                      <p className="mt-1 text-gray-500">
                        Search by product, reference, user or note.
                      </p>
                    </div>
                  </div>

                  {selectedRecordDate && (
                    <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-blue-800">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide">
                          Date Filter
                        </p>

                        <p className="font-bold">
                          {new Intl.DateTimeFormat("en-GB", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          }).format(parseDateKey(selectedRecordDate))}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={clearSelectedDate}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-800 transition hover:bg-blue-100"
                        aria-label="Clear selected date"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_260px]">
                  <div className="relative">
                    <Search
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search waste history..."
                      className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-11 outline-none focus:border-red-600"
                    />

                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 hover:bg-slate-100"
                        aria-label="Clear search"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  <select
                    value={reasonFilter}
                    onChange={(event) =>
                      setReasonFilter(event.target.value as "All" | WasteReason)
                    }
                    className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-red-600"
                  >
                    {REASON_OPTIONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason === "All" ? "All reasons" : reason}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <WasteHistory records={visibleRecords} />
              </div>
            </>
          )}
        </div>

        {showModal && selectedSite !== "All Sites" && (
          <WasteModal
            currentUser={currentUser}
            products={productList}
            initialSite={selectedSite}
            onClose={() => setShowModal(false)}
            onSaved={refreshWaste}
          />
        )}
      </main>
    </ProtectedPage>
  );
}
