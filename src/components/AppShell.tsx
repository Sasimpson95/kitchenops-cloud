"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  LogOut,
  Menu,
  RefreshCw,
  X,
} from "lucide-react";

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

import {
  requestStaffSwitch,
} from "@/lib/sharedDevice";

import CommandPalette from "@/components/CommandPalette";
import NotificationPopover from "@/components/NotificationPopover";

type AppShellProps = {
  children: React.ReactNode;
  currentUser: User;
};

type NavigationItem = {
  label: string;
  href: string;
};

const navItemsByRole: Record<
  User["role"],
  NavigationItem[]
> = {
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

function Brand({
  currentUser,
}: {
  currentUser: User;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-800 font-bold text-white">
        K
      </div>

      <div className="min-w-0">
        <p className="truncate text-xl font-bold text-gray-950">
          KitchenOps
        </p>

        <p className="truncate text-sm capitalize text-gray-500">
          {currentUser.role} mode
        </p>
      </div>
    </div>
  );
}

export default function AppShell({
  children,
  currentUser,
}: AppShellProps) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const navItems =
    navItemsByRole[
      currentUser.role
    ];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [mobileMenuOpen]);

  async function logout(): Promise<void> {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    clearCurrentUser();
    setMobileMenuOpen(false);
    router.replace("/login");
    router.refresh();
  }


  async function switchUser(): Promise<void> {
    requestStaffSwitch();

    await fetch("/api/auth/logout", {
      method: "POST",
    });

    clearCurrentUser();
    setMobileMenuOpen(false);
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

  function NavigationLinks({
    mobile = false,
  }: {
    mobile?: boolean;
  }) {
    return (
      <nav
        aria-label={
          mobile
            ? "Mobile navigation"
            : "Main navigation"
        }
        className="space-y-1"
      >
        {navItems.map(
          (item) => {
            const active =
              isActive(
                item.href
              );

            return (
              <Link
                key={`${currentUser.role}-${item.href}-${mobile ? "mobile" : "desktop"}`}
                href={item.href}
                onClick={() => {
                  if (mobile) {
                    setMobileMenuOpen(false);
                  }
                }}
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
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 overflow-y-auto border-r border-gray-200 bg-white p-6 lg:flex lg:flex-col">
        <Brand
          currentUser={
            currentUser
          }
        />

        <div className="mt-8 flex-1 pb-6">
          <NavigationLinks />
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="truncate font-semibold text-gray-950">
              {currentUser.name}
            </p>

            <p className="mt-1 truncate text-sm capitalize text-gray-500">
              {currentUser.role}
              {" • "}
              {currentUser.site}
            </p>
          </div>

          {currentUser.role !== "operations" && (
            <button
              type="button"
              onClick={switchUser}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-800 px-4 py-3 font-semibold text-green-800 transition hover:bg-green-50"
            >
              <RefreshCw size={18} />
              Switch User
            </button>
          )}
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() =>
              setMobileMenuOpen(
                false
              )
            }
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="KitchenOps navigation"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,calc(100vw-3rem))] flex-col overflow-y-auto bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <Brand
                currentUser={
                  currentUser
                }
              />

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:bg-slate-50"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mt-7 flex-1">
              <NavigationLinks mobile />
            </div>

            <div className="mt-6 space-y-3 border-t border-gray-200 pt-5">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="truncate font-semibold text-gray-950">
                  {currentUser.name}
                </p>

                <p className="mt-1 truncate text-sm capitalize text-gray-500">
                  {currentUser.role}
                  {" • "}
                  {currentUser.site}
                </p>
              </div>

              {currentUser.role !== "operations" && (
                <button
                  type="button"
                  onClick={switchUser}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-800 px-4 py-3 font-semibold text-green-800 transition hover:bg-green-50"
                >
                  <RefreshCw size={18} />
                  Switch User
                </button>
              )}

              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:bg-slate-50"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(
                    true
                  )
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-800 transition hover:bg-slate-50 lg:hidden"
                aria-label="Open navigation menu"
                aria-expanded={
                  mobileMenuOpen
                }
              >
                <Menu size={23} />
              </button>

              <div className="min-w-0">
                <p className="truncate font-bold text-gray-950">
                  KitchenOps
                </p>

                <p className="truncate text-xs capitalize text-gray-500 sm:hidden">
                  {currentUser.role}
                  {" • "}
                  {currentUser.site}
                </p>

                <p className="hidden text-xs text-gray-500 sm:block">
                  Press Ctrl + K to search
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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

              {currentUser.role !== "operations" && (
                <button
                  type="button"
                  onClick={switchUser}
                  className="hidden rounded-xl border border-green-800 px-4 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-50 md:block"
                >
                  Switch User
                </button>
              )}

              <button
                type="button"
                onClick={logout}
                className="hidden rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-slate-50 sm:block"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="min-w-0 overflow-x-hidden">
          {children}
        </div>
      </div>

      <CommandPalette
        currentUser={
          currentUser
        }
      />
    </div>
  );
}
