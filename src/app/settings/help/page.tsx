"use client";

import Link from "next/link";
import { BookOpen, Boxes, ChefHat, ClipboardCheck, PackageSearch, PlayCircle, ShoppingCart, Trash2 } from "lucide-react";
import ProtectedPage from "@/components/ProtectedPage";
import { PageHeader, SectionCard } from "@/components/ui";
import Button from "@/components/ui/Button";
import { replayOnboardingTour } from "@/lib/onboardingTour";

const guides = [
  { title: "Products & stock", icon: PackageSearch, text: "Create products first, then assign suppliers, units, storage areas and stock levels." },
  { title: "Recipes", icon: ChefHat, text: "Build recipes from products so teams can follow one method and managers can review costs." },
  { title: "Purchasing", icon: ShoppingCart, text: "Create an order, send it, then receive the delivery to update inventory." },
  { title: "Prep", icon: ClipboardCheck, text: "Managers plan tomorrow’s prep. Chefs record production and managers approve completion." },
  { title: "Inventory & stocktakes", icon: Boxes, text: "Use inventory for live stock visibility and stocktakes for counted corrections." },
  { title: "Waste", icon: Trash2, text: "Record waste against a product, quantity and reason so stock and reporting remain accurate." },
];

export default function HelpPage() {
  return (
    <ProtectedPage>
      <main className="ko-page ko-enter">
        <div className="w-full max-w-6xl">
          <PageHeader eyebrow="Support" title="Help centre" description="A quick guide to the main KitchenOps workflows." />
          <div className="grid gap-4 md:grid-cols-2">
            {guides.map(({ title, text, icon: Icon }) => (
              <SectionCard key={title} title={title} action={<Icon className="h-5 w-5 text-violet-700" />}>
                <p className="text-sm leading-6 text-slate-600">{text}</p>
              </SectionCard>
            ))}
          </div>

          <section className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-violet-800" />
                <div>
                  <h2 className="font-bold text-violet-950">Replay the KitchenOps introduction</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-violet-800">
                    Run through the getting-started tour again for a reminder of the recommended setup order and day-to-day workflow.
                  </p>
                </div>
              </div>
              <Button onClick={replayOnboardingTour} className="shrink-0">Replay introduction</Button>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-6">
            <div className="flex items-start gap-3"><BookOpen className="mt-0.5 h-5 w-5 text-violet-800" /><div><h2 className="font-bold text-violet-950">Need to report something?</h2><p className="mt-1 text-sm leading-6 text-violet-800">Use the feedback screen to prepare a bug report, feature request or general comment.</p><Link href="/settings/feedback" className="mt-3 inline-flex font-semibold text-violet-900 underline decoration-violet-300 underline-offset-4">Open feedback</Link></div></div>
          </section>
        </div>
      </main>
    </ProtectedPage>
  );
}
