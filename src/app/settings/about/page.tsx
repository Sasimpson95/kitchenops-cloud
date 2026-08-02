"use client";

import Link from "next/link";
import { ExternalLink, Info, ShieldCheck } from "lucide-react";
import ProtectedPage from "@/components/ProtectedPage";
import { KITCHENOPS_RELEASE_NAME, KITCHENOPS_VERSION } from "@/config/version";
import { PageHeader, SectionCard, StatusBadge } from "@/components/ui";

export default function AboutPage() {
  return (
    <ProtectedPage>
      <main className="ko-page ko-enter">
        <div className="w-full max-w-4xl">
          <PageHeader eyebrow="Simpson Software" title="About KitchenOps" description="Kitchen operations software built for practical day-to-day hospitality work." />
          <SectionCard>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-violet-800 text-3xl font-black text-white shadow-lg shadow-violet-900/20">K</div>
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h2 className="text-2xl font-bold text-slate-950">KitchenOps</h2><StatusBadge status="Preview" /></div><p className="mt-2 text-slate-600">Version {KITCHENOPS_VERSION}</p><p className="mt-1 text-sm font-semibold text-violet-800">{KITCHENOPS_RELEASE_NAME}</p></div>
            </div>
          </SectionCard>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <SectionCard title="Purpose" action={<Info className="h-5 w-5 text-violet-700" />}><p className="text-sm leading-6 text-slate-600">KitchenOps helps hospitality teams reduce paperwork, improve communication and manage stock, prep, orders, waste and handovers in one place.</p></SectionCard>
            <SectionCard title="Privacy & terms" action={<ShieldCheck className="h-5 w-5 text-violet-700" />}><p className="text-sm leading-6 text-slate-600">Formal public legal pages will be linked here before production release.</p><p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-700">Required before v1.0 production</p></SectionCard>
          </div>
          <nav className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/settings/release-notes" className="flex min-h-12 items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50">Release notes <ExternalLink className="h-4 w-4" /></Link>
            <Link href="/settings/help" className="flex min-h-12 items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50">Help centre <ExternalLink className="h-4 w-4" /></Link>
          </nav>
          <p className="mt-8 text-center text-sm text-slate-500">© 2026 Simpson Software. All rights reserved.</p>
        </div>
      </main>
    </ProtectedPage>
  );
}
