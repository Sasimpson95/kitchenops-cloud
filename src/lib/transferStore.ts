import type { Product } from "@/data/products";
import { getCurrentUser } from "@/lib/currentUser";
import {
  addInventoryMovements,
  getProductStock,
} from "@/lib/inventoryStore";
import { getProductById } from "@/lib/productStore";
import { addAuditRecord } from "@/lib/auditStore";

const STORAGE_KEY = "kitchenops-stock-transfers";
const TRANSFERS_CHANGED_EVENT = "kitchenops-transfers-changed";
const DEFAULT_BUSINESS_ID = "pudding-pantry";

export const TRANSFER_SITES = [
  { id: "beeston", name: "Beeston" },
  { id: "city", name: "City" },
  { id: "sherwood", name: "Sherwood" },
  { id: "bakery", name: "Bakery" },
] as const;

export type StockTransfer = {
  id: string;
  transferNumber: string;

  businessId: string;

  fromSiteId: string;
  fromSiteName: string;

  toSiteId: string;
  toSiteName: string;

  productId: number;
  productName: string;
  inventoryUnit: string;

  quantity: number;
  reason?: string;

  transferredBy: string;
  createdAt: string;
  status: "Completed";
};

export type CreateTransferInput = {
  fromSiteId: string;
  toSiteId: string;
  productId: number;
  quantity: number;
  reason?: string;
  transferredBy?: string;
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

function emitTransfersChanged(): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(TRANSFERS_CHANGED_EVENT));
}

function saveTransfers(transfers: StockTransfer[]): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transfers));
  emitTransfersChanged();
}

function getSite(siteId: string) {
  return TRANSFER_SITES.find((site) => site.id === siteId);
}

function getNextTransferNumber(transfers: StockTransfer[]): string {
  const highestNumber = transfers.reduce((highest, transfer) => {
    const numberPart = Number(transfer.transferNumber.replace("TR-", ""));

    return Number.isFinite(numberPart)
      ? Math.max(highest, numberPart)
      : highest;
  }, 0);

  return `TR-${String(highestNumber + 1).padStart(6, "0")}`;
}

function getProduct(productId: number): Product {
  const product = getProductById(productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  if (!product.active) {
    throw new Error("Archived products cannot be transferred.");
  }

  return product;
}

export function getTransfers(): StockTransfer[] {
  if (typeof window === "undefined") return [];

  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) return [];

  try {
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as StockTransfer[]) : [];
  } catch {
    return [];
  }
}

export function getTransferById(id: string): StockTransfer | undefined {
  return getTransfers().find((transfer) => transfer.id === id);
}

export function createTransfer(input: CreateTransferInput): StockTransfer {
  if (typeof window === "undefined") {
    throw new Error("Transfers can only be created in the browser.");
  }

  const fromSite = getSite(input.fromSiteId);
  const toSite = getSite(input.toSiteId);

  if (!fromSite) {
    throw new Error("Choose a valid source site.");
  }

  if (!toSite) {
    throw new Error("Choose a valid destination site.");
  }

  if (fromSite.id === toSite.id) {
    throw new Error("Source and destination sites must be different.");
  }

  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new Error("Enter a transfer quantity greater than zero.");
  }

  const product = getProduct(input.productId);
  const quantity = Number(input.quantity);
  const availableStock = getProductStock(
    DEFAULT_BUSINESS_ID,
    fromSite.id,
    product.id
  );

  if (quantity > availableStock) {
    throw new Error(
      `Only ${availableStock} ${product.inventoryUnit} are available at ${fromSite.name}.`
    );
  }

  const currentUser = getCurrentUser();
  const transferredBy =
    input.transferredBy?.trim() || currentUser?.name || "Unknown user";
  const currentTransfers = getTransfers();
  const transferId = createId();
  const transferNumber = getNextTransferNumber(currentTransfers);
  const createdAt = now();
  const reason = input.reason?.trim() || undefined;

  const transfer: StockTransfer = {
    id: transferId,
    transferNumber,
    businessId: DEFAULT_BUSINESS_ID,
    fromSiteId: fromSite.id,
    fromSiteName: fromSite.name,
    toSiteId: toSite.id,
    toSiteName: toSite.name,
    productId: product.id,
    productName: product.name,
    inventoryUnit: product.inventoryUnit,
    quantity,
    reason,
    transferredBy,
    createdAt,
    status: "Completed",
  };

  const reasonSuffix = reason ? ` — ${reason}` : "";

  addInventoryMovements([
    {
      businessId: DEFAULT_BUSINESS_ID,
      siteId: fromSite.id,
      productId: product.id,
      productName: product.name,
      quantity: -quantity,
      movementType: "Transfer Out",
      referenceId: transferId,
      referenceNumber: `${transferNumber} to ${toSite.name}${reasonSuffix}`,
    },
    {
      businessId: DEFAULT_BUSINESS_ID,
      siteId: toSite.id,
      productId: product.id,
      productName: product.name,
      quantity,
      movementType: "Transfer In",
      referenceId: transferId,
      referenceNumber: `${transferNumber} from ${fromSite.name}${reasonSuffix}`,
    },
  ]);

  saveTransfers([transfer, ...currentTransfers]);

  addAuditRecord({
    action: "transferred",
    area: "Transfers",
    title: `${product.name} transferred`,
    description: `${quantity} ${product.inventoryUnit} from ${fromSite.name} to ${toSite.name}.`,
    siteId: fromSite.id,
    siteName: fromSite.name,
    performedBy: transferredBy,
  });

  return transfer;
}

export function subscribeToTransferChanges(
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

  window.addEventListener(TRANSFERS_CHANGED_EVENT, handleLocalChange);
  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener(TRANSFERS_CHANGED_EVENT, handleLocalChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}
