import { getActiveBusinessId } from "@/lib/businessWorkspace";
import { getProducts } from "@/lib/productStore";
import { toast } from "@/lib/toast";

const STOCK_STORAGE_KEY = "kitchenops-inventory-stock";
const MOVEMENT_STORAGE_KEY = "kitchenops-inventory-movements";
const PENDING_MOVEMENT_KEY = "kitchenops-pending-inventory-movements";
const INVENTORY_CHANGED_EVENT = "kitchenops-inventory-changed";

export type InventoryMovementType =
  | "Delivery"
  | "Production"
  | "Waste"
  | "Stocktake"
  | "Adjustment"
  | "Transfer Out"
  | "Transfer In";

export type InventoryStock = {
  businessId: string;
  siteId: string;
  productId: number;
  quantity: number;
  updatedAt: string;
};

export type InventoryMovement = {
  id: string;
  businessId: string;
  siteId: string;
  productId: number;
  productName: string;
  /** Positive adds stock. Negative removes stock. */
  quantity: number;
  movementType: InventoryMovementType;
  referenceId: string;
  referenceNumber: string;
  createdAt: string;
};

export type NewInventoryMovement = {
  businessId?: string;
  siteId?: string;
  productId: number;
  productName?: string;
  quantity: number;
  movementType?: InventoryMovementType;
  referenceId?: string;
  referenceNumber?: string;
};

type AppliedStock = {
  id: string;
  siteId: string;
  productId: number;
  quantity: number;
};

let flushPromise: Promise<void> | null = null;

function now(): string {
  return new Date().toISOString();
}

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emitInventoryChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(INVENTORY_CHANGED_EVENT));
}

function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(key);
  if (!saved) return [];

  try {
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function readSavedStock(): InventoryStock[] {
  return readArray<InventoryStock>(STOCK_STORAGE_KEY);
}

export function getInventoryStock(): InventoryStock[] {
  return readSavedStock();
}

export function saveInventoryStock(stock: InventoryStock[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stock));
  emitInventoryChanged();
}

export function getInventoryMovements(): InventoryMovement[] {
  return readArray<InventoryMovement>(MOVEMENT_STORAGE_KEY);
}

function saveInventoryMovements(movements: InventoryMovement[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MOVEMENT_STORAGE_KEY, JSON.stringify(movements));
  emitInventoryChanged();
}

function getPendingMovements(): InventoryMovement[] {
  return readArray<InventoryMovement>(PENDING_MOVEMENT_KEY);
}

function savePendingMovements(movements: InventoryMovement[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_MOVEMENT_KEY, JSON.stringify(movements));
}

function queueMovements(movements: InventoryMovement[]): void {
  const current = getPendingMovements();
  const known = new Set(current.map((movement) => movement.id));
  const merged = [
    ...current,
    ...movements.filter((movement) => !known.has(movement.id)),
  ];
  savePendingMovements(merged);
}

function applyAuthoritativeStock(results: AppliedStock[]): void {
  if (results.length === 0) return;

  let stock = getInventoryStock();
  const businessId = getActiveBusinessId();
  const timestamp = now();

  for (const result of results) {
    const existing = stock.some(
      (record) =>
        record.businessId === businessId &&
        record.siteId === result.siteId &&
        record.productId === result.productId
    );

    if (existing) {
      stock = stock.map((record) =>
        record.businessId === businessId &&
        record.siteId === result.siteId &&
        record.productId === result.productId
          ? { ...record, quantity: Number(result.quantity), updatedAt: timestamp }
          : record
      );
    } else {
      stock.push({
        businessId,
        siteId: result.siteId,
        productId: result.productId,
        quantity: Number(result.quantity),
        updatedAt: timestamp,
      });
    }
  }

  saveInventoryStock(stock);
}

export async function flushPendingInventoryMovements(): Promise<void> {
  if (typeof window === "undefined") return;
  if (flushPromise) return flushPromise;

  flushPromise = (async () => {
    while (true) {
      const activeBusinessId = getActiveBusinessId();
      const pending = getPendingMovements();
      const activePending = pending.filter(
        (movement) => movement.businessId === activeBusinessId
      );
      if (activePending.length === 0) return;

      const batch = activePending.slice(0, 100);
      const response = await fetch("/api/cloud/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movements: batch }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(result.error ?? "Inventory could not be synced.");
      }

      const result = (await response.json()) as { stock?: AppliedStock[] };
      applyAuthoritativeStock(result.stock ?? []);

      const existingMovements = getInventoryMovements();
      const existingIds = new Set(existingMovements.map((movement) => movement.id));
      const missingApplied = batch.filter((movement) => !existingIds.has(movement.id));
      if (missingApplied.length > 0) {
        saveInventoryMovements([...missingApplied, ...existingMovements]);
      }

      const appliedIds = new Set(batch.map((movement) => movement.id));
      savePendingMovements(
        getPendingMovements().filter((movement) => !appliedIds.has(movement.id))
      );
    }
  })()
    .catch((error) => {
      console.warn("Inventory sync deferred:", error);
      toast.warning(
        "Inventory sync pending",
        error instanceof Error
          ? error.message
          : "KitchenOps will retry when the connection is available."
      );
    })
    .finally(() => {
      flushPromise = null;
    });

  return flushPromise;
}

