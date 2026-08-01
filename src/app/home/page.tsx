"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChefHat,
  ClipboardCheck,
  Clock3,
  PackageCheck,
  Plus,
  ReceiptText,
  ShoppingCart,
  Trash2,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import ProtectedPage from "@/components/ProtectedPage";
import type { User } from "@/config/roles";
import type { ProductionItem } from "@/data/production";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/currentUser";
import {
  getSiteHandover,
  subscribeToHandoverChanges,
} from "@/lib/handoverStore";
import { getNotifications } from "@/lib/notificationStore";
import { getOrders } from "@/lib/orderStore";
import {
  approvePrepItem,
  completePrepAsManager,
  getPrepItems,
  submitPrepForApproval,
  subscribeToPrepChanges,
} from "@/lib/prepStore";
import { getStocktakes } from "@/lib/stocktakeStore";
import { getTransfers } from "@/lib/transferStore";
import { getWasteRecords } from "@/lib/wasteStore";

function getSiteId(siteName: string): string {
  return siteName.trim().toLowerCase().replace(/\s+/g, "-");
}

function isToday(value: string): boolean {
  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getTodayLabel(): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

type ActivityItem = {
  id: string;
  time: string;
  title: string;
  detail: string;
  siteName: string;
  href: string;
};

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  href: string;
  icon: ReactNode;
  tone: "violet" | "blue" | "orange" | "slate";
};

const metricTones = {
  violet: "bg-violet-50 text-violet-950 ring-violet-100",
  blue: "bg-blue-50 text-blue-950 ring-blue-100",
  orange: "bg-orange-50 text-orange-950 ring-orange-100",
  slate: "bg-white text-gray-950 ring-gray-200",
};

