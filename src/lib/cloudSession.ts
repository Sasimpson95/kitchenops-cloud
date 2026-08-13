import type { User } from "@/config/roles";

export type CloudSession = {
  authenticated: boolean;
  user?: User;
  business?: { id: string; name: string; code?: string } | null;
  siteId?: string;
  authType?: "supabase" | "pin";
  mustChangePin?: boolean;
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
    window.sessionStorage.removeItem(SESSION_CACHE_KEY);
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

export async function getCloudSession(options?: {
  force?: boolean;
}): Promise<CloudSession> {
  if (!options?.force) {
    const cached = getCachedCloudSession();

    if (cached?.authenticated && cached.user) {
      return cached;
    }

    if (pendingSession) {
      return pendingSession;
    }
  }

  pendingSession = fetch("/api/auth/session", {
    cache: "no-store",
  })
    .then(async (response) => {
      const text = await response.text();

      let data: CloudSession;

      if (!text.trim()) {
        data = {
          authenticated: false,
        };
      } else {
        try {
          data = JSON.parse(text) as CloudSession;
        } catch {
          console.error(
            "KitchenOps session endpoint returned invalid JSON:",
            response.status,
            text
          );

          data = {
            authenticated: false,
          };
        }
      }

      memorySession = data;

      if (typeof window !== "undefined") {
        if (data.authenticated) {
          window.sessionStorage.setItem(
            SESSION_CACHE_KEY,
            JSON.stringify(data)
          );
        } else {
          window.sessionStorage.removeItem(SESSION_CACHE_KEY);
        }
      }

      return data;
    })
    .catch((error) => {
      console.error("KitchenOps session request failed:", error);

      const fallback: CloudSession = {
        authenticated: false,
      };

      memorySession = fallback;

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(SESSION_CACHE_KEY);
      }

      return fallback;
    })
    .finally(() => {
      pendingSession = null;
    });

  return pendingSession;
}