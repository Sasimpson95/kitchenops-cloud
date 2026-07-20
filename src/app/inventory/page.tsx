"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  ClipboardCheck,
  History,
  Package,
  Search,
  SlidersHorizontal,
  Trash2,
  Truck,
  X,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import InventoryAreaSummaries from "@/components/inventory/InventoryAreaSummaries";
import InventoryCards from "@/components/inventory/InventoryCards";
import InventoryHistoryModal from "@/components/inventory/InventoryHistoryModal";
import InventoryQuickActions from "@/components/inventory/InventoryQuickActions";
import InventoryStats from "@/components/inventory/InventoryStats";
import type {
  InventoryAreaSummary,
  InventoryProductRecord,
} from "@/components/inventory/types";

import type { User } from "@/config/roles";
import type { Product } from "@/data/products";
import { getCurrentUser } from "@/lib/currentUser";
import { getActiveBusinessId } from "@/lib/businessWorkspace";
import { useBusinessSites } from "@/lib/useBusinessSites";
import {
  getInventoryMovements,
  getProductStock,
  subscribeToInventoryChanges,
  type InventoryMovement,
  type InventoryMovementType,
} from "@/lib/inventoryStore";
import {
  getInventoryStatus,
  getStockValue,
  getUnitCost,
  type InventoryStatus,
} from "@/lib/inventoryValuation";
import { getActiveProducts, subscribeToProductChanges } from "@/lib/productStore";



const STATUS_OPTIONS: Array<"All" | InventoryStatus> = [
  "All",
  "Healthy",
  "Low Stock",
  "Reorder",
  "Out of Stock",
  "Overstock",
];
const MOVEMENT_FILTERS: Array<"All" | InventoryMovementType> = [
  "All",
  "Delivery",
  "Production",
  "Waste",
  "Stocktake",
  "Adjustment",
  "Transfer Out",
  "Transfer In",
];

type SortOption =
  | "Name"
  | "Highest Value"
  | "Lowest Value"
  | "Lowest Stock"
  | "Highest Stock"
  | "Location";

const getSiteId = (site: string) => site.trim().toLowerCase().replace(/\s+/g, "-");
const number = (value: number) => new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value);
const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);

