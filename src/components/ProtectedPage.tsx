"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { isRouteAllowedForRole, type User } from "@/config/roles";
import { getCachedCloudSession, getCloudSession } from "@/lib/cloudSession";
import { getCurrentUser, setCurrentUser } from "@/lib/currentUser";
import {
  flushPendingCatalogChanges,
  hydrateCloudCatalog,
  startCatalogSyncRetry,
} from "@/lib/cloud/catalogSync";
import {
  hydrateOperationalData,
  startOperationalPolling,
} from "@/lib/cloud/operationalSync";
import { switchBusinessWorkspace } from "@/lib/businessWorkspace";
import {
  flushPendingInventoryMovements,
  startInventorySyncRetry,
} from "@/lib/inventoryStore";

const SESSION_RECHECK_MS = 5 * 60 * 1000;

type ProtectedPageProps = {
  children: React.ReactNode;
};

export default function ProtectedPage({ children }: ProtectedPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setUser] = useState<User | null>(null);
  const [accessAllowed, setAccessAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let stopOperationalPolling: (() => void) | undefined;
    let stopInventoryRetry: (() => void) | undefined;
    let stopCatalogRetry: (() => void) | undefined;
    let sessionTimer: number | undefined;

    async function applyAuthoritativeSession(): Promise<boolean> {
      const session = await getCloudSession({ force: true });
      if (cancelled) return false;

      if (!session.authenticated || !session.user) {
        router.replace(session.needsOnboarding ? "/cloud-onboarding" : "/login");
        return false;
      }

      if (!isRouteAllowedForRole(session.user.role, pathname)) {
        setAccessAllowed(false);
        router.replace("/home");
        return false;
      }

      if (session.business?.id) {
        const sitesResponse = await fetch("/api/cloud/sites", { cache: "no-store" });
        const sitesPayload = (await sitesResponse.json().catch(() => ({}))) as {
          sites?: Array<{ id: string }>;
        };
        if (cancelled) return false;
        switchBusinessWorkspace(
          session.business.id,
          sitesResponse.ok && (sitesPayload.sites?.length ?? 0) === 0
        );
      }

      setCurrentUser(session.user);
      setUser(session.user);
      return true;
    }

    async function loadSession(): Promise<void> {
      try {
        const cachedUser = getCachedCloudSession()?.user ?? getCurrentUser();
        if (
          cachedUser &&
          isRouteAllowedForRole(cachedUser.role, pathname) &&
          !cancelled
        ) {
          setUser(cachedUser);
        }

        const valid = await applyAuthoritativeSession();
        if (!valid || cancelled) return;

        // Push any acknowledged-later catalogue edits before hydration so a
        // reload cannot overwrite the local cache with an older cloud copy.
        await flushPendingCatalogChanges();
        await hydrateCloudCatalog();
        await flushPendingInventoryMovements();
        await hydrateOperationalData();
        if (cancelled) return;

        // Do not render protected workflow data until the authoritative
        // business/site-scoped cloud caches have finished hydrating. This
        // prevents a shared device briefly showing the previous staff/site.
        setAccessAllowed(true);

        const operationalPollMs =
          pathname === "/production" || pathname === "/home" ? 3000 : 12000;
        stopOperationalPolling = startOperationalPolling(operationalPollMs);
        stopInventoryRetry = startInventorySyncRetry();
        stopCatalogRetry = startCatalogSyncRetry();
        sessionTimer = window.setInterval(() => {
          void (async () => {
            const stillValid = await applyAuthoritativeSession();
            if (!stillValid || cancelled) return;
            await flushPendingCatalogChanges();
            await hydrateCloudCatalog();
            await flushPendingInventoryMovements();
            await hydrateOperationalData({ force: true });
          })().catch(() => {
            if (!cancelled) router.replace("/login");
          });
        }, SESSION_RECHECK_MS);
      } catch {
        if (!cancelled) router.replace("/login");
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
      stopOperationalPolling?.();
      stopInventoryRetry?.();
      stopCatalogRetry?.();
      if (sessionTimer) window.clearInterval(sessionTimer);
    };
  }, [pathname, router]);

  if (!currentUser || !accessAllowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white px-5 py-4 font-semibold text-gray-600 shadow-sm">
          Opening KitchenOps…
        </div>
      </main>
    );
  }

  return <AppShell currentUser={currentUser}>{children}</AppShell>;
}
