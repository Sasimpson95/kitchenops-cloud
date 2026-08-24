"use client";

import Link from "next/link";

import {
  Building2,
  ChevronRight,
  FileClock,
  HelpCircle,
  Info,
  MessageSquare,
  PlugZap,
  Settings2,
  Sparkles,
  Tags,
  Store,
  UserRoundCog,
  UsersRound,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import {
  KITCHENOPS_RELEASE_NAME,
  KITCHENOPS_VERSION,
} from "@/config/version";

const sections = [
  {
    title: "Product Setup",
    description:
      "Manage product categories, types and standard units.",
    href: "/settings/product-options",
    icon: Tags,
  },
  {
    title: "Business",
    description:
      "Business name, code, Operations users and stocktake settings.",
    href: "/settings/business",
    icon: Building2,
  },
  {
    title: "Account & Privacy",
    description:
      "Manage your Operations account and account deletion.",
    href: "/settings/account",
    icon: UserRoundCog,
  },
  {
    title: "Sites",
    description:
      "Create and manage the locations belonging to this business.",
    href: "/settings/sites",
    icon: Store,
  },
  {
    title: "Users",
    description:
      "Create Managers and Chefs, assign sites and reset PINs.",
    href: "/settings/users",
    icon: UsersRound,
  },
  {
    title: "Integrations",
    description:
      "Manage optional external services when integrations become available.",
    href: "/settings/integrations",
    icon: PlugZap,
  },
  {
    title: "Audit Log",
    description:
      "Review changes, logins and important activity across KitchenOps.",
    href: "/settings/audit-log",
    icon: FileClock,
  },
  {
    title: "Help Centre",
    description:
      "Read quick guides for the core KitchenOps workflows.",
    href: "/settings/help",
    icon: HelpCircle,
  },
  {
    title: "Send Feedback",
    description:
      "Report a bug, suggest a feature or share general feedback.",
    href: "/settings/feedback",
    icon: MessageSquare,
  },
  {
    title: "Release Notes",
    description:
      "See what has changed in recent KitchenOps previews.",
    href: "/settings/release-notes",
    icon: Sparkles,
  },
  {
    title: "About KitchenOps",
    description:
      "Version information, product purpose and Simpson Software details.",
    href: "/settings/about",
    icon: Info,
  },
];

export default function SettingsPage() {
  return (
    <ProtectedPage>
      <main className="ko-page ko-enter">
        <div className="w-full max-w-6xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
              <Settings2 size={24} />
            </div>

            <div>
              <p className="font-semibold text-violet-800">
                Operations
              </p>

              <h1 className="mt-1 text-4xl font-bold text-gray-950">
                Settings
              </h1>

              <p className="mt-2 max-w-2xl text-gray-600">
                Manage your business, sites, users, account, support and
                product information from one place.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-800 transition group-hover:bg-violet-100">
                    <Icon size={23} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-gray-950">
                      {section.title}
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      {section.description}
                    </p>
                  </div>

                  <ChevronRight
                    size={21}
                    className="shrink-0 text-gray-400 transition group-hover:translate-x-1 group-hover:text-violet-800"
                  />
                </Link>
              );
            })}
          </div>

          <section className="mt-6 flex flex-col gap-2 rounded-2xl border border-violet-200 bg-violet-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">
                Installed version
              </p>

              <h2 className="mt-1 text-xl font-bold text-violet-950">
                KitchenOps v{KITCHENOPS_VERSION}
              </h2>

              <p className="mt-1 text-sm text-violet-800">
                {KITCHENOPS_RELEASE_NAME}
              </p>
            </div>

            <span className="mt-2 inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-800 shadow-sm sm:mt-0">
              Launch preparation release
            </span>
          </section>

          <section className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white/70 p-6">
            <h2 className="font-bold text-gray-950">
              Administration is now grouped here
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              The main sidebar is reserved for day-to-day kitchen
              operations. Business setup, account management, people
              management and integrations now live inside Settings.
            </p>
          </section>
        </div>
      </main>
    </ProtectedPage>
  );
}