export function getProductStock(
  businessId: string,
  siteId: string,
  productId: number
): number {
  return (
    getInventoryStock().find(
      (record) =>
        record.businessId === businessId &&
        record.siteId === siteId &&
        record.productId === productId
    )?.quantity ?? 0
  );
}

export function addInventoryMovements(movements: NewInventoryMovement[]): void {
  if (typeof window === "undefined" || movements.length === 0) return;

  let updatedStock = getInventoryStock();
  const existingMovements = getInventoryMovements();
  const products = getProducts();
  const createdMovements: InventoryMovement[] = [];

  movements.forEach((movement) => {
    if (!Number.isFinite(movement.quantity) || movement.quantity === 0) return;

    const businessId = movement.businessId ?? getActiveBusinessId();
    const siteId = movement.siteId?.trim() ?? "";
    if (!businessId || !siteId) return;

    const product = products.find((item) => item.id === movement.productId);
    const productName =
      movement.productName ?? product?.name ?? `Product ${movement.productId}`;
    const timestamp = now();

    const existingRecord = updatedStock.find(
      (record) =>
        record.businessId === businessId &&
        record.siteId === siteId &&
        record.productId === movement.productId
    );

    if (existingRecord) {
      updatedStock = updatedStock.map((record) =>
        record.businessId === businessId &&
        record.siteId === siteId &&
        record.productId === movement.productId
          ? {
              ...record,
              quantity: record.quantity + movement.quantity,
              updatedAt: timestamp,
            }
          : record
      );
    } else {
      updatedStock = [
        ...updatedStock,
        {
          businessId,
          siteId,
          productId: movement.productId,
          quantity: movement.quantity,
          updatedAt: timestamp,
        },
      ];
    }

    createdMovements.push({
      id: createId(),
      businessId,
      siteId,
      productId: movement.productId,
      productName,
      quantity: movement.quantity,
      movementType: movement.movementType ?? "Adjustment",
      referenceId: movement.referenceId ?? createId(),
      referenceNumber: movement.referenceNumber ?? "Manual movement",
      createdAt: timestamp,
    });
  });

  if (createdMovements.length === 0) return;

  saveInventoryStock(updatedStock);
  saveInventoryMovements([...createdMovements, ...existingMovements]);
  queueMovements(createdMovements);
  void flushPendingInventoryMovements();
}

export function receiveProductStock(input: {
  businessId: string;
  siteId: string;
  productId: number;
  productName: string;
  /** Quantity received in purchase units, for example 2 cases. */
  quantity: number;
  referenceId: string;
  referenceNumber: string;
}): void {
  if (input.quantity <= 0) return;

  const product = getProducts().find((item) => item.id === input.productId);
  const purchaseQuantity =
    product?.purchaseQuantity && product.purchaseQuantity > 0
      ? product.purchaseQuantity
      : 1;
  const inventoryQuantity = input.quantity * purchaseQuantity;
  const conversionReference = product
    ? `${input.referenceNumber} • ${input.quantity} ${product.orderUnit} = ${inventoryQuantity} ${product.inventoryUnit}`
    : input.referenceNumber;

  addInventoryMovements([
    {
      businessId: input.businessId,
      siteId: input.siteId,
      productId: input.productId,
      productName: input.productName,
      quantity: inventoryQuantity,
      movementType: "Delivery",
      referenceId: input.referenceId,
      referenceNumber: conversionReference,
    },
  ]);
}

export function subscribeToInventoryChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleLocalChange = (): void => callback();
  const handleStorageChange = (event: StorageEvent): void => {
    if (
      event.key === STOCK_STORAGE_KEY ||
      event.key === MOVEMENT_STORAGE_KEY
    ) {
      callback();
    }
  };

  window.addEventListener(INVENTORY_CHANGED_EVENT, handleLocalChange);
  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener(INVENTORY_CHANGED_EVENT, handleLocalChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}


export function startInventorySyncRetry(intervalMs = 12000): () => void {
  if (typeof window === "undefined") return () => undefined;

  const retry = () => {
    void flushPendingInventoryMovements();
  };
  const timer = window.setInterval(retry, intervalMs);
  const onOnline = () => retry();
  const onVisibility = () => {
    if (document.visibilityState === "visible") retry();
  };

  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    window.clearInterval(timer);
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
