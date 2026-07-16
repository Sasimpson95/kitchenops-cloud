"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Card from "@/components/ui/Card";
import SearchBar from "@/components/ui/SearchBar";
import StatusBadge from "@/components/ui/StatusBadge";
import OrderDetailsModal from "@/components/orders/OrderDetailsModal";
import EditOrderModal from "@/components/orders/EditOrderModal";

import type { PurchaseOrder } from "@/data/orders";

import {
  getOrders,
  updateOrderStatus,
} from "@/lib/orderStore";

export default function OrdersTable() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [orderList, setOrderList] =
    useState<PurchaseOrder[]>([]);

  const [
    selectedOrderId,
    setSelectedOrderId,
  ] = useState<string | null>(null);

  const [showEdit, setShowEdit] =
    useState(false);

  function refreshOrders() {
    setOrderList(getOrders());
  }

  useEffect(() => {
    refreshOrders();
  }, []);

  const selectedOrder =
    orderList.find(
      (order) =>
        order.id === selectedOrderId
    ) ?? null;

  function changeStatus(
    status: PurchaseOrder["status"]
  ) {
    if (!selectedOrderId) return;

    updateOrderStatus(
      selectedOrderId,
      status
    );

    refreshOrders();
  }

  function sendSelectedOrder() {
    changeStatus("Sent");
  }

  function cancelSelectedOrder() {
    changeStatus("Cancelled");
  }

  function startReceivingSelectedOrder() {
    if (!selectedOrder) return;

    router.push(
      `/orders/${selectedOrder.id}/receive`
    );
  }

  function openEditOrder() {
    if (!selectedOrder) return;

    setShowEdit(true);
  }

  function handleOrderSaved(
    updatedOrder: PurchaseOrder
  ) {
    refreshOrders();
    setShowEdit(false);
    setSelectedOrderId(updatedOrder.id);
  }

  const searchTerm =
    search.trim().toLowerCase();

  const filteredOrders = orderList.filter(
    (order) =>
      order.orderNumber
        .toLowerCase()
        .includes(searchTerm) ||
      order.supplierName
        .toLowerCase()
        .includes(searchTerm) ||
      order.siteName
        .toLowerCase()
        .includes(searchTerm)
  );

  return (
    <>
      <Card>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-950">
            Purchase Orders
          </h2>

          <p className="text-sm text-gray-500">
            {filteredOrders.length}{" "}
            {filteredOrders.length === 1
              ? "Order"
              : "Orders"}
          </p>
        </div>

        <div className="mt-6">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search orders..."
          />
        </div>

        {filteredOrders.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-slate-50 p-10 text-center">
            <h3 className="text-xl font-bold text-gray-950">
              No orders found
            </h3>

            <p className="mt-2 text-gray-500">
              Try another order number,
              supplier or site.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full min-w-[850px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-sm text-gray-600">
                  <th className="p-4">
                    Order
                  </th>

                  <th className="p-4">
                    Supplier
                  </th>

                  <th className="p-4">
                    Site
                  </th>

                  <th className="p-4">
                    Delivery
                  </th>

                  <th className="p-4">
                    Status
                  </th>

                  <th className="p-4 text-right">
                    Total
                  </th>

                  <th className="p-4" />
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map(
                  (order) => (
                    <tr
                      key={order.id}
                      className="border-t border-gray-200 hover:bg-slate-50"
                    >
                      <td className="p-4 font-bold text-gray-950">
                        {order.orderNumber}
                      </td>

                      <td className="p-4 text-gray-700">
                        {order.supplierName}
                      </td>

                      <td className="p-4 text-gray-700">
                        {order.siteName}
                      </td>

                      <td className="p-4 text-gray-700">
                        {
                          order.requestedDeliveryDate
                        }
                      </td>

                      <td className="p-4">
                        <StatusBadge
                          status={order.status}
                        />
                      </td>

                      <td className="p-4 text-right font-bold text-gray-950">
                        £
                        {order.total.toFixed(
                          2
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() =>
                            setSelectedOrderId(
                              order.id
                            )
                          }
                          className="rounded-xl border border-violet-800 px-4 py-2 font-semibold text-violet-800 transition hover:bg-violet-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setSelectedOrderId(null);
            setShowEdit(false);
          }}
          onEdit={openEditOrder}
          onSend={sendSelectedOrder}
          onReceive={
            startReceivingSelectedOrder
          }
          onCancel={cancelSelectedOrder}
        />
      )}

      {selectedOrder &&
        showEdit &&
        selectedOrder.status === "Draft" && (
          <EditOrderModal
            order={selectedOrder}
            onClose={() =>
              setShowEdit(false)
            }
            onSaved={handleOrderSaved}
          />
        )}
    </>
  );
}