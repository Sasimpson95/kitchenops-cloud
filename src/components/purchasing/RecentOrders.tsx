"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import OrderDetailsModal from "@/components/orders/OrderDetailsModal";
import EditOrderModal from "@/components/orders/EditOrderModal";

import type { PurchaseOrder } from "@/data/orders";

import {
  getOrders,
  subscribeToOrderChanges,
  updateOrderStatus,
} from "@/lib/orderStore";

type RecentOrdersProps = {
  refreshKey?: number;
  siteId?: string;
  onOrdersChanged?: () => void;
};

export default function RecentOrders({
  refreshKey = 0,
  siteId = "all-sites",
  onOrdersChanged,
}: RecentOrdersProps) {
  const router = useRouter();

  const [orderList, setOrderList] =
    useState<PurchaseOrder[]>([]);

  const [
    selectedOrderId,
    setSelectedOrderId,
  ] = useState<string | null>(null);

  const [showEdit, setShowEdit] =
    useState(false);

  const refreshOrders =
    useCallback(() => {
      setOrderList(getOrders());
    }, []);

  useEffect(() => {
    refreshOrders();

    const unsubscribe =
      subscribeToOrderChanges(
        refreshOrders
      );

    return unsubscribe;
  }, [refreshOrders]);

  useEffect(() => {
    refreshOrders();
  }, [refreshKey, refreshOrders]);

  const recentOrders = useMemo(() => {
    const visibleOrders = siteId === "all-sites"
      ? orderList
      : orderList.filter((order) => order.siteId === siteId);

    return [...visibleOrders]
      .sort(
        (firstOrder, secondOrder) =>
          new Date(
            secondOrder.updatedAt
          ).getTime() -
          new Date(
            firstOrder.updatedAt
          ).getTime()
      )
      .slice(0, 5);
  }, [orderList, siteId]);

  const selectedOrder = useMemo(() => {
    return (
      orderList.find(
        (order) =>
          order.id ===
          selectedOrderId
      ) ?? null
    );
  }, [
    orderList,
    selectedOrderId,
  ]);

  function changeStatus(
    status: PurchaseOrder["status"]
  ): void {
    if (!selectedOrderId) {
      return;
    }

    updateOrderStatus(
      selectedOrderId,
      status
    );

    onOrdersChanged?.();
  }

  function sendSelectedOrder(): void {
    changeStatus("Sent");
  }

  function cancelSelectedOrder(): void {
    changeStatus("Cancelled");
  }

  function receiveSelectedOrder(): void {
    if (!selectedOrder) {
      return;
    }

    setSelectedOrderId(null);
    setShowEdit(false);

    router.push(
      `/orders/${selectedOrder.id}/receive`
    );
  }

  function openEditOrder(): void {
    if (!selectedOrder) {
      return;
    }

    setShowEdit(true);
  }

  function handleOrderSaved(
    updatedOrder: PurchaseOrder
  ): void {
    setShowEdit(false);

    setSelectedOrderId(
      updatedOrder.id
    );

    onOrdersChanged?.();
  }

  function closeModal(): void {
    setSelectedOrderId(null);
    setShowEdit(false);
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-950">
            Today&apos;s Purchasing
          </h2>

          <Link
            href="/orders"
            className="font-semibold text-violet-800 hover:underline"
          >
            View all orders
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-slate-50 p-10 text-center">
            <h3 className="text-xl font-bold text-gray-950">
              No orders yet
            </h3>

            <p className="mt-2 text-gray-500">
              Create your first
              supplier order.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {recentOrders.map(
              (order) => {
                const itemCount =
                  order.items.reduce(
                    (total, item) =>
                      total +
                      item.quantity,
                    0
                  );

                let actionText =
                  "View";

                if (
                  order.status ===
                  "Draft"
                ) {
                  actionText =
                    "Review";
                }

                if (
                  order.status ===
                  "Sent"
                ) {
                  actionText =
                    "Receive";
                }

                return (
                  <div
                    key={order.id}
                    className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 md:grid-cols-[1fr_auto_auto] md:items-center"
                  >
                    <div>
                      <p className="text-xl font-bold text-gray-950">
                        {
                          order.orderNumber
                        }
                      </p>

                      <p className="mt-1 font-semibold text-gray-700">
                        {
                          order.supplierName
                        }
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Created by{" "}
                        {
                          order.createdBy
                        }
                      </p>
                    </div>

                    <div>
                      <StatusBadge
                        status={
                          order.status
                        }
                      />

                      <p className="mt-3 text-sm text-gray-500">
                        Delivery:{" "}
                        {
                          order.requestedDeliveryDate
                        }
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-xl font-bold text-gray-950">
                        £
                        {order.total.toFixed(
                          2
                        )}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {itemCount}{" "}
                        {itemCount === 1
                          ? "item"
                          : "items"}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setShowEdit(
                            false
                          );

                          setSelectedOrderId(
                            order.id
                          );
                        }}
                        className="mt-3 rounded-xl border border-violet-800 px-5 py-2 font-semibold text-violet-800 transition hover:bg-violet-50"
                      >
                        {actionText}
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </Card>

      {selectedOrder &&
        !showEdit && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={closeModal}
            onEdit={openEditOrder}
            onSend={
              sendSelectedOrder
            }
            onReceive={
              receiveSelectedOrder
            }
            onCancel={
              cancelSelectedOrder
            }
          />
        )}

      {selectedOrder &&
        showEdit &&
        selectedOrder.status ===
          "Draft" && (
          <EditOrderModal
            order={selectedOrder}
            onClose={() =>
              setShowEdit(false)
            }
            onSaved={
              handleOrderSaved
            }
          />
        )}
    </>
  );
}