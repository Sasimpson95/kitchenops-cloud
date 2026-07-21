import {
  Boxes,
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  Lightbulb,
  PackageSearch,
  Repeat2,
  ShoppingCart,
  Trash2,
  UtensilsCrossed,
  ChefHat,
} from "lucide-react";

import type { ReportTab } from "@/components/reports/types";

type ReportsTabsProps = {
  activeTab: ReportTab;
  onChange: (tab: ReportTab) => void;
};

const tabs: Array<{ id: ReportTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "operations", label: "Executive", icon: LayoutDashboard },
  { id: "insights", label: "Insights", icon: Lightbulb },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "purchasing", label: "Purchasing", icon: ShoppingCart },
  { id: "recipes", label: "Recipe Costing", icon: ChefHat },
  { id: "production", label: "Prep & Production", icon: UtensilsCrossed },
  { id: "waste", label: "Waste", icon: Trash2 },
  { id: "transfers", label: "Transfers", icon: Repeat2 },
  { id: "stocktakes", label: "Stocktakes", icon: ClipboardCheck },
  { id: "products", label: "Products", icon: PackageSearch },
  { id: "sites", label: "Sites", icon: Building2 },
];

export default function ReportsTabs({ activeTab, onChange }: ReportsTabsProps) {
  return (
    <div className="mt-8 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm print:hidden">
      <div className="flex min-w-max gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-violet-800 text-white"
                  : "text-gray-600 hover:bg-violet-50 hover:text-violet-800"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
