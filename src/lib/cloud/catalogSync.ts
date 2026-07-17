import { getCloudSession } from "@/lib/cloudSession";

const PRODUCT_KEY = "kitchenops-products";
const SUPPLIER_KEY = "kitchenops-suppliers";
const STORAGE_KEY = "kitchenops-storage-areas";
const STOCK_KEY = "kitchenops-inventory-stock";
const MOVEMENT_KEY = "kitchenops-inventory-movements";
const ACTIVE_BUSINESS_KEY = "kitchenops-active-catalog-business";
const HYDRATED_KEY = "kitchenops-cloud-catalog-hydrated";

const CATALOG_KEYS = [
  SUPPLIER_KEY,
  PRODUCT_KEY,
  STORAGE_KEY,
  STOCK_KEY,
  MOVEMENT_KEY,
] as const;

const EVENTS = [
  "kitchenops-products-changed",
  "kitchenops-suppliers-changed",
  "kitchenops-storage-areas-changed",
  "kitchenops-inventory-changed",
];

let hydrationPromise: Promise<void> | null = null;
let saveTimer: number | null = null;

function readArray(key: string): unknown[] {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(key);
  if (!saved) return [];

  try {
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function emitAll(): void {
  EVENTS.forEach((name) =>
    window.dispatchEvent(new CustomEvent(name))
  );
}

function clearLocalCatalog(): void {
  CATALOG_KEYS.forEach((key) =>
    window.localStorage.removeItem(key)
  );
  window.localStorage.removeItem(HYDRATED_KEY);
}

export async function hydrateCloudCatalog(): Promise<void> {
  if (typeof window === "undefined") return;
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    const session = await getCloudSession();
    const businessId = session.business?.id;

    if (!businessId) return;

    const previousBusinessId =
      window.localStorage.getItem(ACTIVE_BUSINESS_KEY);

    // Data in these browser keys used to be shared by every business.
    // Clear it whenever the signed-in business changes so one customer can
    // never inherit another customer's products, suppliers or stock.
    if (previousBusinessId !== businessId) {
      clearLocalCatalog();
      window.localStorage.setItem(ACTIVE_BUSINESS_KEY, businessId);
    }

    const response = await fetch("/api/cloud/catalog", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("KitchenOps could not load this business catalogue.");
    }

    const data = (await response.json()) as {
      suppliers?: unknown[];
      products?: unknown[];
      storageAreas?: unknown[];
      inventoryStock?: unknown[];
      inventoryMovements?: unknown[];
    };

    // The cloud is always the source of truth. An empty cloud catalogue must
    // remain empty; never copy old browser/demo data into a new business.
    window.localStorage.setItem(
      SUPPLIER_KEY,
      JSON.stringify(data.suppliers ?? [])
    );
    window.localStorage.setItem(
      PRODUCT_KEY,
      JSON.stringify(data.products ?? [])
    );
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data.storageAreas ?? [])
    );
    window.localStorage.setItem(
      STOCK_KEY,
      JSON.stringify(data.inventoryStock ?? [])
    );
    window.localStorage.setItem(
      MOVEMENT_KEY,
      JSON.stringify(data.inventoryMovements ?? [])
    );

    window.localStorage.setItem(HYDRATED_KEY, businessId);
    emitAll();
  })().finally(() => {
    hydrationPromise = null;
  });

  return hydrationPromise;
}

export function scheduleCloudCatalogSave(): void {
  if (typeof window === "undefined") return;

  const businessId =
    window.localStorage.getItem(ACTIVE_BUSINESS_KEY);
  const hydratedBusinessId =
    window.localStorage.getItem(HYDRATED_KEY);

  if (!businessId || hydratedBusinessId !== businessId) return;

  if (saveTimer) window.clearTimeout(saveTimer);

  saveTimer = window.setTimeout(() => {
    void fetch("/api/cloud/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        suppliers: readArray(SUPPLIER_KEY),
        products: readArray(PRODUCT_KEY),
        storageAreas: readArray(STORAGE_KEY),
        inventoryStock: readArray(STOCK_KEY),
        inventoryMovements: readArray(MOVEMENT_KEY),
      }),
    });
  }, 500);
}

export async function uploadCurrentLocalCatalog(): Promise<void> {
  if (typeof window === "undefined") return;

  const session = await getCloudSession();
  const businessId = session.business?.id;

  if (!businessId) {
    throw new Error("No KitchenOps business is selected.");
  }

  const response = await fetch("/api/cloud/catalog", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      suppliers: readArray(SUPPLIER_KEY),
      products: readArray(PRODUCT_KEY),
      storageAreas: readArray(STORAGE_KEY),
      inventoryStock: readArray(STOCK_KEY),
      inventoryMovements: readArray(MOVEMENT_KEY),
    }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      data.error ?? "KitchenOps could not upload the local catalogue."
    );
  }

  window.localStorage.setItem(ACTIVE_BUSINESS_KEY, businessId);
  window.localStorage.setItem(HYDRATED_KEY, businessId);
}
