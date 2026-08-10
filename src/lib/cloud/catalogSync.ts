import { getCloudSession } from "@/lib/cloudSession";
import { getActiveBusinessId } from "@/lib/businessWorkspace";

const PRODUCT_KEY = "kitchenops-products";
const SUPPLIER_KEY = "kitchenops-suppliers";
const STORAGE_KEY = "kitchenops-storage-areas";
const RECIPE_KEY = "kitchenops-recipes";
const PRODUCT_LOCATION_KEY = "kitchenops-product-location-assignments";
const STOCK_KEY = "kitchenops-inventory-stock";
const MOVEMENT_KEY = "kitchenops-inventory-movements";
const ACTIVE_BUSINESS_KEY = "kitchenops-active-catalog-business";
const HYDRATED_KEY = "kitchenops-cloud-catalog-hydrated";
const RC2_SHARED_CATALOG_MIGRATION_PREFIX = "kitchenops-rc2-shared-catalog-migrated";
const PENDING_CATALOG_KEY = "kitchenops-pending-catalog-changes";
const CATALOG_RETRY_MS = 12_000;

const CATALOG_KEYS = [
  SUPPLIER_KEY,
  PRODUCT_KEY,
  STORAGE_KEY,
  RECIPE_KEY,
  PRODUCT_LOCATION_KEY,
  STOCK_KEY,
  MOVEMENT_KEY,
] as const;

const EVENTS = [
  "kitchenops-products-changed",
  "kitchenops-suppliers-changed",
  "kitchenops-storage-areas-changed",
  "kitchenops-recipes-changed",
  "kitchenops-product-locations-changed",
  "kitchenops-inventory-changed",
];

let hydrationPromise: Promise<void> | null = null;
let flushPromise: Promise<void> | null = null;

type PendingCatalogChange = {
  id: string;
  businessId: string;
  method: "PUT" | "DELETE";
  body: Record<string, unknown>;
  createdAt: string;
};

function makeChangeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readPendingCatalogChanges(): PendingCatalogChange[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PENDING_CATALOG_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingCatalogChange[]) : [];
  } catch {
    return [];
  }
}

function writePendingCatalogChanges(changes: PendingCatalogChange[]): void {
  if (typeof window === "undefined") return;
  if (changes.length === 0) {
    window.localStorage.removeItem(PENDING_CATALOG_KEY);
    return;
  }
  window.localStorage.setItem(PENDING_CATALOG_KEY, JSON.stringify(changes));
}

function enqueueCatalogChange(
  method: PendingCatalogChange["method"],
  body: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  const businessId = getActiveBusinessId();
  if (!businessId) return;

  const queue = readPendingCatalogChanges();
  queue.push({
    id: makeChangeId(),
    businessId,
    method,
    body,
    createdAt: new Date().toISOString(),
  });
  writePendingCatalogChanges(queue);
}

