"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock3,
  PackageCheck,
  PoundSterling,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ProtectedPage from "@/components/ProtectedPage";

import type {
  User,
} from "@/config/roles";

import type {
  Product,
} from "@/data/products";

import type {
  Stocktake,
} from "@/lib/stocktakeStore";

import type {
  ProductionItem,
} from "@/data/production";

import {
  getCurrentUser,
} from "@/lib/currentUser";

import {
  getSiteHandover,
  subscribeToHandoverChanges,
} from "@/lib/handoverStore";

import {
  getNotifications,
} from "@/lib/notificationStore";

import {
  getOrders,
} from "@/lib/orderStore";

import {
  addPrepItem,
  approvePrepItem,
  completePrepAsManager,
  getPrepItems,
  submitPrepForApproval,
  subscribeToPrepChanges,
} from "@/lib/prepStore";

import {
  getProducts,
} from "@/lib/productStore";

import {
  getProductStock,
} from "@/lib/inventoryStore";

import {
  getStocktakes,
} from "@/lib/stocktakeStore";

import {
  getTransfers,
} from "@/lib/transferStore";

import {
  getWasteRecords,
} from "@/lib/wasteStore";

const SITE_NAMES = [
  "Beeston",
  "City",
  "Sherwood",
  "Bakery",
];

const SITE_OPTIONS = [
  "All Sites",
  ...SITE_NAMES,
];

