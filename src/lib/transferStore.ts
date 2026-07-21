import type { Product } from "@/data/products";
import { getCurrentUser } from "@/lib/currentUser";
import { getActiveBusinessId } from "@/lib/businessWorkspace";
import {
  addInventoryMovements,
  getProductStock,
} from "@/lib/inventoryStore";
import { getProductById } from "@/lib/productStore";
import { addAuditRecord } from "@/lib/auditStore";

const STORAGE_KEY = "kitchenops-stock-transfers";
const TRANSFERS_CHANGED_EVENT = "kitchenops-transfers-changed";

export let TRANSFER_SITES: Array<{ id: string; name: string }> = [];

export function setTransferSites(sites: Array<{ id: string; name: string }>): void {
  TRANSFER_SITES = sites;
}

export type TransferStatus = "Requested" | "Dispatched" | "Received" | "Cancelled";

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
  requestedBy: string;
  requestedAt: string;
  dispatchedBy?: string;
  dispatchedAt?: string;
  receivedBy?: string;
  receivedAt?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  transferredBy: string;
  createdAt: string;
  status: TransferStatus;
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
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
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
    return Number.isFinite(numberPart) ? Math.max(highest, numberPart) : highest;
  }, 0);
  return `TR-${String(highestNumber + 1).padStart(6, "0")}`;
}

function getProduct(productId: number): Product {
  const product = getProductById(productId);
  if (!product) throw new Error("Product not found.");
  if (!product.active) throw new Error("Archived products cannot be transferred.");
  return product;
}

function normaliseTransfer(raw: Partial<StockTransfer> & { status?: string }): StockTransfer | null {
  if (!raw.id || !raw.transferNumber || !raw.fromSiteId || !raw.toSiteId || !raw.productId) return null;
  const rawStatus = String((raw as { status?: string }).status || "");
  const legacyCompleted = rawStatus === "Completed";
  const requestedAt = raw.requestedAt || raw.createdAt || now();
  const requestedBy = raw.requestedBy || raw.transferredBy || "Unknown user";
  return {
    id: raw.id,
    transferNumber: raw.transferNumber,
    businessId: raw.businessId || getActiveBusinessId(),
    fromSiteId: raw.fromSiteId,
    fromSiteName: raw.fromSiteName || raw.fromSiteId,
    toSiteId: raw.toSiteId,
    toSiteName: raw.toSiteName || raw.toSiteId,
    productId: raw.productId,
    productName: raw.productName || `Product ${raw.productId}`,
    inventoryUnit: raw.inventoryUnit || "Each",
    quantity: Math.max(0, Number(raw.quantity) || 0),
    reason: raw.reason,
    requestedBy,
    requestedAt,
    dispatchedBy: raw.dispatchedBy || (legacyCompleted ? requestedBy : undefined),
    dispatchedAt: raw.dispatchedAt || (legacyCompleted ? requestedAt : undefined),
    receivedBy: raw.receivedBy || (legacyCompleted ? requestedBy : undefined),
    receivedAt: raw.receivedAt || (legacyCompleted ? requestedAt : undefined),
    cancelledBy: raw.cancelledBy,
    cancelledAt: raw.cancelledAt,
    transferredBy: raw.transferredBy || requestedBy,
    createdAt: raw.createdAt || requestedAt,
    status: legacyCompleted ? "Received" : ((rawStatus as TransferStatus) || "Requested"),
  };
}

export function getTransfers(): StockTransfer[] {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normaliseTransfer(item as Partial<StockTransfer> & { status?: string }))
      .filter((item): item is StockTransfer => item !== null);
  } catch {
    return [];
  }
}

export function getTransferById(id: string): StockTransfer | undefined {
  return getTransfers().find((transfer) => transfer.id === id);
}

export function createTransfer(input: CreateTransferInput): StockTransfer {
  if (typeof window === "undefined") throw new Error("Transfers can only be created in the browser.");

  const fromSite = getSite(input.fromSiteId);
  const toSite = getSite(input.toSiteId);
  if (!fromSite) throw new Error("Choose a valid source site.");
  if (!toSite) throw new Error("Choose a valid destination site.");
  if (fromSite.id === toSite.id) throw new Error("Source and destination sites must be different.");
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) throw new Error("Enter a transfer quantity greater than zero.");

  const product = getProduct(input.productId);
  const quantity = Number(input.quantity);
  const availableStock = getProductStock(getActiveBusinessId(), fromSite.id, product.id);
  if (quantity > availableStock) {
    throw new Error(`Only ${availableStock} ${product.inventoryUnit} are available at ${fromSite.name}.`);
  }

  const currentUser = getCurrentUser();
  const requestedBy = input.transferredBy?.trim() || currentUser?.name || "Unknown user";
  const currentTransfers = getTransfers();
  const timestamp = now();

  const transfer: StockTransfer = {
    id: createId(),
    transferNumber: getNextTransferNumber(currentTransfers),
    businessId: getActiveBusinessId(),
    fromSiteId: fromSite.id,
    fromSiteName: fromSite.name,
    toSiteId: toSite.id,
    toSiteName: toSite.name,
    productId: product.id,
    productName: product.name,
    inventoryUnit: product.inventoryUnit,
    quantity,
    reason: input.reason?.trim() || undefined,
    requestedBy,
    requestedAt: timestamp,
    transferredBy: requestedBy,
    createdAt: timestamp,
    status: "Requested",
  };

  saveTransfers([transfer, ...currentTransfers]);
  addAuditRecord({
    action: "created",
    area: "Transfers",
    title: `${product.name} transfer requested`,
    description: `${quantity} ${product.inventoryUnit} from ${fromSite.name} to ${toSite.name}.`,
    siteId: fromSite.id,
    siteName: fromSite.name,
    performedBy: requestedBy,
  });
  return transfer;
}

