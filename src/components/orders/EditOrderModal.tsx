"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SearchBar from "@/components/ui/SearchBar";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";

import type { PurchaseOrder } from "@/data/orders";
import { products } from "@/data/products";
import { updatePurchaseOrder } from "@/lib/orderStore";

type EditOrderModalProps = {
  order: PurchaseOrder;
  onClose: () => void;
  onSaved: (order: PurchaseOrder) => void;
};

type Basket = {
  [productId: number]: number;
};

export default function EditOrderModal({
  order,
  onClose,
  onSaved,
}: EditOrderModalProps) {
  const startingBasket = order.items.reduce<Basket>(
    (basket, item) => {
      basket[item.productId] = item.quantity;
      return basket;
    },
    {}
  );

  const [basket, setBasket] =
    useState<Basket>(startingBasket);

  const [search, setSearch] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    order.requestedDeliveryDate === "Not set"
      ? ""
      : order.requestedDeliveryDate
  );

  const [notes, setNotes] = useState(order.notes);
  const [error, setError] = useState("");

  const supplierProducts = products.filter(
    (product) =>
      product.supplierName === order.supplierName &&
      product.name
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const basketItems = products
    .filter((product) => (basket[product.id] || 0) > 0)
    .map((product) => ({
      product,
      quantity: basket[product.id],
      total:
        product.price * basket[product.id],
    }));

  const totalItems = basketItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const estimatedTotal = basketItems.reduce(
    (total, item) => total + item.total,
    0
  );

  function increase(productId: number) {
    setBasket((current) => ({
      ...current,
      [productId]:
        (current[productId] || 0) + 1,
    }));
  }

  function decrease(productId: number) {
    setBasket((current) => {
      const nextQuantity = Math.max(
        0,
        (current[productId] || 0) - 1
      );

      return {
        ...current,
        [productId]: nextQuantity,
      };
    });
  }

  function removeItem(productId: number) {
    setBasket((current) => ({
      ...current,
      [productId]: 0,
    }));
  }

  function saveDraft() {
    if (basketItems.length === 0) {
      setError(
        "Add at least one product to the order."
      );
      return;
    }

    try {
      setError("");

      const updatedOrder = updatePurchaseOrder(
        order.id,
        {
          items: basketItems.map(
            ({ product, quantity }) => ({
              productId: product.id,
              productName: product.name,
              orderUnit: product.orderUnit,
              quantity,
              unitPrice: product.price,
            })
          ),

          requestedDeliveryDate:
            deliveryDate || "Not set",

          notes,
        }
      );

      onSaved(updatedOrder);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The order could not be saved."
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-green-800">
              Edit Draft Order
            </p>

            <h2 className="mt-1 text-3xl font-bold text-gray-950">
              {order.orderNumber}
            </h2>

            <p className="mt-2 text-gray-600">
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

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
          <div>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search supplier products..."
            />

            {supplierProducts.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center">
                <h3 className="text-xl font-bold text-gray-950">
                  No products found
                </h3>

                <p className="mt-2 text-gray-500">
                  No products from this supplier match
                  your search.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {supplierProducts.map((product) => {
                  const quantity =
                    basket[product.id] || 0;

                  return (
                    <Card key={product.id}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-950">
                            {product.name}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            {product.category}
                          </p>
                        </div>

                        <p className="font-bold text-gray-950">
                          £{product.price.toFixed(2)}
                        </p>
                      </div>

                      <p className="mt-4 text-sm text-gray-600">
                        <strong>Order Unit:</strong>{" "}
                        {product.orderUnit}
                      </p>

                      <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                        <button
                          type="button"
                          onClick={() =>
                            decrease(product.id)
                          }
                          disabled={quantity <= 0}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl font-bold shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          −
                        </button>

                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {quantity}
                          </p>

                          <p className="text-xs font-semibold text-gray-500">
                            {product.orderUnit}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            increase(product.id)
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-green-800 text-2xl font-bold text-white shadow-sm hover:bg-green-900"
                        >
                          +
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="text-xl font-bold text-gray-950">
                Order Items
              </h3>

              {basketItems.length === 0 ? (
                <p className="mt-5 text-gray-500">
                  No products added.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {basketItems.map(
                    ({
                      product,
                      quantity,
                      total,
                    }) => (
                      <div
                        key={product.id}
                        className="rounded-2xl bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-gray-950">
                              {product.name}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {quantity} ×{" "}
                              {product.orderUnit}
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-700">
                              £{total.toFixed(2)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(product.id)
                            }
                            className="text-sm font-semibold text-red-700 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              <div className="mt-6 border-t pt-5">
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Total items
                  </span>

                  <span className="font-bold">
                    {totalItems}
                  </span>
                </div>

                <div className="mt-3 flex justify-between">
                  <span className="text-gray-500">
                    Estimated total
                  </span>

                  <span className="text-xl font-bold">
                    £{estimatedTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="space-y-5">
                <Input
                  label="Requested Delivery Date"
                  type="date"
                  value={deliveryDate}
                  onChange={setDeliveryDate}
                />

                <Textarea
                  label="Order Notes"
                  placeholder="Add any notes..."
                  value={notes}
                  onChange={setNotes}
                />
              </div>
            </Card>

            {error && (
              <div className="rounded-2xl bg-red-50 p-4 font-semibold text-red-800">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
              >
                Cancel
              </Button>

              <Button onClick={saveDraft}>
                Save Draft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}