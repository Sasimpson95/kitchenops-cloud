"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { PurchaseOrder } from "@/data/orders";

type OrderDetailsModalProps = {
  order: PurchaseOrder;
  onClose: () => void;
  onStatusChange: (status: PurchaseOrder["status"]) => void;
};

export default function OrderDetailsModal({
  order,
  onClose,
  onStatusChange,
}: OrderDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-slate-100 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-800">
              Purchase Order
            </p>

            <h2 className="mt-1 text-3xl font-bold text-gray-950">
              {order.orderNumber}
            </h2>

            <p className="mt-2 text-gray-600">{order.supplierName}</p>
          </div>

          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-gray-500">Status</p>
            <div className="mt-2">
              <StatusBadge status={order.status} />
            </div>
          </Card>

          <Card>
            <p className="text-sm text-gray-500">Delivery Date</p>
            <p className="mt-2 font-bold">{order.requestedDeliveryDate}</p>
          </Card>

          <Card>
            <p className="text-sm text-gray-500">Total</p>
            <p className="mt-2 text-xl font-bold">
              £{order.total.toFixed(2)}
            </p>
          </Card>
        </div>

        <Card className="mt-6">
          <h3 className="text-xl font-bold text-gray-950">Items</h3>

          <div className="mt-5 space-y-3">
            {order.items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
              >
                <div>
                  <p className="font-bold text-gray-950">
                    {item.productName}
                  </p>

                  <p className="text-sm text-gray-500">
                    {item.quantity} x {item.orderUnit}
                  </p>
                </div>

                <p className="font-bold">
                  £{(item.quantity * item.unitPrice).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="mt-6">
          <h3 className="text-xl font-bold text-gray-950">Notes</h3>

          <p className="mt-3 text-gray-600">
            {order.notes || "No notes added."}
          </p>
        </Card>

        <Card className="mt-6">
          <h3 className="text-xl font-bold text-gray-950">Timeline</h3>

          <div className="mt-5 space-y-3 text-sm text-gray-600">
            <p>
              ✅ Created by <strong>{order.createdBy}</strong> on{" "}
              {order.createdAt}
            </p>

            <p>🕒 Last updated on {order.updatedAt}</p>
          </div>
        </Card>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {order.status === "Draft" && (
            <Button onClick={() => onStatusChange("Sent")}>Send Order</Button>
          )}

          {order.status === "Sent" && (
            <Button onClick={() => alert("Receive this order from the Purchasing page.")}>
              Receive Delivery
            </Button>
          )}

          {order.status !== "Completed" && order.status !== "Cancelled" && (
            <Button variant="danger" onClick={() => onStatusChange("Cancelled")}>
              Cancel Order
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}