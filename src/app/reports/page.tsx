"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import ReportFilters from "@/components/reports/ReportFilters";
import ReportsContent from "@/components/reports/ReportsContent";
import ReportsTabs from "@/components/reports/ReportsTabs";
import type { ReportFiltersState, ReportTab } from "@/components/reports/types";
import type { User } from "@/config/roles";

import { getCurrentUser } from "@/lib/currentUser";
import { getDefaultReportDates, REPORT_SITES } from "@/lib/reportUtils";
import { getProducts, subscribeToProductChanges } from "@/lib/productStore";
import { getInventoryMovements, getInventoryStock, subscribeToInventoryChanges } from "@/lib/inventoryStore";
import { getOrders, subscribeToOrderChanges } from "@/lib/orderStore";
import { getWasteRecords, subscribeToWasteChanges } from "@/lib/wasteStore";
import { getTransfers, subscribeToTransferChanges } from "@/lib/transferStore";
import { getStocktakes, subscribeToStocktakeChanges } from "@/lib/stocktakeStore";
import { getSuppliers, subscribeToSupplierChanges } from "@/lib/supplierStore";
import { getRecipes, subscribeToRecipeChanges } from "@/data/recipes";
import { getPrepItems, subscribeToPrepChanges } from "@/lib/prepStore";
import { subscribeToRecipeCostingChanges } from "@/lib/recipeCostingStore";

function initialFilters(user?: User | null): ReportFiltersState {
  const dates = getDefaultReportDates();
  return {
    ...dates,
    site: user && user.role !== "operations" ? user.site : "All Sites",
    supplier: "All Suppliers",
    category: "All Categories",
    search: "",
  };
}

export default function ReportsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ReportTab>("operations");
  const [filters, setFilters] = useState<ReportFiltersState>(initialFilters());
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  void version;

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
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
    setFilters(initialFilters(user));
    setLoading(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [router]);

  useEffect(() => {
    const unsubscribers = [
      subscribeToProductChanges(refresh),
      subscribeToInventoryChanges(refresh),
      subscribeToOrderChanges(refresh),
      subscribeToWasteChanges(refresh),
      subscribeToTransferChanges(refresh),
      subscribeToStocktakeChanges(refresh),
      subscribeToSupplierChanges(refresh),
      subscribeToRecipeChanges(refresh),
      subscribeToPrepChanges(refresh),
      subscribeToRecipeCostingChanges(refresh),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [refresh]);

  const products = getProducts();
  const suppliers = getSuppliers();
  const stock = getInventoryStock();
  const movements = getInventoryMovements();
  const orders = getOrders();
  const waste = getWasteRecords();
  const transfers = getTransfers();
  const stocktakes = getStocktakes();
  const recipes = getRecipes();
  const prepItems = getPrepItems();

  const siteOptions = useMemo(() => {
    if (currentUser?.role !== "operations") return [currentUser?.site ?? "All Sites"];
    return ["All Sites", ...REPORT_SITES.map((site) => site.name)];
  }, [currentUser]);

  const supplierOptions = useMemo(
    () => ["All Suppliers", ...Array.from(new Set(suppliers.map((supplier) => supplier.name))).sort()],
    [suppliers]
  );

  const categoryOptions = useMemo(
    () => ["All Categories", ...Array.from(new Set(products.map((product) => product.category))).sort()],
    [products]
  );

  function updateFilter<K extends keyof ReportFiltersState>(field: K, value: ReportFiltersState[K]): void {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function resetFilters(): void {
    setFilters(initialFilters(currentUser));
  }

  if (loading || !currentUser) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="font-semibold text-gray-600">Loading Reports...</p>
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-8 print:bg-white print:p-0">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-800 text-white print:hidden">
              <BarChart3 size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-950">Reports Centre</h1>
              <p className="mt-2 text-gray-600">Operational reporting across inventory, purchasing, waste, transfers, stocktakes, products and sites.</p>
            </div>
          </div>

          <ReportsTabs activeTab={tab} onChange={setTab} />
          <ReportFilters
            filters={filters}
            siteOptions={siteOptions}
            supplierOptions={supplierOptions}
            categoryOptions={categoryOptions}
            lockSite={currentUser.role !== "operations"}
            onChange={updateFilter}
            onReset={resetFilters}
          />

          <div className="mt-8">
            <ReportsContent
              tab={tab}
              filters={filters}
              products={products}
              stock={stock}
              movements={movements}
              orders={orders}
              waste={waste}
              transfers={transfers}
              stocktakes={stocktakes}
              recipes={recipes}
              prepItems={prepItems}
            />
          </div>
        </div>
      </main>
    </ProtectedPage>
  );
}