export function dispatchTransfer(id: string, userName?: string): StockTransfer {
  const transfers = getTransfers();
  const transfer = transfers.find((item) => item.id === id);
  if (!transfer) throw new Error("Transfer not found.");
  if (transfer.status !== "Requested") throw new Error("Only requested transfers can be dispatched.");

  const availableStock = getProductStock(getActiveBusinessId(), transfer.fromSiteId, transfer.productId);
  if (transfer.quantity > availableStock) {
    throw new Error(`Only ${availableStock} ${transfer.inventoryUnit} are available at ${transfer.fromSiteName}.`);
  }

  const by = userName?.trim() || getCurrentUser()?.name || "Unknown user";
  const timestamp = now();
  addInventoryMovements([{
    businessId: getActiveBusinessId(),
    siteId: transfer.fromSiteId,
    productId: transfer.productId,
    productName: transfer.productName,
    quantity: -transfer.quantity,
    movementType: "Transfer Out",
    referenceId: transfer.id,
    referenceNumber: `${transfer.transferNumber} dispatched to ${transfer.toSiteName}`,
  }]);

  const updated = { ...transfer, status: "Dispatched" as const, dispatchedBy: by, dispatchedAt: timestamp };
  saveTransfers(transfers.map((item) => item.id === id ? updated : item));
  addAuditRecord({ action: "updated", area: "Transfers", title: `${transfer.transferNumber} dispatched`, description: `${transfer.quantity} ${transfer.inventoryUnit} ${transfer.productName} to ${transfer.toSiteName}.`, siteId: transfer.fromSiteId, siteName: transfer.fromSiteName, performedBy: by });
  return updated;
}

export function receiveTransfer(id: string, userName?: string): StockTransfer {
  const transfers = getTransfers();
  const transfer = transfers.find((item) => item.id === id);
  if (!transfer) throw new Error("Transfer not found.");
  if (transfer.status !== "Dispatched") throw new Error("Only dispatched transfers can be received.");

  const by = userName?.trim() || getCurrentUser()?.name || "Unknown user";
  const timestamp = now();
  addInventoryMovements([{
    businessId: getActiveBusinessId(),
    siteId: transfer.toSiteId,
    productId: transfer.productId,
    productName: transfer.productName,
    quantity: transfer.quantity,
    movementType: "Transfer In",
    referenceId: transfer.id,
    referenceNumber: `${transfer.transferNumber} received from ${transfer.fromSiteName}`,
  }]);

  const updated = { ...transfer, status: "Received" as const, receivedBy: by, receivedAt: timestamp };
  saveTransfers(transfers.map((item) => item.id === id ? updated : item));
  addAuditRecord({ action: "updated", area: "Transfers", title: `${transfer.transferNumber} received`, description: `${transfer.quantity} ${transfer.inventoryUnit} ${transfer.productName} from ${transfer.fromSiteName}.`, siteId: transfer.toSiteId, siteName: transfer.toSiteName, performedBy: by });
  return updated;
}

export function cancelTransfer(id: string, userName?: string): StockTransfer {
  const transfers = getTransfers();
  const transfer = transfers.find((item) => item.id === id);
  if (!transfer) throw new Error("Transfer not found.");
  if (transfer.status !== "Requested") throw new Error("Only requested transfers can be cancelled.");
  const by = userName?.trim() || getCurrentUser()?.name || "Unknown user";
  const updated = { ...transfer, status: "Cancelled" as const, cancelledBy: by, cancelledAt: now() };
  saveTransfers(transfers.map((item) => item.id === id ? updated : item));
  return updated;
}

export function subscribeToTransferChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handleLocalChange = () => callback();
  const handleStorageChange = (event: StorageEvent) => { if (event.key === STORAGE_KEY) callback(); };
  window.addEventListener(TRANSFERS_CHANGED_EVENT, handleLocalChange);
  window.addEventListener("storage", handleStorageChange);
  return () => {
    window.removeEventListener(TRANSFERS_CHANGED_EVENT, handleLocalChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}
