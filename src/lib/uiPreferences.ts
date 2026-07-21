import { getActiveBusinessId } from "@/lib/businessWorkspace";

function preferenceKey(page: string): string {
  const businessId = getActiveBusinessId() || "unknown-business";
  return `kitchenops-ui-preference::${businessId}::${page}`;
}

export function getPreferredSite(page: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(preferenceKey(page)) || fallback;
}

export function setPreferredSite(page: string, value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(preferenceKey(page), value);
}

export function clearPreferredSite(page: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(preferenceKey(page));
}
