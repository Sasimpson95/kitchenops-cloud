"use client";

import { CheckCircle2, Rocket } from "lucide-react";
import ProtectedPage from "@/components/ProtectedPage";
import { PageHeader, SectionCard } from "@/components/ui";

const notes = [
  { version: "1.0.2 RC1", title: "Prep & Recipe Workflow Fixes", items: ["Complete today prep directly from the Prep page", "Outstanding prep alerts open Today instead of Tomorrow", "Recipe editing can add/remove products and preparation components"] },
  { version: "1.0.1 RC1", title: "Navigation Performance", items: ["Protected routes reuse the already-authorised in-memory workspace during normal navigation", "Duplicate session, site and full cloud hydration no longer block every page click", "Site lists are cached per business and refreshed quietly in the background", "Cold start, changed staff/site and first login still require authoritative hydration before operational data is shown"] },
  { version: "RC14", title: "First-login PIN Security", items: ["New staff must replace their temporary PIN on first sign-in", "Reset PIN generates a one-time temporary PIN and forces the same change flow", "Existing staff sessions are invalidated when a manager resets their PIN", "New PIN entry is confirmed before saving and cannot reuse the temporary PIN"] },
  { version: "RC13", title: "Chef Notification Centre Stability", items: ["Notification Centre keeps a stable React hook order for Chef sessions", "Fixes the page crash caused by React error #310", "RC12 live notification refresh and Chef access remain intact"] },
  { version: "RC12", title: "Chef Notification Refresh", items: ["Chef Notification Centre route is available to Chef sessions", "Low-stock and no-waste alerts refresh from authoritative site data", "Notification badge and list refresh while the app is open"] },
  { version: "RC11", title: "Live Dashboard Attention", items: ["Needs Your Attention now refreshes after authoritative cross-device operational hydration", "Chef Prep and Waste changes surface on an open Manager dashboard without F5", "Existing local Prep and Handover refresh behaviour is preserved"] },
  { version: "RC10", title: "Configurable Stocktake Units", items: ["Products explicitly choose which stocktake units staff can enter", "Milk-style products can enable Bottle and Litre without showing Each", "Case-based products can enable Case and Each", "Entered unit splits are preserved when reopening, reviewing and completing a stocktake"] },
  { version: "RC9", title: "Stocktake Pack & Loose Count Clarity", items: ["Pack conversions are shown clearly while counting", "Discrete packs support full packs plus loose Each counts", "Milk-style products show bottle counts with litre inventory equivalents", "Review and results show both physical count and inventory equivalent"] },
  { version: "RC7", title: "Stocktake Count Unit Hotfix", items: ["Stocktake now follows the configured Count Method", "Each-counted products use their physical purchase unit such as Bottle", "Pack-size conversion preserves base inventory quantities and recipe costing", "Stocktake variance values use the correct inventory-unit conversion"] },
  { version: "RC6", title: "Chef Sync Queue Hotfix", items: ["Chef devices no longer queue server-forbidden operational deletes", "Permanent permission rejections are removed instead of retried forever", "Prep and handover rollover remain read-only for Chef sessions"] },
  { version: "RC5", title: "Cross-device Prep Sync Hotfix", items: ["Server-revision based optimistic concurrency for Prep", "Atomic stale-write rejection without blocking refresh", "RC4 stale retry recovery", "Safe handling of edits made while a sync request is in flight"] },
  { version: "RC4", title: "Prep Reliability Hardening", items: ["Stale-write protection for cross-device Prep edits", "Automatic Prep and Dashboard cloud refresh", "Manager approval directly inside Prep", "Generated Android URL validation"] },
  { version: "RC3", title: "Release Security & Database Reconciliation", items: ["Next.js 16.3.0 security upgrade", "Zero production dependency vulnerabilities", "Supabase migration history reconciled", "Production schema drift eliminated"] },
  { version: "RC2", title: "Data Integrity & Security Hardening", items: ["Shared prep, orders, waste, stocktakes and transfers", "Atomic cross-device inventory movements", "Server-enforced site and role boundaries", "Staff PIN rate limiting and live session validation", "Shared recipes and storage assignments"] },
  { version: "Preview 8", title: "Launch Experience", items: ["First-run welcome", "Help centre", "Feedback tools", "About and version information", "Launch-facing Settings organisation"] },
  { version: "Preview 7", title: "Performance", items: ["Faster dashboard calculations", "Debounced product, recipe and inventory search", "More efficient inventory movement indexing"] },
  { version: "Preview 6C", title: "Premium Polish", items: ["Branded toast notifications", "Loading skeletons", "Improved confirmations and accessibility"] },
  { version: "Preview 5", title: "Personal Dashboard", items: ["Show, hide and reorder dashboard widgets", "Role-based dashboard defaults"] },
];

export default function ReleaseNotesPage() {
  return <ProtectedPage><main className="ko-page ko-enter"><div className="w-full max-w-4xl"><PageHeader eyebrow="Product updates" title="Release notes" description="The major improvements delivered on the road to KitchenOps v1.0." />
    <div className="space-y-5">{notes.map((note, index) => <SectionCard key={note.version} title={`${note.version} — ${note.title}`} action={index === 0 ? <Rocket className="h-5 w-5 text-violet-700" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}><ul className="space-y-2">{note.items.map(item => <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}</ul></SectionCard>)}</div>
  </div></main></ProtectedPage>;
}