function getSiteId(
  siteName: string
): string {
  return siteName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function isToday(
  value: string
): boolean {
  const date =
    new Date(value);

  const today =
    new Date();

  return (
    date.getFullYear() ===
      today.getFullYear() &&
    date.getMonth() ===
      today.getMonth() &&
    date.getDate() ===
      today.getDate()
  );
}

function formatTime(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function formatDate(
  value?: string
): string {
  if (!value) {
    return "No completed stocktake";
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
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatMoney(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-GB",
    {
      style: "currency",
      currency: "GBP",
    }
  ).format(value);
}

function getGreeting(): string {
  const hour =
    new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function getStocktakeValue(
  stocktake: Stocktake | undefined,
  products: Product[]
): number {
  if (!stocktake) {
    return 0;
  }

  return stocktake.items.reduce(
    (total, item) => {
      const product =
        products.find(
          (candidate) =>
            candidate.id ===
            item.productId
        );

      if (
        !product ||
        product.purchaseQuantity <= 0
      ) {
        return total;
      }

      const counted =
        item.countedQuantity ??
        item.expectedQuantity;

      const unitCost =
        product.price /
        product.purchaseQuantity;

      return (
        total +
        counted * unitCost
      );
    },
    0
  );
}

function getCompletion(
  stocktake: Stocktake | undefined
): number {
  if (!stocktake) {
    return 0;
  }

  if (
    stocktake.items.length === 0
  ) {
    return 0;
  }

  const counted =
    stocktake.items.filter(
      (item) =>
        item.countedQuantity !==
        null
    ).length;

  return Math.round(
    (counted /
      stocktake.items.length) *
      100
  );
}

type PrepItemCardProps = {
  item: ProductionItem;
  currentUser: User;
  allowAddTomorrow: boolean;
  onChanged: () => void;
};

function PrepItemCard({
  item,
  currentUser,
  allowAddTomorrow,
  onChanged,
}: PrepItemCardProps) {
  const [
    showAmount,
    setShowAmount,
  ] = useState(false);

  const [
    amount,
    setAmount,
  ] = useState(
    item.produced > 0
      ? item.produced
      : item.planned
  );

  const [
    addRemaining,
    setAddRemaining,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    busy,
    setBusy,
  ] = useState(false);

  function openComplete(): void {
    setAmount(
      item.produced > 0
        ? item.produced
        : item.planned
    );

    setAddRemaining(
      false
    );

    setActionError("");
    setShowAmount(true);
  }

  function confirmAmount(): void {
    if (
      busy ||
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      setActionError(
        "Enter how many batches were made."
      );
      return;
    }

    try {
      setBusy(true);
      setActionError("");

      if (
        currentUser.role ===
        "chef"
      ) {
        submitPrepForApproval({
          id: item.id,
          produced: amount,
          chef:
            currentUser.name ||
            "Chef",
        });
      } else if (
        item.status ===
        "awaitingApproval"
      ) {
        approvePrepItem({
          id: item.id,
          approvedQuantity:
            amount,
          addRemainingToTomorrow:
            addRemaining,
          approvedBy:
            currentUser.name ||
            "Manager",
        });
      } else {
        completePrepAsManager({
          id: item.id,
          produced: amount,
          addRemainingToTomorrow:
            addRemaining,
          completedBy:
            currentUser.name ||
            "Manager",
        });
      }

      setShowAmount(false);
      onChanged();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Prep could not be completed."
      );
    } finally {
      setBusy(false);
    }
  }

  function addToTomorrow(): void {
    if (busy) {
      return;
    }

    try {
      setBusy(true);
      setActionError("");

      addPrepItem({
        site: item.site,
        name: item.name,
        emoji: item.emoji,
        planned:
          Math.max(
            item.planned -
              item.produced,
            1
          ),
        day: "tomorrow",
      });

      onChanged();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Prep could not be added to tomorrow."
      );
    } finally {
      setBusy(false);
    }
  }

  const actionLabel =
    currentUser.role ===
      "chef"
      ? "Complete"
      : item.status ===
          "awaitingApproval"
        ? "Approve"
        : "Complete";

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h3 className="font-bold text-gray-950">
            {item.emoji}{" "}
            {item.name}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Planned x
            {item.planned}
            {item.produced > 0
              ? ` • Made x${item.produced}`
              : ""}
          </p>

          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              item.status ===
              "approved"
                ? "bg-violet-100 text-violet-800"
                : item.status ===
                    "awaitingApproval"
                  ? "bg-orange-100 text-orange-800"
                  : "bg-slate-100 text-gray-700"
            }`}
          >
            {item.status ===
            "approved"
              ? "Complete"
              : item.status ===
                  "awaitingApproval"
                ? "Awaiting manager approval"
                : "Planned"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/recipes?recipe=${encodeURIComponent(
              item.name
            )}`}
            className="rounded-xl border border-violet-800 px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-50"
          >
            Recipe
          </Link>

          {item.status !==
            "approved" && (
            <button
              type="button"
              onClick={
                openComplete
              }
              disabled={busy}
              className="rounded-xl bg-violet-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-900 disabled:opacity-50"
            >
              {actionLabel}
            </button>
          )}

          {allowAddTomorrow &&
            item.status !==
              "approved" && (
            <button
              type="button"
              onClick={
                addToTomorrow
              }
              disabled={busy}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Add to Tomorrow
            </button>
          )}
        </div>
      </div>

      {showAmount && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">
              Amount made
            </span>

            <input
              type="number"
              min={0.01}
              step="0.01"
              value={amount}
              onChange={(
                event
              ) =>
                setAmount(
                  Number(
                    event.target
                      .value
                  )
                )
              }
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
            />
          </label>

          {currentUser.role !==
            "chef" &&
            amount <
              item.planned && (
              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl bg-white p-3">
                <input
                  type="checkbox"
                  checked={
                    addRemaining
                  }
                  onChange={(
                    event
                  ) =>
                    setAddRemaining(
                      event.target
                        .checked
                    )
                  }
                  className="h-5 w-5 accent-violet-800"
                />

                <span className="text-sm font-semibold text-gray-700">
                  Add remaining{" "}
                  {Math.max(
                    item.planned -
                      amount,
                    0
                  )}{" "}
                  to tomorrow
                </span>
              </label>
            )}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                setShowAmount(
                  false
                )
              }
              className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={
                confirmAmount
              }
              disabled={busy}
              className="rounded-xl bg-violet-800 px-4 py-2 font-semibold text-white hover:bg-violet-900 disabled:opacity-50"
            >
              {currentUser.role ===
              "chef"
                ? "Submit for Approval"
                : item.status ===
                    "awaitingApproval"
                  ? "Approve & Update Stock"
                  : "Complete & Update Stock"}
            </button>
          </div>
        </div>
      )}

      {actionError && (
        <p className="mt-3 text-sm font-semibold text-red-700">
          {actionError}
        </p>
      )}
    </article>
  );
}

