export type UserRole = "chef" | "manager" | "foh_manager" | "operations";

export type User = {
  name: string;
  role: UserRole;
  site: string | "All Sites";
  /** Supabase site UUID for staff accounts. Operations users span all sites. */
  siteId?: string;
};

const MANAGER_ROUTE_PREFIXES = [
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
  "/notifications",
];

const ROLE_ROUTE_PREFIXES: Record<Exclude<UserRole, "operations">, string[]> = {
  chef: [
    "/home",
    "/recipes",
    "/waste",
    "/handover",
    "/notifications",
  ],
  manager: MANAGER_ROUTE_PREFIXES,
  foh_manager: MANAGER_ROUTE_PREFIXES,
};

export function isRouteAllowedForRole(role: UserRole, pathname: string): boolean {
  if (role === "operations") return true;

  // Route permissions are based on the pathname only. Notification/deep links
  // may include query strings such as /production?day=today. Treat those as
  // the same protected route instead of rejecting the link and falling back.
  const routePath = pathname.split("?")[0]?.split("#")[0] || "/";

  return ROLE_ROUTE_PREFIXES[role].some(
    (prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`)
  );
}
