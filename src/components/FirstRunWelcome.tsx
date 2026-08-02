"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Boxes, ChefHat, ClipboardCheck, PackageSearch, X } from "lucide-react";
import Button from "@/components/ui/Button";

const STORAGE_KEY = "kitchenops-welcome-complete-v1";

const highlights = [
  { title: "Stock", description: "Keep products, inventory and stocktakes together.", icon: PackageSearch },
  { title: "Prep", description: "Plan tomorrow and keep today’s kitchen focused.", icon: ClipboardCheck },
  { title: "Recipes", description: "Give teams one reliable place for recipes and costs.", icon: ChefHat },
  { title: "Operations", description: "Connect ordering, waste, handovers and reporting.", icon: Boxes },
];

export default function FirstRunWelcome() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname !== "/login" && pathname !== "/") return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== "yes") setOpen(true);
    } catch {
      setOpen(false);
    }
  }, [pathname]);

  function finish() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "yes");
    } catch {
      // The welcome can still close when storage is unavailable.
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="kitchenops-welcome-title"
        className="max-h-[100dvh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-2xl sm:max-w-3xl sm:rounded-[2rem] sm:p-9"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-800 text-xl font-black text-white">K</div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">Welcome</p>
              <h1 id="kitchenops-welcome-title" className="text-3xl font-bold tracking-tight text-slate-950">Run your kitchen with confidence.</h1>
            </div>
          </div>
          <button type="button" onClick={finish} aria-label="Close welcome" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          KitchenOps brings the daily work of hospitality teams into one clear workspace, from prep and recipes to stock, purchasing, waste and handovers.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {highlights.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-800"><Icon className="h-5 w-5" /></span>
                <div><h2 className="font-bold text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">You will only see this welcome on the first launch of this device.</p>
          <Button onClick={finish} size="lg">Get started</Button>
        </div>
      </section>
    </div>
  );
}