function PrepListCard({
  title,
  items,
  currentUser,
  allowAddTomorrow,
  emptyMessage,
  onChanged,
}: {
  title: string;
  items: ProductionItem[];
  currentUser: User;
  allowAddTomorrow: boolean;
  emptyMessage: string;
  onChanged: () => void;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <UtensilsCrossed
          size={22}
          className="text-violet-800"
        />

        <h2 className="text-xl font-bold text-gray-950">
          {title}
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <PrepItemCard
              key={item.id}
              item={item}
              currentUser={
                currentUser
              }
              allowAddTomorrow={
                allowAddTomorrow
              }
              onChanged={
                onChanged
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

function HandoverCard({
  title,
  notes,
  href,
}: {
  title: string;
  notes: string[];
  href: string;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock3
            size={22}
            className="text-blue-800"
          />

          <h2 className="text-xl font-bold text-gray-950">
            {title}
          </h2>
        </div>

        <Link
          href={href}
          className="font-semibold text-violet-800 hover:underline"
        >
          Open
        </Link>
      </div>

      {notes.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-gray-500">
          No handover notes have been added.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {notes.map(
            (note, index) => (
              <div
                key={`${title}-${index}-${note}`}
                className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-gray-700"
              >
                • {note}
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}

function ReservaCard({
  siteName,
}: {
  siteName: string;
}) {
  return (
    <section className="rounded-3xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-purple-700">
            Reserva
          </p>

          <h2 className="mt-1 text-2xl font-bold text-purple-950">
            Bookings
          </h2>
        </div>

        <CalendarDays
          size={25}
          className="text-purple-700"
        />
      </div>

      <div className="mt-5 rounded-2xl bg-white/75 p-5">
        <p className="font-bold text-purple-950">
          Coming Soon
        </p>

        <p className="mt-2 text-sm leading-6 text-purple-800">
          Live bookings and cover forecasts for{" "}
          {siteName} will appear here once the Reserva API is connected.
        </p>
      </div>

      <Link
        href="/integrations/reserva"
        className="mt-5 inline-flex items-center gap-2 font-semibold text-purple-900 hover:underline"
      >
        Reserva settings
        <ArrowRight size={17} />
      </Link>
    </section>
  );
}

function OrdersToReceiveCard({
  siteId,
}: {
  siteId: string;
}) {
  const orders =
    getOrders().filter(
      (order) =>
        order.siteId ===
          siteId &&
        order.status ===
          "Sent"
    );

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PackageCheck
            size={22}
            className="text-blue-800"
          />

          <h2 className="text-xl font-bold text-gray-950">
            Orders to Receive
          </h2>
        </div>

        <Link
          href="/purchasing"
          className="font-semibold text-violet-800 hover:underline"
        >
          Open
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-gray-500">
          There are no orders waiting to be received.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {orders.map((order) => (
            <Link
              href="/purchasing"
              key={order.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 p-4 transition hover:bg-slate-50"
            >
              <div>
                <p className="font-bold text-gray-950">
                  {order.supplierName}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {order.orderNumber}
                  {order.requestedDeliveryDate
                    ? ` • Due ${order.requestedDeliveryDate}`
                    : ""}
                </p>
              </div>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                Receive
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

type SiteStocktakeComparison = {
  siteName: string;
  latest?: Stocktake;
  previous?: Stocktake;
  latestValue: number;
  previousValue: number;
  difference: number;
  completion: number;
};

function StocktakeComparisonCard({
  comparison,
}: {
  comparison: SiteStocktakeComparison;
}) {
  const differencePositive =
    comparison.difference > 0;

  const differenceNegative =
    comparison.difference < 0;

  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-950">
            {
              comparison.siteName
            }
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Latest completed stocktake compared with the previous one.
          </p>
        </div>

        <PoundSterling
          size={22}
          className="text-violet-800"
        />
      </div>

      {!comparison.latest ? (
        <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-gray-500">
          No completed stocktake is available yet.
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-violet-50 p-4">
              <p className="text-sm text-violet-700">
                Latest Value
              </p>

              <p className="mt-1 text-2xl font-bold text-violet-950">
                {formatMoney(
                  comparison.latestValue
                )}
              </p>

              <p className="mt-2 text-xs text-violet-700">
                {formatDate(
                  comparison.latest
                    .completedAt
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-gray-500">
                Previous Value
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-950">
                {comparison.previous
                  ? formatMoney(
                      comparison.previousValue
                    )
                  : "No previous"}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                {comparison.previous
                  ? formatDate(
                      comparison.previous
                        .completedAt
                    )
                  : "First completed stocktake"}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
              <span>
                Completion
              </span>

              <span>
                {
                  comparison.completion
                }
                %
              </span>
            </div>

            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-violet-700"
                style={{
                  width: `${comparison.completion}%`,
                }}
              />
            </div>
          </div>

          <div
            className={`mt-4 flex items-center justify-between rounded-2xl p-4 ${
              differencePositive
                ? "bg-blue-50 text-blue-950"
                : differenceNegative
                  ? "bg-orange-50 text-orange-950"
                  : "bg-slate-50 text-gray-950"
            }`}
          >
            <div>
              <p className="text-sm font-semibold opacity-75">
                Difference
              </p>

              <p className="mt-1 text-xl font-bold">
                {comparison.previous
                  ? `${differencePositive ? "+" : ""}${formatMoney(
                      comparison.difference
                    )}`
                  : "Not available"}
              </p>
            </div>

            {comparison.previous &&
              (differencePositive ? (
                <TrendingUp
                  size={24}
                  className="text-blue-700"
                />
              ) : differenceNegative ? (
                <TrendingDown
                  size={24}
                  className="text-orange-700"
                />
              ) : (
                <CheckCircle2
                  size={24}
                  className="text-violet-700"
                />
              ))}
          </div>
        </>
      )}
    </article>
  );
}

type SiteOperationsCardProps = {
  siteName: string;
  todaysPrep: ProductionItem[];
  tomorrowsPrep: ProductionItem[];
  todaysHandover: string[];
  tomorrowsHandover: string[];
  onOpenSite: () => void;
};

function SiteOperationsCard({
  siteName,
  todaysPrep,
  tomorrowsPrep,
  todaysHandover,
  tomorrowsHandover,
  onOpenSite,
}: SiteOperationsCardProps) {
  const completed =
    todaysPrep.filter(
      (item) =>
        item.status ===
        "approved"
    ).length;

  const awaitingApproval =
    todaysPrep.filter(
      (item) =>
        item.status ===
        "awaitingApproval"
    ).length;

  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-violet-800">
            Site
          </p>

          <h3 className="mt-1 text-2xl font-bold text-gray-950">
            {siteName}
          </h3>
        </div>

        <CalendarDays
          size={24}
          className="text-violet-800"
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <div className="rounded-2xl bg-violet-50 p-4">
          <p className="text-sm font-semibold text-violet-800">
            Today&apos;s Prep
          </p>

          <p className="mt-2 text-2xl font-bold text-violet-950">
            {completed}/{todaysPrep.length}
          </p>

          <p className="mt-1 text-xs text-violet-700">
            {awaitingApproval > 0
              ? `${awaitingApproval} awaiting approval`
              : "Completed"}
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-800">
            Today&apos;s Handover
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-950">
            {todaysHandover.length}
          </p>

          <p className="mt-1 text-xs text-blue-700">
            Note{todaysHandover.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-gray-700">
            Tomorrow&apos;s Prep
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-950">
            {tomorrowsPrep.length}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Planned item{tomorrowsPrep.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-2xl bg-purple-50 p-4">
          <p className="text-sm font-semibold text-purple-800">
            Tomorrow&apos;s Handover
          </p>

          <p className="mt-2 text-2xl font-bold text-purple-950">
            {tomorrowsHandover.length}
          </p>

          <p className="mt-1 text-xs text-purple-700">
            Note{tomorrowsHandover.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenSite}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-800 px-5 py-3 font-semibold text-violet-800 transition hover:bg-violet-50"
      >
        Open {siteName}
        <ArrowRight size={17} />
      </button>
    </article>
  );
}

type ActivityItem = {
  id: string;
  time: string;
  title: string;
  detail: string;
  siteName: string;
  href: string;
};

export default function DashboardPage() {
  const router =
    useRouter();

  const [
    currentUser,
    setCurrentUser,
  ] = useState<User | null>(
    null
  );

  const [
    selectedSite,
    setSelectedSite,
  ] = useState(
    "All Sites"
  );

  const [
    version,
    setVersion,
  ] = useState(0);


  useEffect(() => {
    const user =
      getCurrentUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setCurrentUser(user);

    setSelectedSite(
      user.role ===
      "operations"
        ? "All Sites"
        : user.site
    );
  }, [router]);

  useEffect(() => {
    const refresh = () =>
      setVersion(
        (value) =>
          value + 1
      );

    const unsubscribePrep =
      subscribeToPrepChanges(
        refresh
      );

    const unsubscribeHandover =
      subscribeToHandoverChanges(
        refresh
      );

    return () => {
      unsubscribePrep();
      unsubscribeHandover();
    };
  }, []);

  const data = useMemo(() => {
    if (!currentUser) {
      return null;
    }

    const allPrep =
      getPrepItems();

    const products =
      getProducts();

    const siteOperations =
      SITE_NAMES.map(
        (siteName) => ({
          siteName,

          todaysPrep:
            allPrep.filter(
              (item) =>
                item.site ===
                  siteName &&
                item.day ===
                  "today"
            ),

          tomorrowsPrep:
            allPrep.filter(
              (item) =>
                item.site ===
                  siteName &&
                item.day ===
                  "tomorrow"
            ),

          todaysHandover:
            getSiteHandover(
              siteName,
              "today"
            ).notes,

          tomorrowsHandover:
            getSiteHandover(
              siteName,
              "tomorrow"
            ).notes,
        })
      );

    const stocktakeComparisons:
      SiteStocktakeComparison[] =
      SITE_NAMES.map(
        (siteName) => {
          const completed =
            getStocktakes()
              .filter(
                (stocktake) =>
                  stocktake.siteName ===
                    siteName &&
                  stocktake.status ===
                    "Completed"
              )
              .sort(
                (
                  first,
                  second
                ) =>
                  new Date(
                    second.completedAt ??
                      second.updatedAt
                  ).getTime() -
                  new Date(
                    first.completedAt ??
                      first.updatedAt
                  ).getTime()
              );

          const latest =
            completed[0];

          const previous =
            completed[1];

          const latestValue =
            getStocktakeValue(
              latest,
              products
            );

          const previousValue =
            getStocktakeValue(
              previous,
              products
            );

          return {
            siteName,
            latest,
            previous,
            latestValue,
            previousValue,
            difference:
              latestValue -
              previousValue,
            completion:
              getCompletion(
                latest
              ),
          };
        }
      );

    const selectedSiteId =
      getSiteId(
        currentUser.site
      );

    const todaysPrep =
      allPrep.filter(
        (item) =>
          item.site ===
            currentUser.site &&
          item.day ===
            "today"
      );

    const tomorrowsPrep =
      allPrep.filter(
        (item) =>
          item.site ===
            currentUser.site &&
          item.day ===
            "tomorrow"
      );

    const todaysHandover =
      getSiteHandover(
        currentUser.site,
        "today"
      ).notes;

    const tomorrowsHandover =
      getSiteHandover(
        currentUser.site,
        "tomorrow"
      ).notes;

    const notifications =
      getNotifications(
        currentUser.site
      );

    const orders =
      getOrders().filter(
        (order) =>
          order.siteId ===
          selectedSiteId
      );

    const wasteToday =
      getWasteRecords().filter(
        (record) =>
          isToday(
            record.createdAt
          ) &&
          record.siteId ===
            selectedSiteId
      );

    const transfersToday =
      getTransfers().filter(
        (transfer) =>
          isToday(
            transfer.createdAt
          )
      );

    const stocktakes =
      getStocktakes();

    const activity: ActivityItem[] =
      [
        ...wasteToday.map(
          (record) => ({
            id: `waste-${record.id}`,
            time:
              record.createdAt,
            title:
              "Waste recorded",
            detail: `${record.quantity} ${record.inventoryUnit} ${record.productName}`,
            siteName:
              record.siteName,
            href: "/waste",
          })
        ),

        ...transfersToday.map(
          (transfer) => ({
            id: `transfer-${transfer.id}`,
            time:
              transfer.createdAt,
            title:
              "Stock transferred",
            detail: `${transfer.quantity} ${transfer.inventoryUnit} ${transfer.productName} to ${transfer.toSiteName}`,
            siteName:
              transfer.fromSiteName,
            href: "/transfers",
          })
        ),

        ...orders
          .filter((order) =>
            isToday(
              order.updatedAt
            )
          )
          .map((order) => ({
            id: `order-${order.id}`,
            time:
              order.updatedAt,
            title:
              "Purchase order updated",
            detail: `${order.orderNumber} • ${order.supplierName} • ${order.status}`,
            siteName:
              order.siteName,
            href: "/purchasing",
          })),

        ...stocktakes
          .filter(
            (stocktake) =>
              Boolean(
                stocktake.completedAt
              ) &&
              isToday(
                stocktake.completedAt ??
                  stocktake.updatedAt
              )
          )
          .map(
            (stocktake) => ({
              id: `stocktake-${stocktake.id}`,
              time:
                stocktake.completedAt ??
                stocktake.updatedAt,
              title:
                "Stocktake completed",
              detail:
                stocktake.stocktakeNumber,
              siteName:
                stocktake.siteName,
              href: "/stocktakes",
            })
          ),
      ].sort(
        (
          first,
          second
        ) =>
          new Date(
            second.time
          ).getTime() -
          new Date(
            first.time
          ).getTime()
      );

    return {
      siteOperations,
      stocktakeComparisons,
      todaysPrep,
      tomorrowsPrep,
      todaysHandover,
      tomorrowsHandover,
      notifications,
      activity,
    };
  }, [
    currentUser,
    selectedSite,
    version,
  ]);

  if (
    !currentUser ||
    !data
  ) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="font-semibold text-gray-600">
            Loading Dashboard...
          </p>
        </main>
      </ProtectedPage>
    );
  }


  const operationsSites =
    selectedSite ===
    "All Sites"
      ? data.siteOperations
      : data.siteOperations.filter(
          (site) =>
            site.siteName ===
            selectedSite
        );

  const operationsStocktakes =
    selectedSite ===
    "All Sites"
      ? data.stocktakeComparisons
      : data.stocktakeComparisons.filter(
          (site) =>
            site.siteName ===
            selectedSite
        );

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <p className="font-semibold text-violet-800">
                {getGreeting()}
                {currentUser.name
                  ? `, ${currentUser.name}`
                  : ""}
              </p>

              <h1 className="mt-1 text-4xl font-bold text-gray-950">
                Dashboard
              </h1>

              <p className="mt-2 text-gray-600">
                {currentUser.role ===
                "operations"
                  ? "Every site in one place."
                  : `Today's work at ${currentUser.site}.`}
              </p>

              {currentUser.role ===
                "operations" && (
                <select
                  value={
                    selectedSite
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedSite(
                      event.target
                        .value
                    )
                  }
                  className="mt-5 rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-violet-800"
                >
                  {SITE_OPTIONS.map(
                    (site) => (
                      <option
                        key={site}
                        value={site}
                      >
                        {site}
                      </option>
                    )
                  )}
                </select>
              )}
            </div>

            {currentUser.role !==
              "chef" && (
              <ReservaCard
                siteName={
                  currentUser.role ===
                  "operations"
                    ? selectedSite
                    : currentUser.site
                }
              />
            )}
          </div>

          {currentUser.role ===
            "operations" && (
            <>
              <section className="mt-8">
                <div className="flex items-center gap-3">
                  <CalendarDays
                    size={25}
                    className="text-violet-800"
                  />

                  <h2 className="text-2xl font-bold text-gray-950">
                    Site Prep & Handover
                  </h2>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  {operationsSites.map(
                    (site) => (
                      <SiteOperationsCard
                        key={
                          site.siteName
                        }
                        siteName={
                          site.siteName
                        }
                        todaysPrep={
                          site.todaysPrep
                        }
                        tomorrowsPrep={
                          site.tomorrowsPrep
                        }
                        todaysHandover={
                          site.todaysHandover
                        }
                        tomorrowsHandover={
                          site.tomorrowsHandover
                        }
                        onOpenSite={() =>
                          setSelectedSite(
                            site.siteName
                          )
                        }
                      />
                    )
                  )}
                </div>
              </section>

              <section className="mt-8">
                <div className="flex items-center gap-3">
                  <ClipboardCheck
                    size={25}
                    className="text-violet-800"
                  />

                  <h2 className="text-2xl font-bold text-gray-950">
                    Stocktake Comparison
                  </h2>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  {operationsStocktakes.map(
                    (
                      comparison
                    ) => (
                      <StocktakeComparisonCard
                        key={
                          comparison.siteName
                        }
                        comparison={
                          comparison
                        }
                      />
                    )
                  )}
                </div>
              </section>

              <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-950">
                  Recent Activity
                </h2>

                {data.activity
                  .length === 0 ? (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-gray-500">
                    No activity has been recorded today.
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {data.activity
                      .slice(0, 12)
                      .map(
                        (item) => (
                          <Link
                            href={
                              item.href
                            }
                            key={
                              item.id
                            }
                            className="grid gap-3 rounded-2xl border border-gray-200 p-4 transition hover:bg-slate-50 sm:grid-cols-[70px_110px_1fr_auto] sm:items-center"
                          >
                            <p className="text-sm font-bold text-gray-500">
                              {formatTime(
                                item.time
                              )}
                            </p>

                            <p className="text-sm font-semibold text-violet-800">
                              {
                                item.siteName
                              }
                            </p>

                            <div>
                              <p className="font-bold text-gray-950">
                                {
                                  item.title
                                }
                              </p>

                              <p className="mt-1 text-sm text-gray-500">
                                {
                                  item.detail
                                }
                              </p>
                            </div>

                            <ArrowRight
                              size={18}
                              className="text-violet-800"
                            />
                          </Link>
                        )
                      )}
                  </div>
                )}
              </section>
            </>
          )}

          {currentUser.role ===
            "manager" && (
            <div className="mt-8 grid gap-6 xl:grid-cols-2">
              <PrepListCard
                title="Today's Prep"
                items={
                  data.todaysPrep
                }
                currentUser={
                  currentUser
                }
                allowAddTomorrow
                emptyMessage="No prep is planned for today."
                onChanged={() =>
                  setVersion(
                    (value) =>
                      value + 1
                  )
                }
              />

              <OrdersToReceiveCard
                siteId={getSiteId(
                  currentUser.site
                )}
              />

              <Link
                href="/waste"
                className="block rounded-3xl bg-orange-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <Trash2
                  size={26}
                  className="text-orange-800"
                />

                <h2 className="mt-4 text-2xl font-bold text-orange-950">
                  Record Waste
                </h2>

                <p className="mt-2 text-sm text-orange-800">
                  Record product waste for {currentUser.site}.
                </p>

                <span className="mt-5 inline-flex items-center gap-2 font-semibold text-orange-950">
                  Open Waste
                  <ArrowRight size={17} />
                </span>
              </Link>

              <HandoverCard
                title="Today's Handover"
                notes={
                  data.todaysHandover
                }
                href="/handover"
              />

              <PrepListCard
                title="Tomorrow's Prep"
                items={
                  data.tomorrowsPrep
                }
                currentUser={
                  currentUser
                }
                allowAddTomorrow={
                  false
                }
                emptyMessage="Nothing is planned for tomorrow yet."
                onChanged={() =>
                  setVersion(
                    (value) =>
                      value + 1
                  )
                }
              />

              <HandoverCard
                title="Tomorrow's Handover"
                notes={
                  data.tomorrowsHandover
                }
                href="/handover"
              />

              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle
                      size={22}
                      className="text-orange-700"
                    />

                    <h2 className="text-xl font-bold text-gray-950">
                      Needs Attention
                    </h2>
                  </div>

                  <Link
                    href="/notifications"
                    className="font-semibold text-violet-800 hover:underline"
                  >
                    Open
                  </Link>
                </div>

                {data.notifications
                  .length === 0 ? (
                  <div className="mt-5 rounded-2xl bg-violet-50 p-8 text-center font-semibold text-violet-800">
                    Nothing currently needs attention.
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {data.notifications
                      .slice(0, 6)
                      .map(
                        (
                          notification
                        ) => (
                          <Link
                            href={
                              notification.href
                            }
                            key={
                              notification.id
                            }
                            className="block rounded-2xl bg-orange-50 p-4"
                          >
                            <p className="font-bold text-orange-950">
                              {
                                notification.title
                              }
                            </p>

                            <p className="mt-1 text-sm text-orange-800">
                              {
                                notification.description
                              }
                            </p>
                          </Link>
                        )
                      )}
                  </div>
                )}
              </section>
            </div>
          )}

          {currentUser.role ===
            "chef" && (
            <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
              <PrepListCard
                title={`${currentUser.site} Today's Prep`}
                items={
                  data.todaysPrep
                }
                currentUser={
                  currentUser
                }
                allowAddTomorrow={
                  false
                }
                emptyMessage="No prep is planned for today."
                onChanged={() =>
                  setVersion(
                    (value) =>
                      value + 1
                  )
                }
              />

              <div className="space-y-6">
                <Link
                  href="/recipes"
                  className="block rounded-3xl bg-violet-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <UtensilsCrossed
                    size={26}
                    className="text-violet-800"
                  />

                  <h2 className="mt-4 text-2xl font-bold text-violet-950">
                    Recipes
                  </h2>

                  <p className="mt-2 text-sm text-violet-800">
                    Open the recipe library and cooking methods.
                  </p>
                </Link>

                <Link
                  href="/waste"
                  className="block rounded-3xl bg-orange-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <Trash2
                    size={26}
                    className="text-orange-800"
                  />

                  <h2 className="mt-4 text-2xl font-bold text-orange-950">
                    Waste
                  </h2>

                  <p className="mt-2 text-sm text-orange-800">
                    Record waste for {currentUser.site}.
                  </p>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </ProtectedPage>
  );
}