function MetricCard({ label, value, detail, href, icon, tone }: MetricCardProps) {
  return (
    <Link
      href={href}
      className={`group rounded-3xl p-5 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${metricTones[tone]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold opacity-75">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-3">{icon}</div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm font-semibold">
        <span className="opacity-70">{detail}</span>
        <ArrowRight size={17} className="transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

type PrepCardProps = {
  item: ProductionItem;
  currentUser: User;
  onChanged: () => void;
};

function PrepCard({ item, currentUser, onChanged }: PrepCardProps) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(item.produced > 0 ? item.produced : item.planned);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function save(): void {
    if (!Number.isFinite(amount) || amount <= 0 || busy) {
      setError("Enter how many batches were made.");
      return;
    }

    try {
      setBusy(true);
      setError("");

      if (currentUser.role === "chef") {
        submitPrepForApproval({
          id: item.id,
          produced: amount,
          chef: currentUser.name || "Chef",
        });
      } else if (item.status === "awaitingApproval") {
        approvePrepItem({
          id: item.id,
          approvedQuantity: amount,
          addRemainingToTomorrow: false,
          approvedBy: currentUser.name || "Manager",
        });
      } else {
        completePrepAsManager({
          id: item.id,
          produced: amount,
          addRemainingToTomorrow: false,
          completedBy: currentUser.name || "Manager",
        });
      }

      setEditing(false);
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Prep could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  const statusLabel =
    item.status === "approved"
      ? "Complete"
      : item.status === "awaitingApproval"
        ? "Awaiting approval"
        : "Planned";

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-gray-950">
            {item.emoji} {item.name}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Planned {item.planned}{item.produced > 0 ? ` • Made ${item.produced}` : ""}
          </p>
          <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
            item.status === "approved"
              ? "bg-violet-100 text-violet-800"
              : item.status === "awaitingApproval"
                ? "bg-orange-100 text-orange-800"
                : "bg-slate-100 text-gray-700"
          }`}>
            {statusLabel}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/recipes?recipe=${encodeURIComponent(item.name)}`}
            className="inline-flex min-h-11 items-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Recipe
          </Link>
          {item.status !== "approved" && (
            <button
              type="button"
              onClick={() => {
                setAmount(item.produced > 0 ? item.produced : item.planned);
                setEditing(true);
              }}
              className="min-h-11 rounded-xl bg-violet-800 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-900"
            >
              {currentUser.role === "chef"
                ? "Complete"
                : item.status === "awaitingApproval"
                  ? "Approve"
                  : "Complete"}
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <label className="block text-sm font-semibold text-gray-700">
            Amount made
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-violet-800"
            />
          </label>
          {error && <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="min-h-11 rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={save}
              className="min-h-11 rounded-xl bg-violet-800 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {currentUser.role === "chef" ? "Submit for approval" : "Save & update stock"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function QuickAction({ href, label, description, icon }: {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-24 items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md"
    >
      <div className="rounded-2xl bg-violet-50 p-3 text-violet-800">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-gray-950">{label}</p>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <ArrowRight size={18} className="text-violet-700 transition group-hover:translate-x-1" />
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedSite, setSelectedSite] = useState("All Sites");
  const [businessSites, setBusinessSites] = useState<string[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    setCurrentUser(user);
    setSelectedSite(user.role === "operations" ? "All Sites" : user.site);
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function loadSites(): Promise<void> {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("business_memberships")
        .select("business_id")
        .eq("auth_user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (!membership) return;

      const { data: sites } = await supabase
        .from("sites")
        .select("name")
        .eq("business_id", membership.business_id)
        .eq("active", true)
        .order("name");

      if (!cancelled) setBusinessSites((sites ?? []).map((site) => site.name));
    }

    void loadSites();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    const unsubscribePrep = subscribeToPrepChanges(refresh);
    const unsubscribeHandover = subscribeToHandoverChanges(refresh);
    return () => {
      unsubscribePrep();
      unsubscribeHandover();
    };
  }, []);

  const dashboard = useMemo(() => {
    if (!currentUser) return null;

    const siteNames =
      currentUser.role === "operations"
        ? selectedSite === "All Sites"
          ? businessSites
          : [selectedSite]
        : [currentUser.site];

    const siteIds = new Set(siteNames.map(getSiteId));
    const prep = getPrepItems().filter((item) => siteNames.includes(item.site));
    const todaysPrep = prep.filter((item) => item.day === "today");
    const completedPrep = todaysPrep.filter((item) => item.status === "approved").length;
    const awaitingPrep = todaysPrep.filter((item) => item.status === "awaitingApproval").length;

    const allOrders = getOrders().filter((order) => siteIds.has(order.siteId));
    const openOrders = allOrders.filter((order) => order.status === "Sent");

    const wasteToday = getWasteRecords().filter(
      (record) => siteIds.has(record.siteId) && isToday(record.createdAt)
    );
    const wasteValue = wasteToday.reduce((total, record) => total + record.wasteValue, 0);

    const notifications = getNotifications(
      currentUser.role === "operations" ? selectedSite : currentUser.site
    );
    const stockAlerts = notifications.filter(
      (notification) => notification.href === "/inventory"
    ).length;

    const handovers = siteNames.map((siteName) => ({
      siteName,
      ...getSiteHandover(siteName, "today"),
    }));

    const activity: ActivityItem[] = [
      ...wasteToday.map((record) => ({
        id: `waste-${record.id}`,
        time: record.createdAt,
        title: "Waste recorded",
        detail: `${record.quantity} ${record.inventoryUnit} ${record.productName}`,
        siteName: record.siteName,
        href: "/waste",
      })),
      ...getTransfers()
        .filter((transfer) => isToday(transfer.createdAt) && siteIds.has(transfer.fromSiteId))
        .map((transfer) => ({
          id: `transfer-${transfer.id}`,
          time: transfer.createdAt,
          title: "Stock transfer updated",
          detail: `${transfer.quantity} ${transfer.inventoryUnit} ${transfer.productName} to ${transfer.toSiteName}`,
          siteName: transfer.fromSiteName,
          href: "/transfers",
        })),
      ...allOrders
        .filter((order) => isToday(order.updatedAt))
        .map((order) => ({
          id: `order-${order.id}`,
          time: order.updatedAt,
          title: "Purchase order updated",
          detail: `${order.orderNumber} • ${order.supplierName} • ${order.status}`,
          siteName: order.siteName,
          href: "/purchasing",
        })),
      ...getStocktakes()
        .filter((stocktake) =>
          siteIds.has(stocktake.siteId) &&
          Boolean(stocktake.completedAt) &&
          isToday(stocktake.completedAt ?? stocktake.updatedAt)
        )
        .map((stocktake) => ({
          id: `stocktake-${stocktake.id}`,
          time: stocktake.completedAt ?? stocktake.updatedAt,
          title: "Stocktake completed",
          detail: stocktake.stocktakeNumber,
          siteName: stocktake.siteName,
          href: "/stocktakes",
        })),
    ].sort((first, second) => new Date(second.time).getTime() - new Date(first.time).getTime());

    return {
      siteNames,
      todaysPrep,
      completedPrep,
      awaitingPrep,
      openOrders,
      wasteToday,
      wasteValue,
      notifications,
      stockAlerts,
      handovers,
      activity,
    };
  }, [businessSites, currentUser, selectedSite, version]);

  if (!currentUser || !dashboard) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="font-semibold text-gray-600">Loading Dashboard...</p>
        </main>
      </ProtectedPage>
    );
  }

  const managerActions = [
    { href: "/production", label: "Plan prep", description: "Build tomorrow's production list", icon: <ChefHat size={22} /> },
    { href: "/purchasing", label: "New order", description: "Create or receive a supplier order", icon: <ShoppingCart size={22} /> },
    { href: "/waste", label: "Record waste", description: "Log waste and its true cost", icon: <Trash2 size={22} /> },
    { href: "/stocktakes", label: "Start stocktake", description: "Count stock by storage area", icon: <ClipboardCheck size={22} /> },
  ];

  const chefActions = [
    { href: "/recipes", label: "Open recipes", description: "View methods, yields and allergens", icon: <UtensilsCrossed size={22} /> },
    { href: "/waste", label: "Record waste", description: `Log waste for ${currentUser.site}`, icon: <Trash2 size={22} /> },
  ];

  const quickActions = currentUser.role === "chef" ? chefActions : managerActions;
  const visibleHandovers = dashboard.handovers.filter(
    (handover) => currentUser.role !== "chef" || handover.visibleToChefs
  );

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 px-4 py-5 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-7xl">
          <header className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-950 via-violet-900 to-purple-700 p-6 text-white shadow-lg sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-semibold text-violet-200">
                  {getGreeting()}{currentUser.name ? `, ${currentUser.name}` : ""}
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">KitchenOps</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100 sm:text-base">
                  {currentUser.role === "operations"
                    ? "Your kitchens, priorities and daily performance in one place."
                    : `Everything happening today at ${currentUser.site}.`}
                </p>
                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-violet-50">
                  <Clock3 size={16} /> {getTodayLabel()}
                </p>
              </div>

              {currentUser.role === "operations" && (
                <label className="block min-w-64">
                  <span className="mb-2 block text-sm font-semibold text-violet-100">Viewing</span>
                  <select
                    value={selectedSite}
                    onChange={(event) => setSelectedSite(event.target.value)}
                    className="w-full rounded-2xl border border-white/20 bg-white px-4 py-3 font-bold text-violet-950 outline-none focus:ring-4 focus:ring-white/20"
                  >
                    {["All Sites", ...businessSites].map((site) => (
                      <option key={site} value={site}>{site}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </header>

          {dashboard.siteNames.length === 0 ? (
            <section className="mt-6 rounded-3xl border border-dashed border-violet-300 bg-white p-8 text-center shadow-sm sm:p-12">
              <Boxes size={42} className="mx-auto text-violet-700" />
              <h2 className="mt-4 text-2xl font-black text-gray-950">Create your first site</h2>
              <p className="mx-auto mt-2 max-w-lg text-gray-600">
                Sites connect your prep, products, purchasing, inventory and reports.
              </p>
              <Link href="/settings/sites" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-bold text-white">
                <Plus size={19} /> Add first site
              </Link>
            </section>
          ) : (
            <>
              <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Today's Prep"
                  value={`${dashboard.completedPrep}/${dashboard.todaysPrep.length}`}
                  detail={dashboard.awaitingPrep > 0 ? `${dashboard.awaitingPrep} awaiting approval` : "Planned vs complete"}
                  href="/production"
                  icon={<ChefHat size={24} />}
                  tone="violet"
                />
                <MetricCard
                  label="Stock Attention"
                  value={String(dashboard.stockAlerts)}
                  detail="Low or out of stock"
                  href="/inventory"
                  icon={<Boxes size={24} />}
                  tone={dashboard.stockAlerts > 0 ? "orange" : "slate"}
                />
                <MetricCard
                  label="Open Orders"
                  value={String(dashboard.openOrders.length)}
                  detail="Waiting to be received"
                  href="/purchasing"
                  icon={<Truck size={24} />}
                  tone="blue"
                />
                <MetricCard
                  label="Waste Today"
                  value={formatMoney(dashboard.wasteValue)}
                  detail={`${dashboard.wasteToday.length} record${dashboard.wasteToday.length === 1 ? "" : "s"}`}
                  href="/waste"
                  icon={<Trash2 size={24} />}
                  tone="orange"
                />
              </section>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-violet-700">Priority</p>
                      <h2 className="mt-1 text-2xl font-black text-gray-950">Needs Your Attention</h2>
                    </div>
                    <Link href="/notifications" className="inline-flex items-center gap-2 font-bold text-violet-800">
                      View all <ArrowRight size={17} />
                    </Link>
                  </div>

                  {dashboard.notifications.length === 0 ? (
                    <div className="mt-5 flex items-center gap-4 rounded-2xl bg-violet-50 p-5 text-violet-950">
                      <CheckCircle2 size={28} className="shrink-0 text-violet-700" />
                      <div>
                        <p className="font-black">Everything looks good today.</p>
                        <p className="mt-1 text-sm text-violet-700">There are no outstanding alerts for this view.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {dashboard.notifications.slice(0, 5).map((notification) => (
                        <Link
                          href={notification.href}
                          key={notification.id}
                          className="flex items-start gap-4 rounded-2xl border border-orange-100 bg-orange-50 p-4 transition hover:border-orange-200"
                        >
                          <AlertTriangle size={21} className="mt-0.5 shrink-0 text-orange-700" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-orange-950">{notification.title}</p>
                            <p className="mt-1 text-sm text-orange-800">{notification.description}</p>
                          </div>
                          <ArrowRight size={18} className="shrink-0 text-orange-700" />
                        </Link>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                  <p className="text-sm font-bold uppercase tracking-wide text-violet-700">Shortcuts</p>
                  <h2 className="mt-1 text-2xl font-black text-gray-950">Quick Actions</h2>
                  <div className="mt-5 grid gap-3">
                    {quickActions.map((action) => (
                      <QuickAction key={action.href + action.label} {...action} />
                    ))}
                  </div>
                </section>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <ChefHat size={24} className="text-violet-800" />
                      <h2 className="text-2xl font-black text-gray-950">Today's Prep</h2>
                    </div>
                    <Link href="/production" className="font-bold text-violet-800">Open prep</Link>
                  </div>

                  {dashboard.todaysPrep.length === 0 ? (
                    <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-gray-500">
                      No prep is planned for today.
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {dashboard.todaysPrep.slice(0, 6).map((item) => (
                        <PrepCard
                          key={item.id}
                          item={item}
                          currentUser={currentUser}
                          onChanged={() => setVersion((value) => value + 1)}
                        />
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <ReceiptText size={24} className="text-blue-800" />
                      <h2 className="text-2xl font-black text-gray-950">Today's Handover</h2>
                    </div>
                    <Link href="/handover" className="font-bold text-violet-800">Open</Link>
                  </div>

                  {visibleHandovers.every((handover) => handover.notes.length === 0) ? (
                    <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-gray-500">
                      No handover notes have been added.
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {visibleHandovers.map((handover) => {
                        if (handover.notes.length === 0) return null;

                        return (
                          <div key={handover.siteName} className="rounded-2xl bg-blue-50 p-4">
                            {dashboard.siteNames.length > 1 && (
                              <p className="mb-2 text-xs font-black uppercase tracking-wide text-blue-700">{handover.siteName}</p>
                            )}
                            <div className="space-y-2">
                              {handover.notes.slice(0, 4).map((note, index) => (
                                <p key={`${handover.siteName}-${index}`} className="text-sm leading-6 text-blue-950">• {note}</p>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>

              <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-violet-700">Live operations</p>
                    <h2 className="mt-1 text-2xl font-black text-gray-950">Recent Activity</h2>
                  </div>
                  <Link href="/reports" className="inline-flex items-center gap-2 font-bold text-violet-800">
                    View reports <BarChart3 size={18} />
                  </Link>
                </div>

                {dashboard.activity.length === 0 ? (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-gray-500">
                    No activity has been recorded today.
                  </div>
                ) : (
                  <div className="mt-5 divide-y divide-gray-100">
                    {dashboard.activity.slice(0, 8).map((item) => (
                      <Link
                        href={item.href}
                        key={item.id}
                        className="grid gap-2 py-4 transition hover:bg-slate-50 sm:grid-cols-[70px_120px_1fr_auto] sm:items-center sm:px-3"
                      >
                        <p className="text-sm font-bold text-gray-500">{formatTime(item.time)}</p>
                        <p className="text-sm font-bold text-violet-800">{item.siteName}</p>
                        <div>
                          <p className="font-bold text-gray-950">{item.title}</p>
                          <p className="mt-1 text-sm text-gray-500">{item.detail}</p>
                        </div>
                        <ArrowRight size={18} className="text-violet-700" />
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {currentUser.role === "operations" && selectedSite === "All Sites" && businessSites.length > 1 && (
                <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center gap-3">
                    <PackageCheck size={24} className="text-violet-800" />
                    <h2 className="text-2xl font-black text-gray-950">Sites at a Glance</h2>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {businessSites.map((siteName) => {
                      const sitePrep = getPrepItems().filter((item) => item.site === siteName && item.day === "today");
                      const siteComplete = sitePrep.filter((item) => item.status === "approved").length;
                      const siteOpenOrders = getOrders().filter((order) => order.siteId === getSiteId(siteName) && order.status === "Sent").length;

                      return (
                        <button
                          type="button"
                          key={siteName}
                          onClick={() => setSelectedSite(siteName)}
                          className="rounded-2xl border border-gray-200 p-5 text-left transition hover:border-violet-300 hover:bg-violet-50"
                        >
                          <p className="text-lg font-black text-gray-950">{siteName}</p>
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="text-xs font-bold uppercase text-gray-500">Prep</p>
                              <p className="mt-1 text-xl font-black text-gray-950">{siteComplete}/{sitePrep.length}</p>
                            </div>
                            <div className="rounded-xl bg-blue-50 p-3">
                              <p className="text-xs font-bold uppercase text-blue-700">Orders</p>
                              <p className="mt-1 text-xl font-black text-blue-950">{siteOpenOrders}</p>
                            </div>
                          </div>
                          <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-violet-800">
                            Open site <ArrowRight size={16} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </ProtectedPage>
  );
}
