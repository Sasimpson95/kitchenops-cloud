"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type BusinessSite = {
  id: string;
  name: string;
  active: boolean;
};

export function siteNameToId(siteName: string): string {
  return siteName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function useBusinessSites(includeArchived = false) {
  const [sites, setSites] = useState<BusinessSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSites([]);
        return;
      }
      const { data: membership, error: membershipError } = await supabase
        .from("business_memberships")
        .select("business_id")
        .eq("auth_user_id", user.id)
        .eq("active", true)
        .maybeSingle();
      if (membershipError) throw membershipError;
      if (!membership?.business_id) {
        setSites([]);
        return;
      }
      let query = supabase
        .from("sites")
        .select("id, name, active")
        .eq("business_id", membership.business_id)
        .order("name");
      if (!includeArchived) query = query.eq("active", true);
      const { data, error: sitesError } = await query;
      if (sitesError) throw sitesError;
      setSites((data ?? []) as BusinessSite[]);
    } catch (caught) {
      setSites([]);
      setError(caught instanceof Error ? caught.message : "Sites could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => { void refresh(); }, [refresh]);

  const siteNames = useMemo(() => sites.map((site) => site.name), [sites]);
  const options = useMemo(() => ["All Sites", ...siteNames], [siteNames]);

  return { sites, siteNames, options, loading, error, refresh };
}
