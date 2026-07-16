import type { User } from "@/config/roles";

export type CloudSession = {
  authenticated: boolean;
  user?: User;
  business?: { id: string; name: string; code?: string } | null;
  siteId?: string;
  authType?: "supabase" | "pin";
  needsOnboarding?: boolean;
};

let memorySession: CloudSession | null = null;
let pendingSession: Promise<CloudSession> | null = null;
const SESSION_CACHE_KEY = "kitchenops-cloud-session-cache";

export function getCachedCloudSession(): CloudSession | null {
  if (memorySession) return memorySession;
  if (typeof window === "undefined") return null;
  const saved = window.sessionStorage.getItem(SESSION_CACHE_KEY);
  if (!saved) return null;
  try {
    memorySession = JSON.parse(saved) as CloudSession;
    return memorySession;
  } catch {
    return null;
  }
}

export function clearCloudSessionCache(): void {
  memorySession = null;
  pendingSession = null;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(SESSION_CACHE_KEY);
  }
}

export async function getCloudSession(options?: { force?: boolean }): Promise<CloudSession> {
  if (!options?.force) {
    const cached = getCachedCloudSession();
    if (cached?.authenticated && cached.user) return cached;
    if (pendingSession) return pendingSession;
  }

  pendingSession = fetch("/api/auth/session", { cache: "no-store" })
    .then(async (response) => {
      const data = (await response.json()) as CloudSession;
      memorySession = data;
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data));
      }
      return data;
    })
    .finally(() => { pendingSession = null; });

  return pendingSession;
}
