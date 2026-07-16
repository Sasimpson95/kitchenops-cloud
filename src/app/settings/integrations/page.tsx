"use client";

import Link from "next/link";

import {
  CalendarDays,
  ChevronRight,
  PlugZap,
  ReceiptText,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";

const integrations = [
  {
    title: "Reserva",
    description:
      "Bookings, cover forecasts and future prep-planning integration.",
    href: "/integrations/reserva",
    status: "Coming soon",
    icon: CalendarDays,
  },
  {
    title: "POS Integration",
    description:
      "Sales-code readiness, site mappings and future sales imports.",
    href: "/integrations/pos",
    status: "Setup ready",
    icon: ReceiptText,
  },
];

export default function SettingsIntegrationsPage() {
  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/settings"
            className="text-sm font-semibold text-violet-800 hover:underline"
          >
            Settings
          </Link>

          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
              <PlugZap size={24} />
            </div>

            <div>
              <h1 className="text-4xl font-bold text-gray-950">
                Integrations
              </h1>

              <p className="mt-2 text-gray-600">
                Configure external systems connected to KitchenOps.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {integrations.map((integration) => {
              const Icon = integration.icon;

              return (
                <Link
                  key={integration.href}
                  href={integration.href}
                  className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-800">
                      <Icon size={23} />
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-gray-600">
                      {integration.status}
                    </span>
                  </div>

                  <div className="mt-5 flex items-end gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-bold text-gray-950">
                        {integration.title}
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {integration.description}
                      </p>
                    </div>

                    <ChevronRight
                      size={21}
                      className="shrink-0 text-gray-400 transition group-hover:translate-x-1 group-hover:text-violet-800"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </ProtectedPage>
  );
}
