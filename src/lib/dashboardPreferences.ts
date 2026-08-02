import type { UserRole } from "@/config/roles";
import { getActiveBusinessId } from "@/lib/businessWorkspace";

export type DashboardWidgetId =
  | "snapshot"
  | "attention"
  | "quickActions"
  | "prep"
  | "handover"
  | "recentActivity"
  | "sites";

export type DashboardWidgetPreference = {
  id: DashboardWidgetId;
  visible: boolean;
};

const ROLE_DEFAULTS: Record<UserRole, DashboardWidgetPreference[]> = {
  chef: [
    { id: "prep", visible: true },
    { id: "handover", visible: true },
    { id: "quickActions", visible: true },
    { id: "recentActivity", visible: true },
  ],
  manager: [
    { id: "attention", visible: true },
    { id: "snapshot", visible: true },
    { id: "quickActions", visible: true },
    { id: "prep", visible: true },
    { id: "handover", visible: true },
    { id: "recentActivity", visible: true },
  ],
  operations: [
    { id: "attention", visible: true },
    { id: "snapshot", visible: true },
    { id: "sites", visible: true },
    { id: "quickActions", visible: true },
    { id: "recentActivity", visible: true },
    { id: "prep", visible: false },
    { id: "handover", visible: false },
  ],
};

function preferenceKey(role: UserRole, userName: string, site: string): string {
  const businessId = getActiveBusinessId() || "unknown-business";
  const identity = `${userName || "shared-user"}::${site || "all-sites"}`
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  return `kitchenops-dashboard-preferences::${businessId}::${role}::${identity}`;
}

export function getDefaultDashboardPreferences(role: UserRole): DashboardWidgetPreference[] {
  return ROLE_DEFAULTS[role].map((item) => ({ ...item }));
}

export function loadDashboardPreferences(
  role: UserRole,
  userName: string,
  site: string
): DashboardWidgetPreference[] {
  const defaults = getDefaultDashboardPreferences(role);
  if (typeof window === "undefined") return defaults;

  try {
    const raw = window.localStorage.getItem(preferenceKey(role, userName, site));
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as DashboardWidgetPreference[];
    const allowed = new Set(defaults.map((item) => item.id));
    const cleaned = parsed.filter(
      (item): item is DashboardWidgetPreference =>
        Boolean(item) && allowed.has(item.id) && typeof item.visible === "boolean"
    );
    const missing = defaults.filter((item) => !cleaned.some((saved) => saved.id === item.id));
    return [...cleaned, ...missing];
  } catch {
    return defaults;
  }
}

export function saveDashboardPreferences(
  role: UserRole,
  userName: string,
  site: string,
  preferences: DashboardWidgetPreference[]
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    preferenceKey(role, userName, site),
    JSON.stringify(preferences)
  );
}
