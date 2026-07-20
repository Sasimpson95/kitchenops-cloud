import { getProducts } from "@/lib/productStore";
import { scheduleCloudCatalogSave } from "@/lib/cloud/catalogSync";
import { getActiveBusinessId } from "@/lib/businessWorkspace";

const STOCK_STORAGE_KEY = "kitchenops-inventory-stock";
const MOVEMENT_STORAGE_KEY = "kitchenops-inventory-movements";
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

  window.dispatchEvent(
    new CustomEvent(INVENTORY_CHANGED_EVENT)
  );
}

function readSavedStock(): InventoryStock[] {
  if (typeof window === "undefined") return [];

  const saved = window.localStorage.getItem(STOCK_STORAGE_KEY);

  if (!saved) return [];

  try {
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as InventoryStock[]) : [];
  } catch {
    return [];
  }
}

export function getInventoryStock(): InventoryStock[] {
  if (typeof window === "undefined") return [];
  return readSavedStock();
}

export function saveInventoryStock(stock: InventoryStock[]): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stock));
  emitInventoryChanged();
  scheduleCloudCatalogSave();
}

export function getInventoryMovements(): InventoryMovement[] {
  if (typeof window === "undefined") return [];

  const saved = window.localStorage.getItem(MOVEMENT_STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as InventoryMovement[]) : [];
  } catch {
    return [];
  }
}

function saveInventoryMovements(movements: InventoryMovement[]): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    MOVEMENT_STORAGE_KEY,
    JSON.stringify(movements)
  );
  emitInventoryChanged();
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

export function addInventoryMovements(
  movements: NewInventoryMovement[]
): void {
  if (typeof window === "undefined" || movements.length === 0) return;

  let updatedStock = getInventoryStock();
  const existingMovements = getInventoryMovements();
  const products = getProducts();
  const createdMovements: InventoryMovement[] = [];

  movements.forEach((movement) => {
    if (!Number.isFinite(movement.quantity) || movement.quantity === 0) {
      return;
    }

    const businessId = movement.businessId ?? getActiveBusinessId();
    const siteId = movement.siteId ?? "";
    const product = products.find((item) => item.id === movement.productId);
    const productName =
      movement.productName ?? product?.name ?? `Product ${movement.productId}`;

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
              updatedAt: now(),
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
          updatedAt: now(),
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
      createdAt: now(),
    });
  });

  if (createdMovements.length === 0) return;

  saveInventoryStock(updatedStock);
  saveInventoryMovements([...createdMovements, ...existingMovements]);
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

  const product = getProducts().find(
    (item) => item.id === input.productId
  );

  const purchaseQuantity =
    product?.purchaseQuantity && product.purchaseQuantity > 0
      ? product.purchaseQuantity
      : 1;

  const inventoryQuantity =
    input.quantity * purchaseQuantity;

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

export function subscribeToInventoryChanges(
  callback: () => void
): () => void {
  if (typeof window === "undefined") return () => undefined;

  function handleLocalChange(): void {
    callback();
  }

  function handleStorageChange(event: StorageEvent): void {
    if (
      event.key === STOCK_STORAGE_KEY ||
      event.key === MOVEMENT_STORAGE_KEY
    ) {
      callback();
    }
  }

  window.addEventListener(INVENTORY_CHANGED_EVENT, handleLocalChange);
  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener(INVENTORY_CHANGED_EVENT, handleLocalChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}