async function sendCatalogChange(change: PendingCatalogChange): Promise<void> {
  const response = await fetch("/api/cloud/catalog", {
    method: change.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(change.body),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(result.error ?? "Catalogue change could not be saved.");
  }
}

/**
 * Flushes catalogue edits in creation order. The queue is business-scoped and
 * remains on-device until the server acknowledges each change, so a temporary
 * network failure cannot silently discard a product/recipe/location edit.
 */
export async function flushPendingCatalogChanges(): Promise<void> {
  if (typeof window === "undefined") return;
  if (flushPromise) return flushPromise;

  flushPromise = (async () => {
    const businessId = getActiveBusinessId();
    if (!businessId) return;

    let queue = readPendingCatalogChanges();
    const pendingForBusiness = queue.filter((change) => change.businessId === businessId);

    for (const change of pendingForBusiness) {
      try {
        await sendCatalogChange(change);
      } catch (error) {
        // Preserve this change and every later change in order. A later retry
        // (online/visibility/timer or next app launch) will continue safely.
        console.error("Catalogue sync deferred:", error);
        break;
      }

      queue = queue.filter((queued) => queued.id !== change.id);
      writePendingCatalogChanges(queue);
    }
  })().finally(() => {
    flushPromise = null;
  });

  return flushPromise;
}

export function startCatalogSyncRetry(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const retry = () => {
    void flushPendingCatalogChanges();
  };
  const onVisibility = () => {
    if (document.visibilityState === "visible") retry();
  };

  window.addEventListener("online", retry);
  document.addEventListener("visibilitychange", onVisibility);
  const timer = window.setInterval(retry, CATALOG_RETRY_MS);

  return () => {
    window.removeEventListener("online", retry);
    document.removeEventListener("visibilitychange", onVisibility);
    window.clearInterval(timer);
  };
}

function mergeUniqueByKey(
  cloud: unknown[],
  local: unknown[],
  keyFor: (record: unknown) => string
): unknown[] {
  const merged = new Map<string, unknown>();
  for (const record of cloud) {
    const key = keyFor(record);
    if (key) merged.set(key, record);
  }
  for (const record of local) {
    const key = keyFor(record);
    if (key && !merged.has(key)) merged.set(key, record);
  }
  return Array.from(merged.values());
}

function objectStringField(record: unknown, field: string): string {
  if (typeof record !== "object" || record === null) return "";
  return String((record as Record<string, unknown>)[field] ?? "").trim();
}

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

    // ProtectedPage restores the business-scoped browser cache before this
    // function runs. Capture legacy local-only recipe/location data from that
    // workspace for the one-time RC2 migration.
    const localRecipesBeforeHydration = readArray(RECIPE_KEY);
    const localLocationsBeforeHydration = readArray(PRODUCT_LOCATION_KEY);

    const previousBusinessId =
      window.localStorage.getItem(ACTIVE_BUSINESS_KEY);

    // BusinessWorkspace now owns cache isolation. Keep this marker for
    // backwards compatibility, but do not clear the already-restored workspace.
    if (previousBusinessId !== businessId) {
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
      recipes?: unknown[];
      productLocations?: unknown[];
      inventoryStock?: unknown[];
      inventoryMovements?: unknown[];
    };

    let sharedRecipes = data.recipes ?? [];
    let sharedProductLocations = data.productLocations ?? [];
    const rc2MigrationKey = `${RC2_SHARED_CATALOG_MIGRATION_PREFIX}::${businessId}`;
    const shouldMigrateSharedCatalog =
      session.user?.role === "operations" &&
      window.localStorage.getItem(rc2MigrationKey) !== "yes";

    if (shouldMigrateSharedCatalog) {
      // Cloud wins on collisions; legacy local-only records are added once.
      sharedRecipes = mergeUniqueByKey(
        sharedRecipes,
        localRecipesBeforeHydration,
        (record) => objectStringField(record, "name").toLowerCase()
      );
      sharedProductLocations = mergeUniqueByKey(
        sharedProductLocations,
        localLocationsBeforeHydration,
        (record) => objectStringField(record, "id")
      );

      const migrationResponse = await fetch("/api/cloud/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipes: sharedRecipes,
          productLocations: sharedProductLocations,
        }),
      });

      if (!migrationResponse.ok) {
        const result = (await migrationResponse.json().catch(() => ({}))) as { error?: string };
        throw new Error(result.error ?? "KitchenOps could not migrate shared recipe data.");
      }

      window.localStorage.setItem(rc2MigrationKey, "yes");
    }

    // The cloud is always the source of truth after the one-time RC2 migration. An empty cloud catalogue must
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
      RECIPE_KEY,
      JSON.stringify(sharedRecipes)
    );
    window.localStorage.setItem(
      PRODUCT_LOCATION_KEY,
      JSON.stringify(sharedProductLocations)
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

export async function deleteCloudCatalogRecords(
  type: "product" | "supplier" | "storageArea" | "recipe" | "productLocation",
  ids: Array<string | number>
): Promise<void> {
  const cleanedIds = ids.map(String).map((id) => id.trim()).filter(Boolean);
  if (cleanedIds.length === 0) return;

  enqueueCatalogChange("DELETE", { type, ids: cleanedIds });
  await flushPendingCatalogChanges();
}

type CatalogCollection = "products" | "suppliers" | "storageAreas" | "recipes" | "productLocations";

function catalogId(collection: CatalogCollection, record: unknown): string {
  if (typeof record !== "object" || record === null) return "";
  const value = record as { id?: unknown; name?: unknown };
  if (collection === "recipes") {
    return String(value.name ?? "").trim().toLowerCase();
  }
  return String(value.id ?? "").trim();
}

export function syncCloudCatalogCollection(
  collection: CatalogCollection,
  previous: unknown[],
  next: unknown[]
): void {
  if (typeof window === "undefined") return;

  const previousById = new Map<string, unknown>(
    previous
      .map((record): [string, unknown] => [catalogId(collection, record), record])
      .filter(([id]) => Boolean(id))
  );
  const nextById = new Map<string, unknown>(
    next
      .map((record): [string, unknown] => [catalogId(collection, record), record])
      .filter(([id]) => Boolean(id))
  );

  const changed = next.filter((record) => {
    const id = catalogId(collection, record);
    if (!id) return false;
    const existing = previousById.get(id);
    return !existing || JSON.stringify(existing) !== JSON.stringify(record);
  });

  const deletedIds = previous
    .map((record) => catalogId(collection, record))
    .filter((id) => id && !nextById.has(id));

  if (changed.length > 0) {
    enqueueCatalogChange("PUT", { [collection]: changed });
    void flushPendingCatalogChanges();
  }

  if (deletedIds.length > 0) {
    const type =
      collection === "products"
        ? "product"
        : collection === "suppliers"
          ? "supplier"
          : collection === "recipes"
            ? "recipe"
            : collection === "productLocations"
              ? "productLocation"
              : "storageArea";
    void deleteCloudCatalogRecords(type, deletedIds).catch((error) => {
      console.error("Catalogue deletion sync failed:", error);
    });
  }
}
