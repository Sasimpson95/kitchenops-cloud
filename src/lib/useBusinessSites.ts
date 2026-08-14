"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getActiveBusinessId } from "@/lib/businessWorkspace";

export type BusinessSite = {
  id: string;
  name: string;
  active: boolean;
};

type CacheEntry = {
  sites: BusinessSite[];
  updatedAt: number;
};

const sitesCache = new Map<string, CacheEntry>();
const pendingLoads = new Map<string, Promise<BusinessSite[]>>();
const CACHE_TTL_MS = 60_000;

function cacheKey(businessId: string, includeArchived: boolean): string {
  return `${businessId || "unknown"}::${includeArchived ? "all" : "active"}`;
}

export function seedBusinessSitesCache(
  businessId: string,
  includeArchived: boolean,
  sites: BusinessSite[]
): void {
  if (!businessId) return;
  sitesCache.set(cacheKey(businessId, includeArchived), {
    sites,
    updatedAt: Date.now(),
  });
}

export function clearBusinessSitesCache(): void {
  sitesCache.clear();
  pendingLoads.clear();
}

async function loadSites(includeArchived: boolean): Promise<BusinessSite[]> {
  const businessId = getActiveBusinessId();
  const key = cacheKey(businessId, includeArchived);
  const existing = pendingLoads.get(key);
  if (existing) return existing;

  const request = fetch(
    `/api/cloud/sites?includeArchived=${includeArchived ? "true" : "false"}`,
    { cache: "no-store" }
  )
    .then(async (response) => {
      const result = (await response.json().catch(() => ({}))) as {
        sites?: BusinessSite[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error ?? "Sites could not be loaded.");
      }
      const sites = result.sites ?? [];
      seedBusinessSitesCache(businessId, includeArchived, sites);
      return sites;
    })
    .finally(() => {
      pendingLoads.delete(key);
    });

  pendingLoads.set(key, request);
  return request;
}

export function siteNameToId(siteName: string): string {
  return siteName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function useBusinessSites(includeArchived = false) {
  const businessId = getActiveBusinessId();
  const key = cacheKey(businessId, includeArchived);
  const initialCache = sitesCache.get(key);

  const [sites, setSites] = useState<BusinessSite[]>(initialCache?.sites ?? []);
  const [loading, setLoading] = useState(!initialCache);
  const [error, setError] = useState("");

  const refresh = useCallback(async (options?: { background?: boolean }) => {
    const activeBusinessId = getActiveBusinessId();
    const activeKey = cacheKey(activeBusinessId, includeArchived);
    const cached = sitesCache.get(activeKey);
    const background = options?.background ?? Boolean(cached);

    if (!background) setLoading(true);
    setError("");

    try {
      const nextSites = await loadSites(includeArchived);
      setSites(nextSites);
    } catch (caught) {
      if (!cached) setSites([]);
      setError(caught instanceof Error ? caught.message : "Sites could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => {
    const activeBusinessId = getActiveBusinessId();
    const activeKey = cacheKey(activeBusinessId, includeArchived);
    const cached = sitesCache.get(activeKey);

    if (cached) {
      setSites(cached.sites);
      setLoading(false);

      if (Date.now() - cached.updatedAt < CACHE_TTL_MS) return;
      void refresh({ background: true });
      return;
    }

    void refresh({ background: false });
  }, [includeArchived, refresh]);

  const siteNames = useMemo(() => sites.map((site) => site.name), [sites]);
  const options = useMemo(() => ["All Sites", ...siteNames], [siteNames]);

  return { sites, siteNames, options, loading, error, refresh: () => refresh({ background: false }) };
}
