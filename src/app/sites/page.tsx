"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin, Plus } from "lucide-react";
import ProtectedPage from "@/components/ProtectedPage";
import { createClient } from "@/lib/supabase/client";

type Site = { id: string; name: string; stocktake_frequency: string; active: boolean };

export default function SitesPage() {
  const [businessId, setBusinessId] = useState("");
  const [sites, setSites] = useState<Site[]>([]);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: membership, error: membershipError } = await supabase.from("business_memberships").select("business_id").eq("auth_user_id", user.id).eq("active", true).single();
    if (membershipError) { setError(membershipError.message); setLoading(false); return; }
    setBusinessId(membership.business_id);
    const { data, error: sitesError } = await supabase.from("sites").select("id, name, stocktake_frequency, active").eq("business_id", membership.business_id).order("name");
    if (sitesError) setError(sitesError.message); else setSites(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function addSite() {
    if (!name.trim() || !businessId) return;
    setSaving(true); setError("");
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("create_kitchenops_site", { requested_business_id: businessId, site_name: name.trim(), frequency });
    if (rpcError) setError(rpcError.message); else { setName(""); await load(); }
    setSaving(false);
  }

  async function toggle(site: Site) {
    const supabase = createClient();
    const { error: updateError } = await supabase.from("sites").update({ active: !site.active }).eq("id", site.id);
    if (updateError) setError(updateError.message); else await load();
  }

  return <ProtectedPage><main className="min-h-screen bg-slate-100 p-4 sm:p-8"><div className="mx-auto max-w-6xl">
    <p className="font-semibold text-violet-800">Operations</p><h1 className="mt-1 text-4xl font-bold text-gray-950">Sites</h1><p className="mt-2 text-gray-600">Create and manage the sites belonging to this business.</p>
    <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Add Site</h2><div className="mt-5 grid gap-4 sm:grid-cols-[1fr_220px_auto]"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Site name" className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"/><select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="rounded-xl border border-gray-300 px-4 py-3"><option value="weekly">Weekly stocktake</option><option value="fortnightly">Fortnightly stocktake</option><option value="monthly">Monthly stocktake</option></select><button onClick={addSite} disabled={saving} className="flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white disabled:opacity-60">{saving?<Loader2 className="animate-spin" size={18}/>:<Plus size={18}/>}Add Site</button></div>{error&&<p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}</section>
    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Business Sites</h2>{loading?<p className="mt-5 text-gray-500">Loading sites...</p>:<div className="mt-5 grid gap-4 sm:grid-cols-2">{sites.map((site)=><article key={site.id} className="rounded-2xl bg-slate-50 p-5"><div className="flex items-start justify-between gap-4"><div><MapPin className="text-violet-800"/><h3 className="mt-3 text-xl font-bold">{site.name}</h3><p className="mt-1 text-sm text-gray-500 capitalize">{site.stocktake_frequency} stocktakes</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${site.active?"bg-violet-100 text-violet-800":"bg-gray-200 text-gray-700"}`}>{site.active?"Active":"Archived"}</span></div><button onClick={()=>toggle(site)} className="mt-5 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold">{site.active?"Archive":"Restore"}</button></article>)}</div>}</section>
  </div></main></ProtectedPage>;
}
