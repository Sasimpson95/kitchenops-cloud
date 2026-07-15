"use client";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import type {
  User,
} from "@/config/roles";

import {
  clearCurrentUser,
} from "@/lib/currentUser";

import CommandPalette from "@/components/CommandPalette";
import NotificationPopover from "@/components/NotificationPopover";

type AppShellProps = {
  children: React.ReactNode;
  currentUser: User;
};

const navItemsByRole = {
  chef: [
    {
      label: "Dashboard",
      href: "/home",
    },
    {
      label: "Recipes",
      href: "/recipes",
    },
    {
      label: "Waste",
      href: "/waste",
    },
  ],

  manager: [
    {
      label: "Dashboard",
      href: "/home",
    },
    {
      label: "Prep",
      href: "/production",
    },
    {
      label: "Recipes",
      href: "/recipes",
    },
    {
      label: "Products",
      href: "/products",
    },
    {
      label: "Inventory",
      href: "/inventory",
    },
    {
      label: "Transfers",
      href: "/transfers",
    },
    {
      label: "Purchasing",
      href: "/purchasing",
    },
    {
      label: "Waste",
      href: "/waste",
    },
    {
      label: "Stocktakes",
      href: "/stocktakes",
    },
    {
      label: "Storage Areas",
      href: "/storage-areas",
    },
    {
      label: "Handover",
      href: "/handover",
    },
    {
      label: "Reports",
      href: "/reports",
    },
  ],

  operations: [
    {
      label: "Dashboard",
      href: "/home",
    },
    {
      label: "Prep",
      href: "/production",
    },
    {
      label: "Recipes",
      href: "/recipes",
    },
    {
      label: "Products",
      href: "/products",
    },
    {
      label: "Inventory",
      href: "/inventory",
    },
    {
      label: "Transfers",
      href: "/transfers",
    },
    {
      label: "Purchasing",
      href: "/purchasing",
    },
    {
      label: "Waste",
      href: "/waste",
    },
    {
      label: "Stocktakes",
      href: "/stocktakes",
    },
    {
      label: "Storage Areas",
      href: "/storage-areas",
    },
    {
      label: "Handover",
      href: "/handover",
    },
    {
      label: "Reports",
      href: "/reports",
    },
    {
      label: "Settings",
      href: "/settings",
    },
  ],
};

export default function AppShell({
  children,
  currentUser,
}: AppShellProps) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const navItems =
    navItemsByRole[
      currentUser.role
    ];

  async function logout(): Promise<void> {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    clearCurrentUser();
    router.replace("/login");
    router.refresh();
  }

  function isActive(
    href: string
  ): boolean {
    if (href === "/home") {
      return pathname === "/home";
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 overflow-y-auto border-r border-gray-200 bg-white p-6 lg:block">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-800 font-bold text-white">
            K
          </div>

          <div>
            <p className="text-xl font-bold text-gray-950">
              KitchenOps
            </p>

            <p className="text-sm capitalize text-gray-500">
              {currentUser.role} mode
            </p>
          </div>
        </div>

        <nav className="mt-8 space-y-1 pb-28">
          {navItems.map(
            (item) => {
              const active =
                isActive(
                  item.href
                );

              return (
                <Link
                  key={`${currentUser.role}-${item.href}`}
                  href={
                    item.href
                  }
                  className={`block w-full rounded-xl px-4 py-3 text-left font-semibold transition ${
                    active
                      ? "bg-green-100 text-green-900"
                      : "text-gray-700 hover:bg-green-50 hover:text-green-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            }
          )}
        </nav>

        <div className="fixed bottom-6 left-6 w-[208px] rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-gray-500">
            Site
          </p>

          <p className="font-bold text-gray-900">
            {currentUser.site}
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-gray-950">
                KitchenOps
              </p>

              <p className="hidden text-xs text-gray-500 sm:block">
                Press Ctrl + K to search
              </p>
            </div>

            <div className="flex items-center gap-3">
              <NotificationPopover
                currentUser={
                  currentUser
                }
              />

              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-gray-900">
                  {currentUser.name}
                </p>

                <p className="text-xs capitalize text-gray-500">
                  {currentUser.role}
                  {" • "}
                  {currentUser.site}
                </p>
              </div>

              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {children}
      </div>

      <CommandPalette
        currentUser={
          currentUser
        }
      />
    </div>
  );
}
