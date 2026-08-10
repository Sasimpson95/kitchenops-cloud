"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type BusinessSite = {
  id: string;
  name: string;
  active: boolean;
};

export function siteNameToId(siteName: string): string {
  return siteName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function useBusinessSites(includeArchived = false) {
  const [sites, setSites] = useState<BusinessSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/cloud/sites?includeArchived=${includeArchived ? "true" : "false"}`,
        { cache: "no-store" }
      );
      const result = (await response.json().catch(() => ({}))) as {
        sites?: BusinessSite[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Sites could not be loaded.");
      }

      setSites(result.sites ?? []);
    } catch (caught) {
      setSites([]);
      setError(caught instanceof Error ? caught.message : "Sites could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const siteNames = useMemo(() => sites.map((site) => site.name), [sites]);
  const options = useMemo(() => ["All Sites", ...siteNames], [siteNames]);

  return { sites, siteNames, options, loading, error, refresh };
}
