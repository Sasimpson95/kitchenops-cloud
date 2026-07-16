"use client";

import {
  CheckCircle2,
  CircleDot,
  Clock3,
  Pencil,
  Send,
  XCircle,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";

import type {
  OrderTimelineEvent,
  PurchaseOrder,
} from "@/data/orders";

type OrderDetailsModalProps = {
  order: PurchaseOrder;
  onClose: () => void;
  onEdit: () => void;
  onSend: () => void;
  onReceive: () => void;
  onCancel: () => void;
};

function roundMoney(value: number): number {
  return Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;
}

function formatMoney(value: number): string {
  return `£${value.toFixed(2)}`;
}

function formatDateTime(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function formatDeliveryDate(
  value: string
): string {
  if (
    !value ||
    value === "Not set"
  ) {
    return "Not set";
  }

  const date = new Date(
    `${value}T12:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function getTimelineIcon(
  event: OrderTimelineEvent
) {
  if (event.type === "created") {
    return (
      <CircleDot
        size={20}
        className="text-blue-700"
      />
    );
  }

  if (event.type === "updated") {
    return (
      <Pencil
        size={20}
        className="text-yellow-700"
      />
    );
  }

  if (event.type === "sent") {
    return (
      <Send
        size={20}
        className="text-blue-700"
      />
    );
  }

  if (event.type === "completed") {
    return (
      <CheckCircle2
        size={20}
        className="text-violet-700"
      />
    );
  }

  return (
    <XCircle
      size={20}
      className="text-red-700"
    />
  );
}

function getTimelineBackground(
  event: OrderTimelineEvent
): string {
  if (
    event.type === "created" ||
    event.type === "sent"
  ) {
    return "bg-blue-100";
  }

  if (event.type === "updated") {
    return "bg-yellow-100";
  }

  if (event.type === "completed") {
    return "bg-violet-100";
  }

  return "bg-red-100";
}

export default function OrderDetailsModal({
  order,
  onClose,
  onEdit,
  onSend,
  onReceive,
  onCancel,
}: OrderDetailsModalProps) {
  const timeline = [
    ...(order.timeline ?? []),
  ].sort(
    (firstEvent, secondEvent) =>
      new Date(
        secondEvent.createdAt
      ).getTime() -
      new Date(
        firstEvent.createdAt
      ).getTime()
  );

  const invoiceTotal =
    order.invoiceTotal ?? order.total;

  const totalDifference = roundMoney(
    invoiceTotal - order.total
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-3xl overflow-y-auto bg-slate-100 p-6 shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-violet-800">
              Purchase Order
            </p>

            <h2 className="mt-1 text-3xl font-bold text-gray-950">
              {order.orderNumber}
            </h2>

            <p className="mt-2 text-lg text-gray-600">
              {order.supplierName}
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={onClose}
          >
            Close
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-gray-500">
              Status
            </p>

            <div className="mt-2">
              <StatusBadge
                status={order.status}
              />
            </div>
          </Card>

          <Card>
            <p className="text-sm text-gray-500">
              Delivery Date
            </p>

            <p className="mt-2 font-bold text-gray-950">
              {formatDeliveryDate(
                order.requestedDeliveryDate
              )}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-gray-500">
              {order.status === "Completed"
                ? "Final Invoice"
                : "Order Total"}
            </p>

            <p className="mt-2 text-xl font-bold text-gray-950">
              {formatMoney(invoiceTotal)}
            </p>
          </Card>
        </div>

        {order.status === "Completed" && (
          <Card className="mt-6">
            <h3 className="text-xl font-bold text-gray-950">
              Order Comparison
            </h3>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-gray-500">
                  Original Order
                </p>

                <p className="mt-1 text-xl font-bold">
                  {formatMoney(order.total)}
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  Final Invoice
                </p>

                <p className="mt-1 text-xl font-bold text-blue-900">
                  {formatMoney(invoiceTotal)}
                </p>
              </div>

              <div
                className={`rounded-2xl p-4 ${
                  totalDifference > 0
                    ? "bg-red-50"
                    : totalDifference < 0
                    ? "bg-violet-50"
                    : "bg-slate-50"
                }`}
              >
                <p className="text-sm text-gray-600">
                  Difference
                </p>

                <p
                  className={`mt-1 text-xl font-bold ${
                    totalDifference > 0
                      ? "text-red-900"
                      : totalDifference < 0
                      ? "text-violet-900"
                      : "text-gray-950"
                  }`}
                >
                  {totalDifference > 0
                    ? "+"
                    : ""}
                  {formatMoney(
                    totalDifference
                  )}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="mt-6">
          <h3 className="text-xl font-bold text-gray-950">
            Items
          </h3>

          <div className="mt-5 space-y-4">
            {order.items.map((item) => {
              const orderedLineTotal =
                roundMoney(
                  item.quantity *
                    item.unitPrice
                );

              const receivedUnitPrice =
                item.receivedUnitPrice ??
                item.unitPrice;

              const receivedLineTotal =
                roundMoney(
                  item.receivedQuantity *
                    receivedUnitPrice
                );

              const shortQuantity =
                Math.max(
                  0,
                  item.quantity -
                    item.receivedQuantity
                );

              const unitPriceDifference =
                roundMoney(
                  receivedUnitPrice -
                    item.unitPrice
                );

              return (
                <div
                  key={item.productId}
                  className="rounded-2xl bg-slate-50 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-gray-950">
                        {item.productName}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {item.orderUnit}
                      </p>
                    </div>

                    <p className="font-bold text-gray-950">
                      {order.status ===
                      "Completed"
                        ? formatMoney(
                            receivedLineTotal
                          )
                        : formatMoney(
                            orderedLineTotal
                          )}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Ordered
                      </p>

                      <p className="mt-1 font-semibold text-gray-950">
                        {item.quantity} ×{" "}
                        {formatMoney(
                          item.unitPrice
                        )}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {formatMoney(
                          orderedLineTotal
                        )}
                      </p>
                    </div>

                    {order.status ===
                      "Completed" && (
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Received
                        </p>

                        <p className="mt-1 font-semibold text-gray-950">
                          {
                            item.receivedQuantity
                          }{" "}
                          ×{" "}
                          {formatMoney(
                            receivedUnitPrice
                          )}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {formatMoney(
                            receivedLineTotal
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {order.status ===
                    "Completed" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {shortQuantity > 0 && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">
                          Short by{" "}
                          {shortQuantity}
                        </span>
                      )}

                      {unitPriceDifference !==
                        0 && (
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${
                            unitPriceDifference >
                            0
                              ? "bg-red-100 text-red-800"
                              : "bg-violet-100 text-violet-800"
                          }`}
                        >
                          Price{" "}
                          {unitPriceDifference >
                          0
                            ? "+"
                            : ""}
                          {formatMoney(
                            unitPriceDifference
                          )}{" "}
                          each
                        </span>
                      )}

                      {shortQuantity === 0 &&
                        unitPriceDifference ===
                          0 && (
                          <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-800">
                            Matches order
                          </span>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="mt-6">
          <h3 className="text-xl font-bold text-gray-950">
            Order Notes
          </h3>

          <p className="mt-3 whitespace-pre-wrap text-gray-600">
            {order.notes ||
              "No notes added."}
          </p>
        </Card>

        <Card className="mt-6">
          <div className="flex items-center gap-3">
            <Clock3
              className="text-violet-800"
              size={24}
            />

            <div>
              <h3 className="text-xl font-bold text-gray-950">
                Order Timeline
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                A record of every action on
                this order.
              </p>
            </div>
          </div>

          <div className="mt-6">
            {timeline.map(
              (event, index) => (
                <div
                  key={event.id}
                  className="relative flex gap-4 pb-6"
                >
                  {index <
                    timeline.length - 1 && (
                    <div className="absolute left-5 top-10 h-full w-px bg-gray-200" />
                  )}

                  <div
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getTimelineBackground(
                      event
                    )}`}
                  >
                    {getTimelineIcon(event)}
                  </div>

                  <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 p-4">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                      <div>
                        <p className="font-bold text-gray-950">
                          {event.title}
                        </p>

                        {event.description && (
                          <p className="mt-1 text-sm text-gray-600">
                            {
                              event.description
                            }
                          </p>
                        )}
                      </div>

                      <p className="shrink-0 text-xs font-semibold text-gray-500">
                        {formatDateTime(
                          event.createdAt
                        )}
                      </p>
                    </div>

                    <p className="mt-3 text-xs font-semibold text-gray-500">
                      By {event.performedBy}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </Card>

        <Card className="mt-6">
          <h3 className="text-xl font-bold text-gray-950">
            Order Information
          </h3>

          <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="text-gray-500">
                Site
              </p>

              <p className="font-semibold text-gray-950">
                {order.siteName}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Created by
              </p>

              <p className="font-semibold text-gray-950">
                {order.createdBy}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Created
              </p>

              <p className="font-semibold text-gray-950">
                {formatDateTime(
                  order.createdAt
                )}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Last updated
              </p>

              <p className="font-semibold text-gray-950">
                {formatDateTime(
                  order.updatedAt
                )}
              </p>
            </div>

            {order.receivedAt && (
              <div>
                <p className="text-gray-500">
                  Received
                </p>

                <p className="font-semibold text-gray-950">
                  {formatDateTime(
                    order.receivedAt
                  )}
                </p>
              </div>
            )}
          </div>
        </Card>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {order.status === "Draft" && (
            <>
              <Button
                variant="secondary"
                onClick={onEdit}
              >
                Edit Draft
              </Button>

              <Button onClick={onSend}>
                Send Order
              </Button>
            </>
          )}

          {order.status === "Sent" && (
            <Button onClick={onReceive}>
              Receive Delivery
            </Button>
          )}

          {order.status !==
            "Completed" &&
            order.status !==
              "Cancelled" && (
              <Button
                variant="danger"
                onClick={onCancel}
              >
                Cancel Order
              </Button>
            )}
        </div>
      </div>
    </div>
  );
}