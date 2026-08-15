"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { isRouteAllowedForRole, type User } from "@/config/roles";
import { getCachedCloudSession, getCloudSession, type CloudSession } from "@/lib/cloudSession";
import { getCurrentUser, setCurrentUser } from "@/lib/currentUser";
import {
  flushPendingCatalogChanges,
  hydrateCloudCatalog,
  startCatalogSyncRetry,
} from "@/lib/cloud/catalogSync";
import {
  hydrateOperationalData,
  prepareOperationalWorkspaceForNoSites,
  startOperationalPolling,
} from "@/lib/cloud/operationalSync";
import {
  activeBusinessHasSites,
  switchBusinessWorkspace,
} from "@/lib/businessWorkspace";
import {
  flushPendingInventoryMovements,
  startInventoryPolling,
  startInventorySyncRetry,
} from "@/lib/inventoryStore";
import {
  getSessionIdentity,
  isRuntimeReadyFor,
  markRuntimeReady,
} from "@/lib/runtimeReadiness";
import { seedBusinessSitesCache, type BusinessSite } from "@/lib/useBusinessSites";

const SESSION_RECHECK_MS = 5 * 60 * 1000;

type ProtectedPageProps = {
  children: React.ReactNode;
};

export default function ProtectedPage({ children }: ProtectedPageProps) {
  const router = useRouter();
  const pathname = usePathname();

  const reusableSession = getCachedCloudSession();
  const reusableUser = reusableSession?.user ?? getCurrentUser();
  const canRenderImmediately = Boolean(
    reusableSession?.authenticated &&
      reusableUser &&
      !reusableSession.mustChangePin &&
      isRuntimeReadyFor(reusableSession) &&
      isRouteAllowedForRole(reusableUser.role, pathname)
  );

  // Normal in-app route changes should not paint a one-frame loading screen
  // before the effect gets a chance to reuse the already-authorised runtime.
  // Cold launches, changed identities and protected routes still block below.
  const [currentUser, setUser] = useState<User | null>(() =>
    canRenderImmediately ? reusableUser : null
  );
  const [accessAllowed, setAccessAllowed] = useState(() => canRenderImmediately);

  useEffect(() => {
    let cancelled = false;
    let stopOperationalPolling: (() => void) | undefined;
    let stopInventoryRetry: (() => void) | undefined;
    let stopInventoryPolling: (() => void) | undefined;
    let stopCatalogRetry: (() => void) | undefined;
    let sessionTimer: number | undefined;

    async function applyAuthoritativeSession(): Promise<CloudSession | null> {
      const session = await getCloudSession({ force: true });
      if (cancelled) return null;

      if (!session.authenticated || !session.user) {
        router.replace(session.needsOnboarding ? "/cloud-onboarding" : "/login");
        return null;
      }

      if (session.authType === "pin" && session.mustChangePin) {
        setAccessAllowed(false);
        router.replace("/set-pin");
        return null;
      }

      if (!isRouteAllowedForRole(session.user.role, pathname)) {
        setAccessAllowed(false);
        router.replace("/home");
        return null;
      }

      setCurrentUser(session.user);
      setUser(session.user);
      return session;
    }

    async function prepareWorkspace(session: CloudSession): Promise<boolean> {
      if (!session.business?.id) return false;

      const sitesResponse = await fetch("/api/cloud/sites", { cache: "no-store" });
      const sitesPayload = (await sitesResponse.json().catch(() => ({}))) as {
        sites?: BusinessSite[];
      };
      if (cancelled) return false;

      const sites = sitesResponse.ok ? sitesPayload.sites ?? [] : [];
      if (sitesResponse.ok) {
        seedBusinessSitesCache(session.business.id, false, sites);
      }

      const hasSites = !sitesResponse.ok || sites.length > 0;
      switchBusinessWorkspace(session.business.id, sitesResponse.ok && sites.length === 0);

      if (sitesResponse.ok && sites.length === 0) {
        prepareOperationalWorkspaceForNoSites(session.business.id);
      }

      return hasSites;
    }

    async function hydrateRuntime(session: CloudSession): Promise<void> {
      const hasSites = await prepareWorkspace(session);
      if (cancelled) return;

      // Push acknowledged-later edits before hydration so cloud snapshots cannot
      // overwrite optimistic local work.
      await flushPendingCatalogChanges();
      await hydrateCloudCatalog();

      // A brand-new business has no valid operational site yet. Keep first-site
      // onboarding clean and do not start inventory/operational sync until the
      // first site exists.
      if (hasSites) {
        await flushPendingInventoryMovements();
        await hydrateOperationalData();
      }
      if (cancelled) return;

      markRuntimeReady(session);
      setAccessAllowed(true);
    }

    function startBackgroundServices(): void {
      if (!activeBusinessHasSites()) {
        stopCatalogRetry = startCatalogSyncRetry();
        return;
      }

      const operationalPollMs =
        pathname === "/production" || pathname === "/home" || pathname === "/notifications"
          ? 3000
          : 12000;
      stopOperationalPolling = startOperationalPolling(operationalPollMs);
      stopInventoryRetry = startInventorySyncRetry();
      if (pathname === "/home" || pathname === "/notifications") {
        stopInventoryPolling = startInventoryPolling(3000);
      }
      stopCatalogRetry = startCatalogSyncRetry();
    }

    async function backgroundRefresh(session: CloudSession): Promise<void> {
      const hasSites = await prepareWorkspace(session);
      if (cancelled) return;

      await flushPendingCatalogChanges();
      await hydrateCloudCatalog();

      if (!hasSites) return;

      await flushPendingInventoryMovements();
      await hydrateOperationalData({ force: true });
    }

    async function loadSession(): Promise<void> {
      try {
        const cachedSession = getCachedCloudSession();
        const cachedUser = cachedSession?.user ?? getCurrentUser();
        const canReuseRuntime =
          Boolean(cachedSession?.authenticated && cachedUser) &&
          !cachedSession?.mustChangePin &&
          isRuntimeReadyFor(cachedSession) &&
          isRouteAllowedForRole(cachedUser!.role, pathname);

        // Once this exact signed-in workspace has completed its authoritative
        // first hydration, route changes render from the already-safe local cache
        // immediately. Cloud validation continues in the background below.
        if (canReuseRuntime && cachedUser && !cancelled) {
          setUser(cachedUser);
          setAccessAllowed(true);
        } else if (
          cachedUser &&
          isRouteAllowedForRole(cachedUser.role, pathname) &&
          !cancelled
        ) {
          setUser(cachedUser);
        }

        const session = await applyAuthoritativeSession();
        if (!session || cancelled) return;

        const authoritativeIdentity = getSessionIdentity(session);
        const cachedIdentity = getSessionIdentity(cachedSession);
        const identityChanged = Boolean(
          cachedIdentity && authoritativeIdentity && cachedIdentity !== authoritativeIdentity
        );

        if (!isRuntimeReadyFor(session) || identityChanged) {
          // New login, changed staff/site, or cold launch: keep the original
          // security boundary and hydrate before showing operational data.
          setAccessAllowed(false);
          await hydrateRuntime(session);
        } else {
          // Normal in-app navigation: never block the next screen on duplicate
          // session/site/catalog/operations hydration. Refresh quietly instead.
          setAccessAllowed(true);
          void backgroundRefresh(session).catch((error) => {
            console.warn("KitchenOps background refresh deferred:", error);
          });
        }

        if (cancelled) return;
        startBackgroundServices();

        sessionTimer = window.setInterval(() => {
          void (async () => {
            const stillValid = await applyAuthoritativeSession();
            if (!stillValid || cancelled) return;

            if (!isRuntimeReadyFor(stillValid)) {
              setAccessAllowed(false);
              await hydrateRuntime(stillValid);
              return;
            }

            await backgroundRefresh(stillValid);
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
      stopInventoryPolling?.();
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
