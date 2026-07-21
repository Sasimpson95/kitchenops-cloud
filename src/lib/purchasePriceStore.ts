import { getActiveBusinessId } from "@/lib/businessWorkspace";

export type PurchasePriceRecord = {
  id: string;
  businessId: string;
  siteId: string;
  supplierId: number;
  supplierName: string;
  productId: number;
  productName: string;
  unitPrice: number;
  sourceType: "order" | "invoice";
  sourceId: string;
  sourceNumber: string;
  recordedAt: string;
};

const KEY = "kitchenops-purchase-price-history";
const EVENT = "kitchenops-purchase-price-history-changed";

function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getPurchasePriceHistory(): PurchasePriceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as PurchasePriceRecord[]) : [];
  } catch {
    return [];
  }
}

export function recordPurchasePrice(input: Omit<PurchasePriceRecord, "id" | "businessId" | "recordedAt">): PurchasePriceRecord {
  const record: PurchasePriceRecord = {
    ...input,
    id: createId(),
    businessId: getActiveBusinessId(),
    recordedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify([record, ...getPurchasePriceHistory()]));
    window.dispatchEvent(new CustomEvent(EVENT));
  }
  return record;
}

export function getLatestProductPrice(productId: number): PurchasePriceRecord | undefined {
  return getPurchasePriceHistory().find((record) => record.productId === productId);
}

export function getRecentPriceChanges(limit = 20): Array<PurchasePriceRecord & { previousUnitPrice: number; difference: number }> {
  const history = getPurchasePriceHistory();
  const result: Array<PurchasePriceRecord & { previousUnitPrice: number; difference: number }> = [];
  const grouped = new Map<number, PurchasePriceRecord[]>();

  for (const record of history) {
    const list = grouped.get(record.productId) ?? [];
    list.push(record);
    grouped.set(record.productId, list);
  }

  for (const records of grouped.values()) {
    const sorted = [...records].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
    if (sorted.length < 2) continue;
    const current = sorted[0];
    const previous = sorted[1];
    const difference = Math.round((current.unitPrice - previous.unitPrice + Number.EPSILON) * 100) / 100;
    if (difference !== 0) result.push({ ...current, previousUnitPrice: previous.unitPrice, difference });
  }

  return result.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)).slice(0, limit);
}

export function subscribeToPurchasePriceChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const local = () => callback();
  const storage = (event: StorageEvent) => { if (event.key === KEY) callback(); };
  window.addEventListener(EVENT, local);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(EVENT, local);
    window.removeEventListener("storage", storage);
  };
}
