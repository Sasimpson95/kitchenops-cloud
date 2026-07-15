"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertTriangle,
  Building2,
  ClipboardList,
  History,
  PackageCheck,
  PoundSterling,
  ShoppingCart,
  Truck,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import NewOrderModal from "@/components/purchasing/NewOrderModal";
import RecentOrders from "@/components/purchasing/RecentOrders";

import type { PurchaseOrder } from "@/data/orders";

import type {
  User,
} from "@/config/roles";

import {
  getCurrentUser,
} from "@/lib/currentUser";

import {
  getOrders,
  subscribeToOrderChanges,
} from "@/lib/orderStore";

const SITES = [
  { id: "all-sites", name: "All Sites" },
  { id: "beeston", name: "Beeston" },
  { id: "city", name: "City" },
  { id: "sherwood", name: "Sherwood" },
  { id: "bakery", name: "Bakery" },
];

function getSiteId(
  siteName: string
): string {
  return siteName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export default function PurchasingPage() {
  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [selectedSiteId, setSelectedSiteId] =
    useState("beeston");

  const [siteError, setSiteError] =
    useState("");

  const [showNewOrder, setShowNewOrder] =
    useState(false);

  const [orderList, setOrderList] = useState<
    PurchaseOrder[]
  >([]);

  const refreshPurchasing = useCallback(() => {
    setOrderList(getOrders());
  }, []);

  useEffect(() => {
    const user = getCurrentUser();

    if (user) {
      setCurrentUser(user);

      setSelectedSiteId(
        user.role === "operations"
          ? "all-sites"
          : getSiteId(user.site)
      );
    }

    refreshPurchasing();

    const unsubscribe =
      subscribeToOrderChanges(refreshPurchasing);

    return unsubscribe;
  }, [refreshPurchasing]);

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const visibleOrders = useMemo(() => {
    if (
      selectedSiteId === "all-sites"
    ) {
      return orderList;
    }

    return orderList.filter(
      (order) =>
        order.siteId === selectedSiteId
    );
  }, [orderList, selectedSiteId]);

  const draftOrders = useMemo(() => {
    return visibleOrders.filter(
      (order) => order.status === "Draft"
    );
  }, [visibleOrders]);

  const deliveriesToday = useMemo(() => {
    return orderList.filter((order) => {
      return (
        order.status === "Sent" &&
        order.requestedDeliveryDate === today
      );
    });
  }, [visibleOrders, today]);

  const overdueDeliveries = useMemo(() => {
    return orderList.filter((order) => {
      return (
        order.status === "Sent" &&
        order.requestedDeliveryDate !== "Not set" &&
        order.requestedDeliveryDate < today
      );
    });
  }, [visibleOrders, today]);

  const awaitingDeliveries = useMemo(() => {
    return visibleOrders
      .filter((order) => order.status === "Sent")
      .sort((firstOrder, secondOrder) => {
        const firstDate =
          firstOrder.requestedDeliveryDate ===
          "Not set"
            ? "9999-12-31"
            : firstOrder.requestedDeliveryDate;

        const secondDate =
          secondOrder.requestedDeliveryDate ===
          "Not set"
            ? "9999-12-31"
            : secondOrder.requestedDeliveryDate;

        return firstDate.localeCompare(secondDate);
      })
      .slice(0, 3);
  }, [visibleOrders]);

  function openNewOrder(): void {
    if (
      currentUser?.role === "operations" &&
      selectedSiteId === "all-sites"
    ) {
      setSiteError(
        "Select a site before creating a purchase order."
      );

      return;
    }

    setSiteError("");
    setShowNewOrder(true);
  }

  function closeNewOrder(): void {
    setShowNewOrder(false);
    refreshPurchasing();
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <PageHeader
              title="Purchasing"
              description="Manage orders, deliveries and suppliers."
            />

            {currentUser?.role ===
              "operations" && (
              <select
                value={selectedSiteId}
                onChange={(event) => {
                  setSelectedSiteId(
                    event.target.value
                  );
                  setSiteError("");
                }}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-green-800"
              >
                {SITES.map((site) => (
                  <option
                    key={site.id}
                    value={site.id}
                  >
                    {site.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {siteError && (
            <div className="mt-5 rounded-2xl bg-orange-50 p-4 font-semibold text-orange-800">
              {siteError}
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              onClick={openNewOrder}
              disabled={
                currentUser?.role === "operations" &&
                selectedSiteId === "all-sites"
              }
              className="rounded-3xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-800">
                  <ShoppingCart size={28} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-950">
                    New Order
                  </h2>

                  <p className="mt-1 text-gray-500">
                    Create supplier order
                  </p>
                </div>
              </div>
            </button>

            <Link
              href="/orders"
              className="block"
            >
              <Card className="h-full transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-800">
                    <Truck size={28} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-gray-950">
                      Receive Delivery
                    </h2>

                    <p className="mt-1 text-gray-500">
                      Check items into stock
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link
              href="/suppliers"
              className="block"
            >
              <Card className="h-full transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-800">
                    <Building2 size={28} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-gray-950">
                      Suppliers
                    </h2>

                    <p className="mt-1 text-gray-500">
                      Manage supplier details
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link
              href="/orders"
              className="block"
            >
              <Card className="h-full transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-800">
                    <History size={28} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-gray-950">
                      Order History
                    </h2>

                    <p className="mt-1 text-gray-500">
                      View past orders
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <div className="flex items-center gap-4">
                <ClipboardList
                  className="text-yellow-700"
                  size={32}
                />

                <div>
                  <p className="text-4xl font-bold text-gray-950">
                    {draftOrders.length}
                  </p>

                  <p className="font-semibold text-gray-700">
                    Orders to Send
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Draft orders ready
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-4">
                <Truck
                  className="text-blue-700"
                  size={32}
                />

                <div>
                  <p className="text-4xl font-bold text-gray-950">
                    {deliveriesToday.length}
                  </p>

                  <p className="font-semibold text-gray-700">
                    Deliveries Today
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Due for delivery
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-4">
                <AlertTriangle
                  className="text-red-700"
                  size={32}
                />

                <div>
                  <p className="text-4xl font-bold text-red-700">
                    {overdueDeliveries.length}
                  </p>

                  <p className="font-semibold text-gray-700">
                    Overdue Deliveries
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Need attention
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-4">
                <PoundSterling
                  className="text-purple-700"
                  size={32}
                />

                <div>
                  <p className="text-4xl font-bold text-gray-950">
                    0
                  </p>

                  <p className="font-semibold text-gray-700">
                    Price Changes
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    None to review
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
            <RecentOrders
              onOrdersChanged={refreshPurchasing}
            />

            <div className="space-y-6">
              <Card>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-950">
                    Awaiting Delivery
                  </h2>

                  <Link
                    href="/orders"
                    className="text-sm font-semibold text-green-800 hover:underline"
                  >
                    View all
                  </Link>
                </div>

                {awaitingDeliveries.length === 0 ? (
                  <p className="mt-5 text-gray-500">
                    No deliveries are currently
                    awaiting receipt.
                  </p>
                ) : (
                  <div className="mt-5 space-y-4">
                    {awaitingDeliveries.map(
                      (order) => (
                        <Link
                          key={order.id}
                          href={`/orders/${order.id}/receive`}
                          className="block rounded-2xl border border-gray-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
                        >
                          <div className="flex items-start gap-3">
                            <PackageCheck
                              className="text-blue-700"
                              size={24}
                            />

                            <div>
                              <p className="font-bold text-gray-950">
                                {order.orderNumber}
                              </p>

                              <p className="mt-1 font-semibold text-gray-700">
                                {order.supplierName}
                              </p>

                              <p className="mt-2 text-sm text-gray-500">
                                Due{" "}
                                {
                                  order.requestedDeliveryDate
                                }
                              </p>
                            </div>
                          </div>
                        </Link>
                      )
                    )}
                  </div>
                )}
              </Card>

              <Card>
                <h2 className="text-xl font-bold text-gray-950">
                  Needs Your Attention
                </h2>

                <div className="mt-5 space-y-3">
                  {overdueDeliveries.length >
                    0 && (
                    <Link
                      href="/orders"
                      className="block rounded-2xl bg-red-50 p-4 transition hover:bg-red-100"
                    >
                      <p className="font-bold text-red-800">
                        {
                          overdueDeliveries.length
                        }{" "}
                        overdue{" "}
                        {overdueDeliveries.length ===
                        1
                          ? "delivery"
                          : "deliveries"}
                      </p>

                      <p className="text-sm text-red-700">
                        View and action now
                      </p>
                    </Link>
                  )}

                  {draftOrders.length > 0 && (
                    <Link
                      href="/orders"
                      className="block rounded-2xl bg-yellow-50 p-4 transition hover:bg-yellow-100"
                    >
                      <p className="font-bold text-yellow-800">
                        {draftOrders.length} draft{" "}
                        {draftOrders.length === 1
                          ? "order"
                          : "orders"}
                      </p>

                      <p className="text-sm text-yellow-700">
                        Ready to review and send
                      </p>
                    </Link>
                  )}

                  {overdueDeliveries.length ===
                    0 &&
                    draftOrders.length === 0 && (
                      <div className="rounded-2xl bg-green-50 p-4">
                        <p className="font-bold text-green-800">
                          Nothing needs attention
                        </p>

                        <p className="text-sm text-green-700">
                          Purchasing is up to date.
                        </p>
                      </div>
                    )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {showNewOrder && (
          <NewOrderModal
            siteId={selectedSiteId}
            siteName={
              SITES.find(
                (site) =>
                  site.id ===
                  selectedSiteId
              )?.name ?? "Unknown Site"
            }
            onClose={closeNewOrder}
          />
        )}
      </main>
    </ProtectedPage>
  );
}
