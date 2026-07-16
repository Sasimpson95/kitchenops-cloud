
"use client";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  Link2,
  MapPin,
  Plug,
  RefreshCw,
  Save,
  Settings2,
  ShoppingBag,
  Unplug,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import ProtectedPage from "@/components/ProtectedPage";

import type {
  User,
} from "@/config/roles";

import {
  getRecipes,
  subscribeToRecipeChanges,
} from "@/data/recipes";

import {
  getCurrentUser,
} from "@/lib/currentUser";

import {
  getRecipeCostingSetting,
  subscribeToRecipeCostingChanges,
} from "@/lib/recipeCostingStore";

import {
  getPosIntegrationSettings,
  savePosIntegrationSettings,
  subscribeToPosIntegrationChanges,
  type PosIntegrationSettings,
  type PosProvider,
} from "@/lib/posIntegrationStore";

const PROVIDERS: Array<{
  id: PosProvider;
  name: string;
  description: string;
}> = [
  {
    id: "none",
    name: "Not Selected",
    description:
      "Choose a provider when you are ready to connect.",
  },
  {
    id: "toast",
    name: "Toast",
    description:
      "Connect using Toast API access.",
  },
  {
    id: "square",
    name: "Square",
    description:
      "Connect locations and catalogue items from Square.",
  },
  {
    id: "lightspeed",
    name: "Lightspeed",
    description:
      "Connect restaurant sales and location data.",
  },
  {
    id: "revel",
    name: "Revel",
    description:
      "Connect sales and menu records from Revel.",
  },
  {
    id: "clover",
    name: "Clover",
    description:
      "Connect Clover merchant and item data.",
  },
  {
    id: "generic-api",
    name: "Generic API",
    description:
      "Use a custom REST API integration.",
  },
  {
    id: "csv",
    name: "CSV Import",
    description:
      "Import completed sales from a CSV export.",
  },
];

function statusLabel(
  status:
    PosIntegrationSettings["connectionStatus"]
): string {
  if (
    status === "connected"
  ) {
    return "Connected";
  }

  if (
    status === "configured"
  ) {
    return "Configured";
  }

  if (
    status === "error"
  ) {
    return "Connection Error";
  }

  return "Not Connected";
}

function providerLabel(
  provider: PosProvider
): string {
  return (
    PROVIDERS.find(
      (item) =>
        item.id === provider
    )?.name ??
    "Not Selected"
  );
}

function formatDate(
  value?: string
): string {
  if (!value) {
    return "Never";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-950">
            {value}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            {detail}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-800">
          {icon}
        </div>
      </div>
    </section>
  );
}

