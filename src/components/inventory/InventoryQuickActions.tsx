import Link from "next/link";

import {
  ClipboardCheck,
  PackagePlus,
  Repeat2,
  Trash2,
} from "lucide-react";

type InventoryQuickActionsProps = {
  selectedSite: string;
};

const actions = [
  {
    label: "Receive Delivery",
    href: "/purchasing",
    icon: PackagePlus,
  },
  {
    label: "Record Waste",
    href: "/waste",
    icon: Trash2,
  },
  {
    label: "Transfer Stock",
    href: "/transfers",
    icon: Repeat2,
  },
  {
    label: "Stocktakes",
    href: "/stocktakes",
    icon: ClipboardCheck,
  },
];

export default function InventoryQuickActions({
  selectedSite,
}: InventoryQuickActionsProps) {
  return (
    <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-gray-950">
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Common stock actions for{" "}
          {selectedSite}.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-slate-50 p-4 font-semibold text-gray-800 transition hover:-translate-y-0.5 hover:border-green-300 hover:bg-violet-50 hover:text-violet-900"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-800 shadow-sm">
                <Icon size={20} />
              </div>

              {action.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
