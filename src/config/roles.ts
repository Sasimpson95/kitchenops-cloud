export type UserRole = "chef" | "manager" | "operations";

export type User = {
  name: string;
  role: UserRole;
  site: string | "All Sites";
  /** Supabase site UUID for staff accounts. Operations users span all sites. */
  siteId?: string;
};

const ROLE_ROUTE_PREFIXES: Record<Exclude<UserRole, "operations">, string[]> = {
  chef: [
    "/home",
    "/recipes",
    "/waste",
    "/handover",
  ],
  manager: [
    "/home",
    "/production",
    "/prep-planner",
    "/recipes",
    "/products",
    "/inventory",
    "/transfers",
    "/purchasing",
    "/orders",
    "/waste",
    "/stocktakes",
    "/storage-areas",
    "/handover",
    "/reports",
    "/deliveries",
  ],
};

export function isRouteAllowedForRole(role: UserRole, pathname: string): boolean {
  if (role === "operations") return true;
  return ROLE_ROUTE_PREFIXES[role].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
