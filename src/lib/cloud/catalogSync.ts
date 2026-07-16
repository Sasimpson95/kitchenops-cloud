const PRODUCT_KEY = "kitchenops-products";
const SUPPLIER_KEY = "kitchenops-suppliers";
const STORAGE_KEY = "kitchenops-storage-areas";
const STOCK_KEY = "kitchenops-inventory-stock";
const MOVEMENT_KEY = "kitchenops-inventory-movements";

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
  EVENTS.forEach((name) => window.dispatchEvent(new CustomEvent(name)));
}

export async function hydrateCloudCatalog(): Promise<void> {
  if (typeof window === "undefined") return;
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    const response = await fetch("/api/cloud/catalog", { cache: "no-store" });
    if (!response.ok) return;

    const data = (await response.json()) as {
      suppliers?: unknown[];
      products?: unknown[];
      storageAreas?: unknown[];
      inventoryStock?: unknown[];
      inventoryMovements?: unknown[];
    };

    const cloudIsEmpty =
      (data.suppliers?.length ?? 0) === 0 &&
      (data.products?.length ?? 0) === 0 &&
      (data.storageAreas?.length ?? 0) === 0 &&
      (data.inventoryStock?.length ?? 0) === 0 &&
      (data.inventoryMovements?.length ?? 0) === 0;

    const localPayload = {
      suppliers: readArray(SUPPLIER_KEY),
      products: readArray(PRODUCT_KEY),
      storageAreas: readArray(STORAGE_KEY),
      inventoryStock: readArray(STOCK_KEY),
      inventoryMovements: readArray(MOVEMENT_KEY),
    };

    const localHasData = Object.values(localPayload).some(
      (records) => records.length > 0
    );

    // On the first cloud run, preserve the current working browser data and
    // make it the initial catalogue for this business. New devices then load it.
    if (cloudIsEmpty && localHasData) {
      const upload = await fetch("/api/cloud/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localPayload),
      });

      if (!upload.ok) {
        throw new Error("KitchenOps could not create the initial cloud catalogue.");
      }
    } else {
      window.localStorage.setItem(SUPPLIER_KEY, JSON.stringify(data.suppliers ?? []));
      window.localStorage.setItem(PRODUCT_KEY, JSON.stringify(data.products ?? []));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.storageAreas ?? []));
      window.localStorage.setItem(STOCK_KEY, JSON.stringify(data.inventoryStock ?? []));
      window.localStorage.setItem(MOVEMENT_KEY, JSON.stringify(data.inventoryMovements ?? []));
    }

    window.localStorage.setItem("kitchenops-cloud-catalog-hydrated", "true");
    emitAll();
  })().finally(() => {
    hydrationPromise = null;
  });

  return hydrationPromise;
}

export function scheduleCloudCatalogSave(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem("kitchenops-cloud-catalog-hydrated") !== "true") return;

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
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "KitchenOps could not upload the local catalogue.");
  }

  window.localStorage.setItem("kitchenops-cloud-catalog-hydrated", "true");
}
