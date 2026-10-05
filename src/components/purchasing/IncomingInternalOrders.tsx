"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Inbox, X } from "lucide-react";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  acceptInternalOrder,
  declineInternalOrder,
  getOrders,
  subscribeToOrderChanges,
} from "@/lib/orderStore";
import { toast } from "@/lib/toast";
import type { PurchaseOrder } from "@/data/orders";

type Props = { siteId: string };

export default function IncomingInternalOrders({ siteId }: Props) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setOrders(getOrders());
    refresh();
    return subscribeToOrderChanges(refresh);
  }, []);

  const incoming = useMemo(() => orders
    .filter((order) => order.orderType === "internal" && order.status !== "Draft" &&
      order.supplyingSiteId === siteId && order.siteId !== siteId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [orders, siteId]);

  if (siteId === "all-sites") return null;

  function accept(order: PurchaseOrder): void {
    if (busyOrderId) return;
    try {
      setBusyOrderId(order.id);
      acceptInternalOrder(order.id);
      toast.success("Internal order accepted", `${order.orderNumber} has been accepted.`);
      setOrders(getOrders());
    } catch (error) {
      toast.error("Order not updated", error instanceof Error ? error.message : "The request could not be accepted.");
    } finally {
      setBusyOrderId(null);
    }
  }

  function decline(order: PurchaseOrder): void {
    if (busyOrderId) return;
    const reason = window.prompt(`Why is ${order.orderNumber} being declined?`);
    if (reason === null) return;
    try {
      setBusyOrderId(order.id);
      declineInternalOrder(order.id, reason);
      toast.success("Internal order declined", `${order.orderNumber} has been declined.`);
      setOrders(getOrders());
    } catch (error) {
      toast.error("Order not updated", error instanceof Error ? error.message : "The request could not be declined.");
    } finally {
      setBusyOrderId(null);
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-3">
        <Inbox size={25} className="text-violet-800" />
        <div>
          <h2 className="text-xl font-bold text-gray-950">Incoming Internal Orders</h2>
          <p className="text-sm text-gray-500">Requests from other KitchenOps sites to supply from this site.</p>
        </div>
        <span className="ml-auto rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-800">{incoming.length}</span>
      </div>
      {incoming.length === 0 ? (
        <p className="mt-5 rounded-xl bg-slate-50 p-5 text-gray-500">No internal requests for this site yet.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {incoming.map((order) => (
            <div key={order.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-950">{order.orderNumber} · {order.siteName}</p>
                  <p className="mt-1 text-sm text-gray-500">Requested delivery: {order.requestedDeliveryDate}</p>
                </div>
                <StatusBadge status={order.status === "Sent" ? "Requested" : order.status} />
              </div>
              <div className="mt-3 space-y-1 text-sm text-gray-700">
                {order.items.map((item) => <p key={item.productId}>{item.quantity} × {item.orderUnit} — {item.productName}</p>)}
              </div>
              {order.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">Notes: {order.notes}</p>}

              {order.status === "Sent" && (
                <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => accept(order)}
                    disabled={busyOrderId === order.id}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-4 py-2.5 font-semibold text-white hover:bg-violet-900 disabled:opacity-50"
                  >
                    <Check size={18} /> Accept Request
                  </button>
                  <button
                    type="button"
                    onClick={() => decline(order)}
                    disabled={busyOrderId === order.id}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X size={18} /> Decline
                  </button>
                </div>
              )}

              {order.status === "Accepted" && (
                <p className="mt-3 text-xs font-semibold text-emerald-700">Accepted by {order.acceptedBy || "KitchenOps user"}{order.acceptedAt ? ` · ${new Date(order.acceptedAt).toLocaleString("en-GB")}` : ""}. No stock movement has occurred.</p>
              )}
              {order.status === "Declined" && (
                <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">
                  <p className="font-semibold">Declined by {order.declinedBy || "KitchenOps user"}</p>
                  {order.declineReason && <p className="mt-1">Reason: {order.declineReason}</p>}
                </div>
              )}
              {order.status === "Sent" && (
                <p className="mt-3 text-xs text-gray-500">Submitted by {order.createdBy}. Accepting or declining records the reviewing staff member; stock is unchanged.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
