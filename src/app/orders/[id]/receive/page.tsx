"use client";

import {
  use,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Minus,
  PackageCheck,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";

import type { PurchaseOrder } from "@/data/orders";

import {
  getOrderById,
  receivePurchaseOrder,
} from "@/lib/orderStore";

type ReceiveDeliveryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type NumberMap = {
  [productId: number]: number;
};

function roundMoney(value: number): number {
  return Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;
}

function formatMoney(value: number): string {
  return `£${value.toFixed(2)}`;
}

export default function ReceiveDeliveryPage({
  params,
}: ReceiveDeliveryPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] =
    useState<PurchaseOrder | null>(null);

  const [
    receivedQuantities,
    setReceivedQuantities,
  ] = useState<NumberMap>({});

  const [
    receivedPrices,
    setReceivedPrices,
  ] = useState<NumberMap>({});

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const foundOrder = getOrderById(id);

    setOrder(foundOrder ?? null);

    if (foundOrder) {
      const startingQuantities: NumberMap =
        {};

      const startingPrices: NumberMap = {};

      foundOrder.items.forEach((item) => {
        startingQuantities[item.productId] =
          item.quantity;

        startingPrices[item.productId] =
          item.unitPrice;
      });

      setReceivedQuantities(
        startingQuantities
      );

      setReceivedPrices(startingPrices);
    }

    setLoading(false);
  }, [id]);

  const totals = useMemo(() => {
    if (!order) {
      return {
        orderedQuantity: 0,
        receivedQuantity: 0,
        shortQuantity: 0,
        originalTotal: 0,
        invoiceTotal: 0,
        difference: 0,
        priceChanges: 0,
      };
    }

    let receivedQuantity = 0;
    let shortQuantity = 0;
    let invoiceTotal = 0;
    let priceChanges = 0;

    order.items.forEach((item) => {
      const quantity =
        receivedQuantities[
          item.productId
        ] ?? 0;

      const price =
        receivedPrices[item.productId] ??
        item.unitPrice;

      receivedQuantity += quantity;

      shortQuantity += Math.max(
        0,
        item.quantity - quantity
      );

      invoiceTotal += quantity * price;

      if (
        roundMoney(price) !==
        roundMoney(item.unitPrice)
      ) {
        priceChanges += 1;
      }
    });

    const orderedQuantity =
      order.items.reduce(
        (total, item) =>
          total + item.quantity,
        0
      );

    const roundedInvoiceTotal =
      roundMoney(invoiceTotal);

    return {
      orderedQuantity,
      receivedQuantity,
      shortQuantity,
      originalTotal: order.total,
      invoiceTotal:
        roundedInvoiceTotal,
      difference: roundMoney(
        roundedInvoiceTotal -
          order.total
      ),
      priceChanges,
    };
  }, [
    order,
    receivedQuantities,
    receivedPrices,
  ]);

  function updateReceivedQuantity(
    productId: number,
    value: number
  ): void {
    if (!order) return;

    const item = order.items.find(
      (orderItem) =>
        orderItem.productId === productId
    );

    if (!item) return;

    const safeValue = Math.max(
      0,
      Math.min(
        Number.isFinite(value) ? value : 0,
        item.quantity
      )
    );

    setReceivedQuantities(
      (current) => ({
        ...current,
        [productId]: safeValue,
      })
    );
  }

  function updateReceivedPrice(
    productId: number,
    value: number
  ): void {
    const safeValue = Math.max(
      0,
      Number.isFinite(value) ? value : 0
    );

    setReceivedPrices((current) => ({
      ...current,
      [productId]: safeValue,
    }));
  }

  function resetLine(
    productId: number
  ): void {
    if (!order) return;

    const item = order.items.find(
      (orderItem) =>
        orderItem.productId === productId
    );

    if (!item) return;

    setReceivedQuantities(
      (current) => ({
        ...current,
        [productId]: item.quantity,
      })
    );

    setReceivedPrices((current) => ({
      ...current,
      [productId]: item.unitPrice,
    }));
  }

  function handleReceiveDelivery(): void {
    if (!order || saving) return;

    try {
      setSaving(true);
      setError("");

      receivePurchaseOrder(
        order.id,
        order.items.map((item) => ({
          productId: item.productId,

          receivedQuantity:
            receivedQuantities[
              item.productId
            ] ?? 0,

          receivedUnitPrice:
            receivedPrices[
              item.productId
            ] ?? item.unitPrice,
        }))
      );

      router.push("/purchasing");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The delivery could not be received."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ProtectedPage>
        <main className="min-h-screen bg-slate-100 p-8">
          <div className="mx-auto max-w-6xl">
            <Card>
              <p className="text-gray-600">
                Loading delivery...
              </p>
            </Card>
          </div>
        </main>
      </ProtectedPage>
    );
  }

  if (!order) {
    return (
      <ProtectedPage>
        <main className="min-h-screen bg-slate-100 p-8">
          <div className="mx-auto max-w-6xl">
            <Card>
              <h1 className="text-3xl font-bold text-gray-950">
                Order not found
              </h1>

              <p className="mt-2 text-gray-600">
                This order may have been
                removed.
              </p>

              <div className="mt-6">
                <Button
                  variant="secondary"
                  onClick={() =>
                    router.push("/orders")
                  }
                >
                  Back to Orders
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </ProtectedPage>
    );
  }

  const cannotReceive =
    order.status === "Draft" ||
    order.status === "Cancelled" ||
    order.status === "Completed";

  const differencePrefix =
    totals.difference > 0 ? "+" : "";

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-6xl">
          <PageHeader
            title="Receive Delivery"
            description={`${order.orderNumber} · ${order.supplierName}`}
          />

          <div className="grid gap-4 md:grid-cols-3">
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
                Site
              </p>

              <p className="mt-2 text-xl font-bold text-gray-950">
                {order.siteName}
              </p>
            </Card>

            <Card>
              <p className="text-sm text-gray-500">
                Requested Delivery
              </p>

              <p className="mt-2 text-xl font-bold text-gray-950">
                {
                  order.requestedDeliveryDate
                }
              </p>
            </Card>
          </div>

          {cannotReceive && (
            <div className="mt-6 rounded-2xl bg-yellow-50 p-5 font-semibold text-yellow-800">
              {order.status === "Draft" &&
                "This order must be sent before it can be received."}

              {order.status ===
                "Cancelled" &&
                "This order has been cancelled."}

              {order.status ===
                "Completed" &&
                "This delivery has already been received."}
            </div>
          )}

          <Card className="mt-6">
            <div className="flex items-start gap-3">
              <PackageCheck
                className="mt-1 text-green-800"
                size={28}
              />

              <div>
                <h2 className="text-2xl font-bold text-gray-950">
                  Delivery Items
                </h2>

                <p className="mt-2 text-gray-600">
                  Enter the quantity delivered
                  and the actual unit price shown
                  on the invoice.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {order.items.map((item) => {
                const receivedQuantity =
                  receivedQuantities[
                    item.productId
                  ] ?? 0;

                const receivedPrice =
                  receivedPrices[
                    item.productId
                  ] ?? item.unitPrice;

                const shortQuantity =
                  Math.max(
                    0,
                    item.quantity -
                      receivedQuantity
                  );

                const orderedLineTotal =
                  roundMoney(
                    item.quantity *
                      item.unitPrice
                  );

                const invoiceLineTotal =
                  roundMoney(
                    receivedQuantity *
                      receivedPrice
                  );

                const priceDifference =
                  roundMoney(
                    receivedPrice -
                      item.unitPrice
                  );

                const lineDifference =
                  roundMoney(
                    invoiceLineTotal -
                      orderedLineTotal
                  );

                const hasPriceChange =
                  priceDifference !== 0;

                const hasQuantityChange =
                  shortQuantity > 0;

                return (
                  <div
                    key={item.productId}
                    className={`rounded-2xl border p-5 ${
                      hasPriceChange ||
                      hasQuantityChange
                        ? "border-orange-300 bg-orange-50/30"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <h3 className="text-xl font-bold text-gray-950">
                          {item.productName}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {item.orderUnit}
                        </p>
                      </div>

                      {!cannotReceive && (
                        <button
                          type="button"
                          onClick={() =>
                            resetLine(
                              item.productId
                            )
                          }
                          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-slate-50"
                        >
                          Reset to order
                        </button>
                      )}
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-gray-500">
                          Ordered quantity
                        </p>

                        <p className="mt-1 text-2xl font-bold text-gray-950">
                          {item.quantity}
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Received quantity
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={
                              cannotReceive ||
                              receivedQuantity <= 0
                            }
                            onClick={() =>
                              updateReceivedQuantity(
                                item.productId,
                                receivedQuantity -
                                  1
                              )
                            }
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white text-xl font-bold disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            −
                          </button>

                          <input
                            type="number"
                            min={0}
                            max={item.quantity}
                            step={1}
                            disabled={
                              cannotReceive
                            }
                            value={
                              receivedQuantity
                            }
                            onChange={(event) =>
                              updateReceivedQuantity(
                                item.productId,
                                Number(
                                  event.target
                                    .value
                                )
                              )
                            }
                            className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-xl font-bold outline-none focus:border-green-800 disabled:bg-slate-100"
                          />

                          <button
                            type="button"
                            disabled={
                              cannotReceive ||
                              receivedQuantity >=
                                item.quantity
                            }
                            onClick={() =>
                              updateReceivedQuantity(
                                item.productId,
                                receivedQuantity +
                                  1
                              )
                            }
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-800 text-xl font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-gray-500">
                          Ordered unit price
                        </p>

                        <p className="mt-1 text-2xl font-bold text-gray-950">
                          {formatMoney(
                            item.unitPrice
                          )}
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Actual unit price
                        </label>

                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">
                            £
                          </span>

                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            disabled={
                              cannotReceive
                            }
                            value={receivedPrice}
                            onChange={(event) =>
                              updateReceivedPrice(
                                item.productId,
                                Number(
                                  event.target
                                    .value
                                )
                              )
                            }
                            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-9 pr-4 text-xl font-bold outline-none focus:border-green-800 disabled:bg-slate-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <div
                        className={`rounded-2xl p-4 ${
                          shortQuantity > 0
                            ? "bg-red-50"
                            : "bg-green-50"
                        }`}
                      >
                        <p
                          className={`text-sm ${
                            shortQuantity > 0
                              ? "text-red-700"
                              : "text-green-700"
                          }`}
                        >
                          Short delivered
                        </p>

                        <p
                          className={`mt-1 text-xl font-bold ${
                            shortQuantity > 0
                              ? "text-red-900"
                              : "text-green-900"
                          }`}
                        >
                          {shortQuantity}
                        </p>
                      </div>

                      <div
                        className={`rounded-2xl p-4 ${
                          hasPriceChange
                            ? "bg-orange-50"
                            : "bg-green-50"
                        }`}
                      >
                        <p
                          className={`text-sm ${
                            hasPriceChange
                              ? "text-orange-700"
                              : "text-green-700"
                          }`}
                        >
                          Unit price change
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          {priceDifference > 0 && (
                            <ArrowUp
                              size={18}
                              className="text-red-700"
                            />
                          )}

                          {priceDifference < 0 && (
                            <ArrowDown
                              size={18}
                              className="text-green-700"
                            />
                          )}

                          {priceDifference === 0 && (
                            <Minus
                              size={18}
                              className="text-green-700"
                            />
                          )}

                          <p
                            className={`text-xl font-bold ${
                              priceDifference > 0
                                ? "text-red-900"
                                : "text-green-900"
                            }`}
                          >
                            {priceDifference > 0
                              ? "+"
                              : ""}
                            {formatMoney(
                              priceDifference
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-gray-500">
                          Invoice line total
                        </p>

                        <p className="mt-1 text-xl font-bold text-gray-950">
                          {formatMoney(
                            invoiceLineTotal
                          )}
                        </p>

                        {lineDifference !== 0 && (
                          <p
                            className={`mt-1 text-sm font-semibold ${
                              lineDifference > 0
                                ? "text-red-700"
                                : "text-green-700"
                            }`}
                          >
                            {lineDifference > 0
                              ? "+"
                              : ""}
                            {formatMoney(
                              lineDifference
                            )}{" "}
                            against order
                          </p>
                        )}
                      </div>
                    </div>

                    {!hasPriceChange &&
                      !hasQuantityChange && (
                        <div className="mt-5 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">
                          <CheckCircle2
                            size={18}
                          />
                          Quantity and price match
                          the order.
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="mt-6">
            <h2 className="text-xl font-bold text-gray-950">
              Delivery Summary
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-gray-500">
                  Original Order
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-950">
                  {formatMoney(
                    totals.originalTotal
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  Final Invoice
                </p>

                <p className="mt-1 text-2xl font-bold text-blue-900">
                  {formatMoney(
                    totals.invoiceTotal
                  )}
                </p>
              </div>

              <div
                className={`rounded-2xl p-4 ${
                  totals.difference > 0
                    ? "bg-red-50"
                    : totals.difference < 0
                    ? "bg-green-50"
                    : "bg-slate-50"
                }`}
              >
                <p className="text-sm text-gray-600">
                  Difference
                </p>

                <p
                  className={`mt-1 text-2xl font-bold ${
                    totals.difference > 0
                      ? "text-red-900"
                      : totals.difference < 0
                      ? "text-green-900"
                      : "text-gray-950"
                  }`}
                >
                  {differencePrefix}
                  {formatMoney(
                    totals.difference
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="text-sm text-orange-700">
                  Price Changes
                </p>

                <p className="mt-1 text-2xl font-bold text-orange-900">
                  {totals.priceChanges}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-gray-500">
                  Quantity Ordered
                </p>

                <p className="mt-1 text-xl font-bold">
                  {totals.orderedQuantity}
                </p>
              </div>

              <div className="rounded-2xl bg-green-50 p-4">
                <p className="text-sm text-green-700">
                  Quantity Received
                </p>

                <p className="mt-1 text-xl font-bold text-green-900">
                  {
                    totals.receivedQuantity
                  }
                </p>
              </div>

              <div className="rounded-2xl bg-red-50 p-4">
                <p className="text-sm text-red-700">
                  Short Delivered
                </p>

                <p className="mt-1 text-xl font-bold text-red-900">
                  {totals.shortQuantity}
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm text-gray-500">
              Inventory will increase by the
              quantity received. The invoice
              total uses the received quantity
              and actual invoice price.
            </p>

            {error && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 font-semibold text-red-800">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => router.back()}
              >
                Back
              </Button>

              {!cannotReceive && (
                <Button
                  onClick={
                    handleReceiveDelivery
                  }
                >
                  {saving
                    ? "Saving Delivery..."
                    : "Complete Delivery"}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </main>
    </ProtectedPage>
  );
}