export default function PosIntegrationPage() {
  const router =
    useRouter();

  const [
    currentUser,
    setCurrentUser,
  ] = useState<User | null>(
    null
  );

  const [
    settings,
    setSettings,
  ] =
    useState<PosIntegrationSettings | null>(
      null
    );

  const [
    savedMessage,
    setSavedMessage,
  ] = useState("");

  const [
    version,
    setVersion,
  ] = useState(0);

  useEffect(() => {
    const user =
      getCurrentUser();

    if (!user) {
      router.replace(
        "/login"
      );
      return;
    }

    if (
      user.role !==
      "operations"
    ) {
      router.replace(
        "/home"
      );
      return;
    }

    setCurrentUser(user);
    setSettings(
      getPosIntegrationSettings()
    );
  }, [router]);

  useEffect(() => {
    function refresh(): void {
      setVersion(
        (value) =>
          value + 1
      );

      setSettings(
        getPosIntegrationSettings()
      );
    }

    const unsubscribePos =
      subscribeToPosIntegrationChanges(
        refresh
      );

    const unsubscribeRecipes =
      subscribeToRecipeChanges(
        refresh
      );

    const unsubscribeCosting =
      subscribeToRecipeCostingChanges(
        refresh
      );

    return () => {
      unsubscribePos();
      unsubscribeRecipes();
      unsubscribeCosting();
    };
  }, []);

  const menuMappings =
    useMemo(
      () =>
        getRecipes()
          .map((recipe) => ({
            recipe,
            setting:
              getRecipeCostingSetting(
                recipe.name
              ),
          }))
          .filter(
            ({ setting }) =>
              setting.recipeType ===
                "menu-item" &&
              setting.active
          )
          .sort(
            (first, second) =>
              first.recipe.name.localeCompare(
                second.recipe.name
              )
          ),
      [version]
    );

  const readyMappings =
    menuMappings.filter(
      ({ setting }) =>
        Boolean(
          setting.salesCode.trim()
        )
    );

  const missingMappings =
    menuMappings.filter(
      ({ setting }) =>
        !setting.salesCode.trim()
    );

  const mappedSites =
    settings?.siteMappings.filter(
      (mapping) =>
        Boolean(
          mapping.externalLocationId.trim() ||
          mapping.externalLocationName.trim()
        )
    ).length ?? 0;

  function updateSettings(
    updater: (
      current: PosIntegrationSettings
    ) => PosIntegrationSettings
  ): void {
    setSettings(
      (current) =>
        current
          ? updater(current)
          : current
    );

    setSavedMessage("");
  }

  function save(): void {
    if (!settings) {
      return;
    }

    const connectionStatus =
      settings.provider ===
      "none"
        ? "not-connected"
        : settings.provider ===
            "csv"
          ? "configured"
          : (
              settings.accountId.trim() ||
              settings.apiBaseUrl.trim()
            )
            ? "configured"
            : "not-connected";

    const saved =
      savePosIntegrationSettings({
        ...settings,
        connectionStatus,
      });

    setSettings(saved);

    setSavedMessage(
      "POS integration settings saved."
    );

    window.setTimeout(
      () =>
        setSavedMessage(""),
      2200
    );
  }

  if (
    !currentUser ||
    !settings
  ) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          Loading POS Integration...
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="font-semibold text-violet-800">
                Operations Only
              </p>

              <h1 className="mt-1 text-4xl font-bold text-gray-950">
                POS Integration
              </h1>

              <p className="mt-2 max-w-3xl text-gray-600">
                Prepare site and menu mappings now. Live sales imports can be connected later without redesigning KitchenOps.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {savedMessage && (
                <span className="text-sm font-semibold text-violet-800">
                  {savedMessage}
                </span>
              )}

              <button
                type="button"
                onClick={save}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900"
              >
                <Save size={18} />
                Save Settings
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Connection"
              value={statusLabel(
                settings.connectionStatus
              )}
              detail={providerLabel(
                settings.provider
              )}
              icon={
                settings.connectionStatus ===
                "connected" ? (
                  <Plug size={21} />
                ) : (
                  <Unplug size={21} />
                )
              }
            />

            <SummaryCard
              label="Sales Codes Ready"
              value={`${readyMappings.length}/${menuMappings.length}`}
              detail={`${missingMappings.length} menu item${
                missingMappings.length ===
                1
                  ? ""
                  : "s"
              } missing a code`}
              icon={
                <ShoppingBag
                  size={21}
                />
              }
            />

            <SummaryCard
              label="Site Mappings"
              value={`${mappedSites}/${settings.siteMappings.length}`}
              detail="POS locations mapped to KitchenOps"
              icon={
                <MapPin
                  size={21}
                />
              }
            />

            <SummaryCard
              label="Last Import"
              value={
                settings.lastImportAt
                  ? "Completed"
                  : "Never"
              }
              detail={formatDate(
                settings.lastImportAt
              )}
              icon={
                <Clock3
                  size={21}
                />
              }
            />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Plug
                  size={22}
                  className="text-violet-800"
                />

                <div>
                  <h2 className="text-xl font-bold text-gray-950">
                    Provider
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Select the POS provider you intend to connect.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {PROVIDERS.map(
                  (provider) => {
                    const selected =
                      settings.provider ===
                      provider.id;

                    return (
                      <button
                        type="button"
                        key={
                          provider.id
                        }
                        onClick={() =>
                          updateSettings(
                            (current) => ({
                              ...current,
                              provider:
                                provider.id,
                              connectionStatus:
                                provider.id ===
                                "none"
                                  ? "not-connected"
                                  : "configured",
                            })
                          )
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-violet-700 bg-violet-50"
                            : "border-gray-200 hover:bg-slate-50"
                        }`}
                      >
                        <p className="font-bold text-gray-950">
                          {
                            provider.name
                          }
                        </p>

                        <p className="mt-2 text-xs leading-5 text-gray-500">
                          {
                            provider.description
                          }
                        </p>
                      </button>
                    );
                  }
                )}
              </div>

              {settings.provider !==
                "none" &&
                settings.provider !==
                  "csv" && (
                  <div className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2">
                    <label>
                      <span className="text-sm font-semibold text-gray-700">
                        Account / Restaurant ID
                      </span>

                      <input
                        value={
                          settings.accountId
                        }
                        onChange={(
                          event
                        ) =>
                          updateSettings(
                            (
                              current
                            ) => ({
                              ...current,
                              accountId:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        placeholder="Add when API access is available"
                        className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                      />
                    </label>

                    <label>
                      <span className="text-sm font-semibold text-gray-700">
                        API Base URL
                      </span>

                      <input
                        value={
                          settings.apiBaseUrl
                        }
                        onChange={(
                          event
                        ) =>
                          updateSettings(
                            (
                              current
                            ) => ({
                              ...current,
                              apiBaseUrl:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        placeholder="Added during integration"
                        className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                      />
                    </label>

                    <p className="text-xs leading-5 text-gray-500 sm:col-span-2">
                      API secrets should eventually be stored securely on the server, never in the browser. These fields are placeholders for integration planning only.
                    </p>
                  </div>
                )}

              {settings.provider ===
                "csv" && (
                <div className="mt-6 rounded-2xl bg-blue-50 p-5">
                  <div className="flex items-start gap-3">
                    <Download
                      size={21}
                      className="mt-0.5 shrink-0 text-blue-800"
                    />

                    <div>
                      <p className="font-bold text-blue-950">
                        CSV Import Selected
                      </p>

                      <p className="mt-2 text-sm leading-6 text-blue-800">
                        The importer will be added once you have an example export from the POS provider.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Settings2
                  size={22}
                  className="text-violet-800"
                />

                <div>
                  <h2 className="text-xl font-bold text-gray-950">
                    Import Mode
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Keep the first integration safe while sales mappings are tested.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                  <input
                    type="radio"
                    name="importMode"
                    value="reporting-only"
                    checked={
                      settings.importMode ===
                      "reporting-only"
                    }
                    onChange={() =>
                      updateSettings(
                        (current) => ({
                          ...current,
                          importMode:
                            "reporting-only",
                        })
                      )
                    }
                    className="mt-1 h-5 w-5 accent-violet-800"
                  />

                  <div>
                    <p className="font-bold text-violet-950">
                      Reporting Only
                    </p>

                    <p className="mt-1 text-sm leading-6 text-violet-800">
                      Import sales for reports and validation without changing inventory.
                    </p>
                  </div>
                </label>

                <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4 opacity-65">
                  <p className="font-bold text-gray-700">
                    Theoretical Usage
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Coming later after menu mappings have been tested.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4 opacity-65">
                  <p className="font-bold text-gray-700">
                    Automatic Stock Deduction
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Disabled until prepared-item stock and refund rules are fully proven.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <MapPin
                size={22}
                className="text-violet-800"
              />

              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  Site Mapping
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Map each external POS location to the correct KitchenOps site.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {settings.siteMappings.map(
                (
                  mapping,
                  index
                ) => (
                  <div
                    key={
                      mapping.kitchenOpsSiteId
                    }
                    className="grid gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-[180px_1fr_1fr]"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        KitchenOps Site
                      </p>

                      <p className="mt-2 font-bold text-gray-950">
                        {
                          mapping.kitchenOpsSiteName
                        }
                      </p>
                    </div>

                    <label>
                      <span className="text-xs font-semibold text-gray-600">
                        POS Location Name
                      </span>

                      <input
                        value={
                          mapping.externalLocationName
                        }
                        onChange={(
                          event
                        ) =>
                          updateSettings(
                            (
                              current
                            ) => ({
                              ...current,
                              siteMappings:
                                current.siteMappings.map(
                                  (
                                    item,
                                    itemIndex
                                  ) =>
                                    itemIndex ===
                                    index
                                      ? {
                                          ...item,
                                          externalLocationName:
                                            event
                                              .target
                                              .value,
                                        }
                                      : item
                                ),
                            })
                          )
                        }
                        placeholder="Example: Beeston Store"
                        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-violet-800"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-semibold text-gray-600">
                        POS Location ID
                      </span>

                      <input
                        value={
                          mapping.externalLocationId
                        }
                        onChange={(
                          event
                        ) =>
                          updateSettings(
                            (
                              current
                            ) => ({
                              ...current,
                              siteMappings:
                                current.siteMappings.map(
                                  (
                                    item,
                                    itemIndex
                                  ) =>
                                    itemIndex ===
                                    index
                                      ? {
                                          ...item,
                                          externalLocationId:
                                            event
                                              .target
                                              .value,
                                        }
                                      : item
                                ),
                            })
                          )
                        }
                        placeholder="Added when connected"
                        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-violet-800"
                      />
                    </label>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div className="flex items-start gap-3">
                <Link2
                  size={22}
                  className="mt-0.5 text-violet-800"
                />

                <div>
                  <h2 className="text-xl font-bold text-gray-950">
                    Menu Mapping Readiness
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Finished menu recipes appear here. Preparations such as Wet Mix are excluded.
                  </p>
                </div>
              </div>

              {missingMappings.length >
                0 && (
                <Link
                  href="/recipes"
                  className="inline-flex items-center gap-2 rounded-xl border border-orange-200 px-4 py-2 font-semibold text-orange-800 hover:bg-orange-50"
                >
                  Add Missing Codes
                  <ArrowRight
                    size={17}
                  />
                </Link>
              )}
            </div>

            {menuMappings.length ===
            0 ? (
              <div className="mt-5 rounded-2xl bg-slate-50 p-10 text-center text-gray-500">
                No active finished menu-item recipes have been created yet.
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b text-sm text-gray-500">
                      <th className="px-3 py-3">
                        Recipe
                      </th>
                      <th className="px-3 py-3">
                        Sales Code
                      </th>
                      <th className="px-3 py-3">
                        Status
                      </th>
                      <th className="px-3 py-3 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {menuMappings.map(
                      ({
                        recipe,
                        setting,
                      }) => {
                        const ready =
                          Boolean(
                            setting.salesCode.trim()
                          );

                        return (
                          <tr
                            key={
                              recipe.name
                            }
                            className="border-b border-gray-100"
                          >
                            <td className="px-3 py-4">
                              <p className="font-bold text-gray-950">
                                {
                                  recipe.emoji
                                }{" "}
                                {
                                  recipe.name
                                }
                              </p>
                            </td>

                            <td className="px-3 py-4 font-mono text-sm font-semibold text-gray-700">
                              {setting.salesCode ||
                                "—"}
                            </td>

                            <td className="px-3 py-4">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                  ready
                                    ? "bg-violet-100 text-violet-800"
                                    : "bg-orange-100 text-orange-800"
                                }`}
                              >
                                {ready ? (
                                  <CheckCircle2
                                    size={14}
                                  />
                                ) : (
                                  <AlertTriangle
                                    size={14}
                                  />
                                )}

                                {ready
                                  ? "Ready"
                                  : "Missing Code"}
                              </span>
                            </td>

                            <td className="px-3 py-4 text-right">
                              <Link
                                href={`/recipes?recipe=${encodeURIComponent(
                                  recipe.name
                                )}`}
                                className="font-semibold text-violet-800 hover:underline"
                              >
                                Open Recipe
                              </Link>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Database
                  size={22}
                  className="text-violet-800"
                />

                <div>
                  <h2 className="text-xl font-bold text-gray-950">
                    Import History
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Import runs will appear here after the POS connection is built.
                  </p>
                </div>
              </div>

              {settings.importHistory.length ===
              0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center">
                  <RefreshCw
                    size={31}
                    className="mx-auto text-gray-400"
                  />

                  <p className="mt-3 font-semibold text-gray-700">
                    No imports yet
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Completed imports will show matched, unmatched and duplicate sales lines.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {settings.importHistory.map(
                    (record) => (
                      <div
                        key={
                          record.id
                        }
                        className="rounded-2xl bg-slate-50 p-4"
                      >
                        <p className="font-bold text-gray-950">
                          {formatDate(
                            record.startedAt
                          )}
                        </p>

                        <p className="mt-2 text-sm text-gray-500">
                          {record.importedOrders} orders • {record.matchedLines} matched • {record.unmatchedLines} unmatched
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <AlertTriangle
                  size={22}
                  className="text-orange-700"
                />

                <div>
                  <h2 className="text-xl font-bold text-gray-950">
                    Unmatched POS Items
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Sales codes that cannot be matched will appear here instead of being silently ignored.
                  </p>
                </div>
              </div>

              {settings.unmatchedItems.length ===
              0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center">
                  <CheckCircle2
                    size={31}
                    className="mx-auto text-violet-700"
                  />

                  <p className="mt-3 font-semibold text-gray-700">
                    No unmatched items
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    This section becomes active after the first sales import.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {settings.unmatchedItems.map(
                    (item) => (
                      <div
                        key={
                          item.id
                        }
                        className="rounded-2xl bg-orange-50 p-4"
                      >
                        <p className="font-bold text-orange-950">
                          {
                            item.externalName
                          }
                        </p>

                        <p className="mt-1 text-sm text-orange-800">
                          Code {item.salesCode} • Quantity {item.quantity}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </ProtectedPage>
  );
}
