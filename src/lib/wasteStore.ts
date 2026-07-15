import type { Product } from "@/data/products";
import {
  addInventoryMovements,
  getProductStock,
} from "@/lib/inventoryStore";

import { addAuditRecord } from "@/lib/auditStore";

const STORAGE_KEY = "kitchenops-waste-records";
const WASTE_CHANGED_EVENT = "kitchenops-waste-changed";

export type WasteReason =
  | "Burnt"
  | "Damaged"
  | "Over Production"
  | "Customer Return"
  | "Expired"
  | "Quality Issue"
  | "Other";

export type WasteRecord = {
  id: string;
  wasteNumber: string;

  businessId: string;
  siteId: string;
  siteName: string;

  productId: number;
  productName: string;
  inventoryUnit: string;

  quantity: number;
  reason: WasteReason;
  notes: string;

  recordedBy: string;
  createdAt: string;

  /**
   * Snapshot fields for future waste valuation.
   * Product price is currently a purchase-unit price, so KitchenOps does not
   * calculate a misleading waste value until pack conversions are introduced.
   */
  purchasePriceSnapshot: number;
  purchaseUnitSnapshot: string;
};

export type CreateWasteInput = {
  businessId?: string;
  siteId: string;
  siteName: string;

  product: Product;
  quantity: number;
  reason: WasteReason;
  notes?: string;
  recordedBy: string;
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

function emitWasteChanged(): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(WASTE_CHANGED_EVENT));
}

function saveWasteRecords(records: WasteRecord[]): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  emitWasteChanged();
}

function getNextWasteNumber(records: WasteRecord[]): string {
  const highest = records.reduce((currentHighest, record) => {
    const numberPart = Number(record.wasteNumber.split("-").at(-1) ?? "0");

    return Number.isFinite(numberPart)
      ? Math.max(currentHighest, numberPart)
      : currentHighest;
  }, 0);

  return `WST-${String(highest + 1).padStart(6, "0")}`;
}

function normaliseWasteRecord(record: Partial<WasteRecord>): WasteRecord | null {
  if (
    !record.id ||
    !record.productId ||
    !record.productName ||
    !record.siteId ||
    !record.siteName
  ) {
    return null;
  }

  return {
    id: record.id,
    wasteNumber: record.wasteNumber || "WST-000000",

    businessId: record.businessId || "pudding-pantry",
    siteId: record.siteId,
    siteName: record.siteName,

    productId: record.productId,
    productName: record.productName,
    inventoryUnit: record.inventoryUnit || "Each",

    quantity: Math.max(0, Number(record.quantity) || 0),
    reason: record.reason || "Other",
    notes: record.notes || "",

    recordedBy: record.recordedBy || "Unknown",
    createdAt: record.createdAt || now(),

    purchasePriceSnapshot: Math.max(
      0,
      Number(record.purchasePriceSnapshot) || 0
    ),
    purchaseUnitSnapshot: record.purchaseUnitSnapshot || "Not set",
  };
}

export function getWasteRecords(): WasteRecord[] {
  if (typeof window === "undefined") return [];

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((record) => normaliseWasteRecord(record as Partial<WasteRecord>))
      .filter((record): record is WasteRecord => record !== null)
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
      );
  } catch {
    return [];
  }
}

export function createWasteRecord(input: CreateWasteInput): WasteRecord {
  const businessId = input.businessId || "pudding-pantry";
  const quantity = Number(input.quantity);

  if (!input.siteId.trim() || !input.siteName.trim()) {
    throw new Error("Choose a site.");
  }

  if (!input.product.active) {
    throw new Error("This product is archived and cannot be wasted.");
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Enter a waste quantity greater than zero.");
  }

  if (!input.recordedBy.trim()) {
    throw new Error("The user recording this waste is missing.");
  }

  const availableStock = getProductStock(
    businessId,
    input.siteId,
    input.product.id
  );

  if (quantity > availableStock) {
    throw new Error(
      `Only ${availableStock} ${input.product.inventoryUnit} is available at ${input.siteName}.`
    );
  }

  const existingRecords = getWasteRecords();
  const timestamp = now();

  const record: WasteRecord = {
    id: createId(),
    wasteNumber: getNextWasteNumber(existingRecords),

    businessId,
    siteId: input.siteId,
    siteName: input.siteName,

    productId: input.product.id,
    productName: input.product.name,
    inventoryUnit: input.product.inventoryUnit,

    quantity,
    reason: input.reason,
    notes: input.notes?.trim() || "",

    recordedBy: input.recordedBy.trim(),
    createdAt: timestamp,

    purchasePriceSnapshot: input.product.price,
    purchaseUnitSnapshot: input.product.orderUnit,
  };

  addInventoryMovements([
    {
      businessId,
      siteId: input.siteId,
      productId: input.product.id,
      productName: input.product.name,
      quantity: -quantity,
      movementType: "Waste",
      referenceId: record.id,
      referenceNumber: `${record.wasteNumber} • ${input.reason}`,
    },
  ]);

  saveWasteRecords([record, ...existingRecords]);

  addAuditRecord({
    action: "recorded",
    area: "Waste",
    title: `${record.productName} waste recorded`,
    description: `${record.quantity} ${record.inventoryUnit} • ${record.reason}`,
    siteId: record.siteId,
    siteName: record.siteName,
    performedBy: record.recordedBy,
  });

  return record;
}

export function subscribeToWasteChanges(
  callback: () => void
): () => void {
  if (typeof window === "undefined") return () => undefined;

  function handleLocalChange(): void {
    callback();
  }

  function handleStorageChange(event: StorageEvent): void {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  }

  window.addEventListener(WASTE_CHANGED_EVENT, handleLocalChange);
  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener(WASTE_CHANGED_EVENT, handleLocalChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}
