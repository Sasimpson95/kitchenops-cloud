export const ACTIVE_BUSINESS_KEY = "kitchenops-active-business-id";

const WORKSPACE_KEYS = [
  "kitchenops-products",
  "kitchenops-suppliers",
  "kitchenops-recipes",
  "kitchenops-recipe-costing-settings",
  "kitchenops-recipe-cost-history",
  "kitchenops-purchase-orders",
  "kitchenops-storage-areas",
  "kitchenops-product-locations",
  "kitchenops-inventory-movements",
  "kitchenops-stock-transfers",
  "kitchenops-waste-records",
  "kitchenops-stocktakes",
  "kitchenops-site-handovers",
  "kitchenops-production",
  "kitchenops-prep-items",
] as const;

function scopedKey(businessId: string, key: string): string {
  return `${key}::${businessId}`;
}

function saveWorkspace(businessId: string): void {
  for (const key of WORKSPACE_KEYS) {
    const value = window.localStorage.getItem(key);
    const target = scopedKey(businessId, key);
    if (value === null) window.localStorage.removeItem(target);
    else window.localStorage.setItem(target, value);
  }
}

function restoreWorkspace(businessId: string): void {
  for (const key of WORKSPACE_KEYS) {
    const value = window.localStorage.getItem(scopedKey(businessId, key));
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  }
}

function clearWorkspace(): void {
  for (const key of WORKSPACE_KEYS) window.localStorage.removeItem(key);
}

/** Keeps browser-only records separated by business. Empty new businesses never inherit demo data. */
export function switchBusinessWorkspace(businessId: string, isEmptyBusiness: boolean): void {
  if (typeof window === "undefined" || !businessId) return;

  const previousBusinessId = window.localStorage.getItem(ACTIVE_BUSINESS_KEY);

  if (!previousBusinessId) {
    if (isEmptyBusiness) clearWorkspace();
    window.localStorage.setItem(ACTIVE_BUSINESS_KEY, businessId);
    saveWorkspace(businessId);
    return;
  }

  if (previousBusinessId === businessId) {
    if (isEmptyBusiness) {
      const hasScopedWorkspace = WORKSPACE_KEYS.some((key) =>
        window.localStorage.getItem(scopedKey(businessId, key)) !== null
      );
      if (!hasScopedWorkspace) clearWorkspace();
    }
    return;
  }

  saveWorkspace(previousBusinessId);
  restoreWorkspace(businessId);
  window.localStorage.setItem(ACTIVE_BUSINESS_KEY, businessId);
}


export function getActiveBusinessId(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ACTIVE_BUSINESS_KEY) ?? "";
}