function isToday(value: string): boolean {
  const date = new Date(value);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function movementStyle(type: InventoryMovementType) {
  switch (type) {
    case "Delivery": return { label: "Delivery", className: "bg-violet-100 text-violet-800", icon: <Truck size={18} /> };
    case "Production": return { label: "Prep", className: "bg-blue-100 text-blue-800", icon: <Package size={18} /> };
    case "Waste": return { label: "Waste", className: "bg-red-100 text-red-800", icon: <Trash2 size={18} /> };
    case "Stocktake": return { label: "Stocktake", className: "bg-purple-100 text-purple-800", icon: <ClipboardCheck size={18} /> };
    case "Adjustment": return { label: "Adjustment", className: "bg-orange-100 text-orange-800", icon: <SlidersHorizontal size={18} /> };
    case "Transfer Out": return { label: "Transfer Out", className: "bg-amber-100 text-amber-800", icon: <ArrowUp size={18} /> };
    case "Transfer In": return { label: "Transfer In", className: "bg-cyan-100 text-cyan-800", icon: <ArrowDown size={18} /> };
  }
}


function endOfLocalDay(
  value: Date
): Date {
  const result = new Date(value);

  result.setHours(
    23,
    59,
    59,
    999
  );

  return result;
}

function getSevenDayTrend(
  currentStock: number,
  productMovements: InventoryMovement[]
): number[] {
  const today = new Date();

  return Array.from(
    { length: 7 },
    (_, index) => {
      const daysAgo = 6 - index;
      const day = new Date(today);

      day.setDate(
        today.getDate() - daysAgo
      );

      const dayEnd =
        endOfLocalDay(day);

      const movementsAfterDay =
        productMovements
          .filter(
            (movement) =>
              new Date(
                movement.createdAt
              ).getTime() >
              dayEnd.getTime()
          )
          .reduce(
            (total, movement) =>
              total +
              movement.quantity,
            0
          );

      return Math.max(
        0,
        currentStock -
          movementsAfterDay
      );
    }
  );
}

function buildRecords(
  products: Product[],
  siteId: string,
  movements: InventoryMovement[]
): InventoryProductRecord[] {
  return products.map((product) => {
    const stock = getProductStock(
      getActiveBusinessId(),
      siteId,
      product.id
    );

    const productMovements = movements
      .filter(
        (movement) =>
          movement.businessId ===
            getActiveBusinessId() &&
          movement.siteId === siteId &&
          movement.productId ===
            product.id
      )
      .sort(
        (first, second) =>
          new Date(
            second.createdAt
          ).getTime() -
          new Date(
            first.createdAt
          ).getTime()
      );

    const trendValues =
      getSevenDayTrend(
        stock,
        productMovements
      );

    const sevenDayChange =
      trendValues.length > 1
        ? trendValues[
            trendValues.length - 1
          ] - trendValues[0]
        : 0;

    return {
      product,
      stock,
      unitCost: getUnitCost(product),
      stockValue: getStockValue(
        product,
        stock
      ),
      status: getInventoryStatus(
        product,
        stock
      ),
      lastMovement:
        productMovements[0],
      movementCount:
        productMovements.length,

      trendValues,
      sevenDayChange,

      trendDirection:
        sevenDayChange > 0
          ? "up"
          : sevenDayChange < 0
            ? "down"
            : "flat",
    };
  });
}

export default function InventoryPage() {
  const router = useRouter();
  const { options: SITE_OPTIONS } = useBusinessSites();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [selectedSite, setSelectedSite] = useState("All Sites");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | InventoryStatus>("All");
  const [areaFilter, setAreaFilter] = useState("All Areas");
  const [sort, setSort] = useState<SortOption>("Name");
  const [movementFilter, setMovementFilter] = useState<"All" | InventoryMovementType>("All");
  const [showAllMovements, setShowAllMovements] = useState(false);
  const [historyRecord, setHistoryRecord] = useState<InventoryProductRecord | null>(null);

  const isOperations = currentUser?.role === "operations";
  const refreshProducts = useCallback(() => setProducts(getActiveProducts()), []);
  const refreshInventory = useCallback(() => setMovements(getInventoryMovements()), []);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    setCurrentUser(user);
    setSelectedSite(user.role === "operations" ? "All Sites" : user.site);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    refreshProducts();
    refreshInventory();
    const unsubscribeProducts = subscribeToProductChanges(refreshProducts);
    const unsubscribeInventory = subscribeToInventoryChanges(refreshInventory);
    return () => {
      unsubscribeProducts();
      unsubscribeInventory();
    };
  }, [refreshProducts, refreshInventory]);

  const selectedSiteId = selectedSite === "All Sites" ? null : getSiteId(selectedSite);

  const siteRecords = useMemo(
    () => (selectedSiteId ? buildRecords(products, selectedSiteId, movements) : []),
    [products, selectedSiteId, movements]
  );

  const areas = useMemo(
    () => ["All Areas", ...Array.from(new Set(products.map((product) => product.location))).sort()],
    [products]
  );

  const areaSummaries =
    useMemo<InventoryAreaSummary[]>(
      () =>
        Array.from(
          new Set(
            siteRecords.map(
              (record) =>
                record.product.location ||
                "Not assigned"
            )
          )
        )
          .sort()
          .map((area) => {
            const records =
              siteRecords.filter(
                (record) =>
                  (record.product.location ||
                    "Not assigned") ===
                  area
              );

            return {
              area,

              productCount:
                records.length,

              inventoryValue:
                records.reduce(
                  (total, record) =>
                    total +
                    record.stockValue,
                  0
                ),

              lowStockCount:
                records.filter(
                  (record) =>
                    record.status ===
                      "Low Stock" ||
                    record.status ===
                      "Reorder"
                ).length,

              outOfStockCount:
                records.filter(
                  (record) =>
                    record.status ===
                    "Out of Stock"
                ).length,
            };
          }),
      [siteRecords]
    );

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = siteRecords.filter((record) => {
      const { product, status } = record;
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.supplierName.toLowerCase().includes(term) ||
        product.supplierCode.toLowerCase().includes(term) ||
        product.location.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const matchesArea = areaFilter === "All Areas" || product.location === areaFilter;
      return matchesSearch && matchesStatus && matchesArea;
    });

    return [...result].sort((a, b) => {
      switch (sort) {
        case "Highest Value": return b.stockValue - a.stockValue;
        case "Lowest Value": return a.stockValue - b.stockValue;
        case "Lowest Stock": return a.stock - b.stock;
        case "Highest Stock": return b.stock - a.stock;
        case "Location": return a.product.location.localeCompare(b.product.location) || a.product.name.localeCompare(b.product.name);
        default: return a.product.name.localeCompare(b.product.name);
      }
    });
  }, [siteRecords, search, statusFilter, areaFilter, sort]);

  const stats = useMemo(() => ({
    inventoryValue: siteRecords.reduce((total, record) => total + record.stockValue, 0),
    trackedProducts: siteRecords.length,
    lowStock: siteRecords.filter((record) => record.status === "Low Stock" || record.status === "Reorder").length,
    outOfStock: siteRecords.filter((record) => record.status === "Out of Stock").length,
    overstock: siteRecords.filter((record) => record.status === "Overstock").length,
  }), [siteRecords]);

  const siteMovements = useMemo(() => {
    if (!selectedSiteId) return [];
    return movements
      .filter((movement) => movement.businessId === getActiveBusinessId() && movement.siteId === selectedSiteId)
      .filter((movement) => movementFilter === "All" || movement.movementType === movementFilter)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [movements, selectedSiteId, movementFilter]);

  const siteSummaries = useMemo(() =>
    SITE_OPTIONS.filter((site) => site !== "All Sites").map((site) => {
      const records = buildRecords(products, getSiteId(site), movements);
      return {
        site,
        inventoryValue: records.reduce((total, record) => total + record.stockValue, 0),
        trackedProducts: records.length,
        lowStock: records.filter((record) => record.status === "Low Stock" || record.status === "Reorder").length,
        outOfStock: records.filter((record) => record.status === "Out of Stock").length,
        overstock: records.filter((record) => record.status === "Overstock").length,
        movementsToday: movements.filter((movement) => movement.siteId === getSiteId(site) && isToday(movement.createdAt)).length,
      };
    }), [products, movements]);

  function changeSite(site: string) {
    if (!isOperations) return;
    setSelectedSite(site);
    setSearch("");
    setStatusFilter("All");
    setAreaFilter("All Areas");
    setMovementFilter("All");
    setShowAllMovements(false);
  }

  if (loading || !currentUser) {
    return <ProtectedPage><main className="flex min-h-screen items-center justify-center bg-slate-100"><p className="font-semibold text-gray-600">Loading Inventory...</p></main></ProtectedPage>;
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold text-gray-950">Inventory</h1>
          <p className="mt-2 text-gray-600">Live stock levels, values and movement history.</p>

          <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
            <label className="text-sm font-semibold text-gray-600">Viewing Site</label>
            {isOperations ? (
              <select value={selectedSite} onChange={(event) => changeSite(event.target.value)} className="mt-2 block w-full max-w-sm rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-violet-800">
                {SITE_OPTIONS.map((site) => <option key={site}>{site}</option>)}
              </select>
            ) : (
              <div className="mt-2 flex max-w-sm items-center gap-3 rounded-xl border border-gray-200 bg-slate-50 px-4 py-3">
                <Building2 size={20} className="text-violet-800" />
                <span className="font-semibold">{selectedSite}</span>
                <span className="ml-auto text-xs font-semibold text-gray-500">Assigned site</span>
              </div>
            )}
          </div>

          {selectedSite === "All Sites" ? (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-950">All Sites Overview</h2>
              <p className="mt-2 text-gray-600">Select a site to inspect its stock and activity.</p>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {siteSummaries.map((summary) => (
                  <button key={summary.site} type="button" onClick={() => changeSite(summary.site)} className="rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-green-300 hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-800"><Building2 size={24} /></div><h3 className="text-2xl font-bold">{summary.site}</h3></div>
                      <span className="text-2xl text-violet-800">→</span>
                    </div>
                    <div className="mt-6 rounded-2xl bg-emerald-50 p-4"><p className="text-sm text-emerald-700">Inventory Value</p><p className="mt-1 text-3xl font-bold text-emerald-950">{money(summary.inventoryValue)}</p></div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 p-4"><p className="text-gray-500">Products</p><p className="mt-1 text-xl font-bold">{summary.trackedProducts}</p></div>
                      <div className="rounded-2xl bg-orange-50 p-4"><p className="text-orange-700">Low / Reorder</p><p className="mt-1 text-xl font-bold text-orange-950">{summary.lowStock}</p></div>
                      <div className="rounded-2xl bg-red-50 p-4"><p className="text-red-700">Out</p><p className="mt-1 text-xl font-bold text-red-950">{summary.outOfStock}</p></div>
                      <div className="rounded-2xl bg-blue-50 p-4"><p className="text-blue-700">Overstock</p><p className="mt-1 text-xl font-bold text-blue-950">{summary.overstock}</p></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <InventoryStats
                {...stats}
                onFilterStatus={(status) => {
                  setStatusFilter(status);
                  setSearch("");
                  setAreaFilter("All Areas");
                }}
              />

              <InventoryQuickActions
                selectedSite={selectedSite}
              />

              <InventoryAreaSummaries
                summaries={areaSummaries}
                selectedArea={areaFilter}
                onSelectArea={(area) => {
                  setAreaFilter(area);
                  setSearch("");
                }}
              />

              <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div><h2 className="text-2xl font-bold">{selectedSite} Stock</h2><p className="mt-1 text-gray-500">Search, filter and sort live inventory.</p></div>
                  <div className="relative w-full lg:w-96">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, supplier, code or area..." className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-11 outline-none focus:border-violet-800" />
                    {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 hover:bg-slate-100"><X size={17} /></button>}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | InventoryStatus)} className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-violet-800">
                    {STATUS_OPTIONS.map((status) => <option key={status}>{status === "All" ? "All statuses" : status}</option>)}
                  </select>
                  <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-violet-800">
                    {areas.map((area) => <option key={area}>{area}</option>)}
                  </select>
                  <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-violet-800">
                    {(["Name", "Highest Value", "Lowest Value", "Lowest Stock", "Highest Stock", "Location"] as SortOption[]).map((option) => <option key={option}>{option}</option>)}
                  </select>
                </div>

                <p className="mt-4 text-sm text-gray-500">Showing {filteredRecords.length} of {siteRecords.length} products</p>
                <InventoryCards
                  records={filteredRecords}
                  onViewHistory={
                    setHistoryRecord
                  }
                />
              </section>

              <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="flex items-center gap-3"><History size={24} className="text-violet-800" /><div><h2 className="text-2xl font-bold">Recent Activity</h2><p className="mt-1 text-gray-500">Every delivery, prep, waste, transfer and stocktake movement.</p></div></div>
                  <select value={movementFilter} onChange={(event) => setMovementFilter(event.target.value as "All" | InventoryMovementType)} className="rounded-xl border border-gray-300 px-4 py-3 font-semibold outline-none focus:border-violet-800">
                    {MOVEMENT_FILTERS.map((filter) => <option key={filter} value={filter}>{filter === "Production" ? "Prep" : filter}</option>)}
                  </select>
                </div>

                {siteMovements.length === 0 ? (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-10 text-center text-gray-500">No movements recorded.</div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {(showAllMovements ? siteMovements : siteMovements.slice(0, 8)).map((movement) => {
                      const style = movementStyle(movement.movementType);
                      const product = products.find((item) => item.id === movement.productId);
                      return (
                        <div key={movement.id} className="grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${style.className}`}>{style.icon}</div>
                          <div><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{movement.productName}</p><span className={`rounded-full px-3 py-1 text-xs font-semibold ${style.className}`}>{style.label}</span></div><p className="mt-1 text-sm text-gray-500">{movement.referenceNumber}</p><p className="mt-1 text-xs text-gray-400">{formatDateTime(movement.createdAt)}</p></div>
                          <p className={`text-xl font-bold ${movement.quantity >= 0 ? "text-violet-800" : "text-red-700"}`}>{movement.quantity >= 0 ? "+" : ""}{number(movement.quantity)} {product?.inventoryUnit ?? ""}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
                {siteMovements.length > 8 && <button type="button" onClick={() => setShowAllMovements((current) => !current)} className="mt-6 w-full rounded-xl border border-violet-800 px-5 py-3 font-semibold text-violet-800 hover:bg-violet-50">{showAllMovements ? "Show Recent Only" : `View All ${siteMovements.length} Movements`}</button>}
              </section>
            </>
          )}
        </div>

        {historyRecord && selectedSiteId && (
          <InventoryHistoryModal
            record={historyRecord}
            movements={movements.filter(
              (movement) =>
                movement.businessId ===
                  getActiveBusinessId() &&
                movement.siteId ===
                  selectedSiteId
            )}
            onClose={() =>
              setHistoryRecord(null)
            }
          />
        )}
      </main>
    </ProtectedPage>
  );
}
