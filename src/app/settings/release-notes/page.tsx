"use client";

import { CheckCircle2, Rocket } from "lucide-react";
import ProtectedPage from "@/components/ProtectedPage";
import { PageHeader, SectionCard } from "@/components/ui";

const notes = [
  {
    version: "1.0.6",
    title: "Production Release",
    items: [
      "Light, Dark and System appearance modes across KitchenOps",
      "30-day trial access with account-safe entitlement handling",
      "Operations user invitations and account-deletion controls",
      "Improved first-login guidance and launch experience",
      "Supplier order emails with clear delivery-site information",
      "Faster, smoother navigation and dashboard updates",
      "Improved Prep Planner, Recipes, Products, Inventory, Purchasing, Waste, Stocktakes, Transfers and Handover workflows",
      "Product stock quantities display cleanly without floating-point noise",
    ],
  },
  {
    version: "1.0",
    title: "Core Kitchen Operations",
    items: [
      "Multi-site kitchen management",
      "Prep planning and production tracking",
      "Recipe costing and product management",
      "Inventory, deliveries and stock movements",
      "Purchasing and supplier management",
      "Waste recording and completion tracking",
      "Stocktakes and storage areas",
      "Shift handovers, reports and operational insights",
      "Role-based Operations, Manager and Chef access",
    ],
  },
];

export default function ReleaseNotesPage() {
  return (
    <ProtectedPage>
      <main className="ko-page ko-enter">
        <div className="w-full max-w-4xl">
          <PageHeader
            eyebrow="Product updates"
            title="Release notes"
            description="What is included in the current KitchenOps production release."
          />

          <div className="space-y-5">
            {notes.map((note, index) => (
              <SectionCard
                key={note.version}
                title={`${note.version} - ${note.title}`}
                action={index === 0 ? <Rocket className="h-5 w-5 text-violet-700" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              >
                <ul className="space-y-2">
                  {note.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ))}
          </div>
        </div>
      </main>
    </ProtectedPage>
  );
}
