"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";

import Card from "@/components/ui/Card";

import type { Product } from "@/data/products";
import type { Supplier } from "@/data/suppliers";

import {
  getActiveProducts,
  subscribeToProductChanges,
} from "@/lib/productStore";

import {
  getActiveSuppliers,
  subscribeToSupplierChanges,
} from "@/lib/supplierStore";

import { createPurchaseOrder } from "@/lib/orderStore";

type NewOrderModalProps = {
  siteId: string;
  siteName: string;
  onClose: () => void;
};

type OrderStep = "supplier" | "products" | "review";
type Basket = Record<number, number>;

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

function sameSupplier(
  product: Product,
  supplier: Supplier | null
): boolean {
  if (!supplier) return false;

  return (
    product.supplierId === supplier.id ||
    product.supplierName.trim().toLowerCase() ===
      supplier.name.trim().toLowerCase()
  );
}

export default function NewOrderModal({
  siteId,
  siteName,
  onClose,
}: NewOrderModalProps) {
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] =
    useState<number | null>(null);

  const [step, setStep] = useState<OrderStep>("supplier");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [basket, setBasket] = useState<Basket>({});
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refreshSuppliers = useCallback(() => {
    setSupplierList(getActiveSuppliers());
  }, []);

  const refreshProducts = useCallback(() => {
    setProductList(getActiveProducts());
  }, []);

  useEffect(() => {
    refreshSuppliers();
    refreshProducts();

    const unsubscribeSuppliers = subscribeToSupplierChanges(
      refreshSuppliers
    );

    const unsubscribeProducts = subscribeToProductChanges(
      refreshProducts
    );

    return () => {
      unsubscribeSuppliers();
      unsubscribeProducts();
    };
  }, [refreshProducts, refreshSuppliers]);

  const selectedSupplier = useMemo(
    () =>
      supplierList.find(
        (supplier) => supplier.id === selectedSupplierId
      ) ?? null,
    [selectedSupplierId, supplierList]
  );

  const filteredSuppliers = useMemo(() => {
    const query = supplierSearch.trim().toLowerCase();

    if (!query) return supplierList;

    return supplierList.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(query) ||
        supplier.contactName.toLowerCase().includes(query)
    );
  }, [supplierList, supplierSearch]);

  const supplierProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    return productList
      .filter((product) => sameSupplier(product, selectedSupplier))
      .filter(
        (product) =>
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.supplierCode.toLowerCase().includes(query)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [productList, productSearch, selectedSupplier]);

  const basketItems = useMemo(
    () =>
      productList
        .filter(
          (product) =>
            sameSupplier(product, selectedSupplier) &&
            (basket[product.id] ?? 0) > 0
        )
        .map((product) => {
          const quantity = basket[product.id] ?? 0;

          return {
            product,
            quantity,
            total: product.price * quantity,
          };
        })
        .sort((a, b) => a.product.name.localeCompare(b.product.name)),
    [basket, productList, selectedSupplier]
  );

  const totalItems = basketItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const estimatedTotal = basketItems.reduce(
    (total, item) => total + item.total,
    0
  );

  function chooseSupplier(supplier: Supplier): void {
    setSelectedSupplierId(supplier.id);
    setBasket({});
    setProductSearch("");
    setError("");
    setStep("products");
  }

  function changeSupplier(): void {
    setSelectedSupplierId(null);
    setBasket({});
    setSupplierSearch("");
    setProductSearch("");
    setError("");
    setStep("supplier");
  }

  function setQuantity(productId: number, quantity: number): void {
    const safeQuantity = Math.max(0, Math.floor(quantity || 0));

    setBasket((current) => {
      if (safeQuantity === 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }

      return {
        ...current,
        [productId]: safeQuantity,
      };
    });
  }

  function increase(productId: number): void {
    setQuantity(productId, (basket[productId] ?? 0) + 1);
  }

  function decrease(productId: number): void {
    setQuantity(productId, (basket[productId] ?? 0) - 1);
  }

  function openReview(): void {
    if (!selectedSupplier) {
      setError("Choose a supplier first.");
      return;
    }

    if (basketItems.length === 0) {
      setError("Add at least one product to the order.");
      return;
    }

    setError("");
    setStep("review");
  }

  function saveOrder(): void {
    if (saving) return;

    if (!selectedSupplier) {
      setError("Choose a supplier first.");
      return;
    }

    if (basketItems.length === 0) {
      setError("Add at least one product to the order.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      createPurchaseOrder({
        siteId,
        siteName,
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        requestedDeliveryDate: deliveryDate || "Not set",
        notes: notes.trim(),
        items: basketItems.map(({ product, quantity }) => ({
          productId: product.id,
          productName: product.name,
          orderUnit: product.orderUnit,
          quantity,
          unitPrice: product.price,
        })),
      });

      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The order could not be created."
      );
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-950">New Order</h2>
            <p className="mt-2 text-gray-600">
              Choose a supplier, add items, then review and send.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-300 text-gray-600 hover:bg-slate-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 flex gap-3 text-sm font-semibold">
          {[
            ["supplier", "1. Supplier"],
            ["products", "2. Products"],
            ["review", "3. Review"],
          ].map(([value, label]) => (
            <span
              key={value}
              className={`rounded-full px-4 py-2 ${
                step === value
                  ? "bg-green-800 text-white"
                  : "bg-slate-100 text-gray-600"
              }`}
            >
              {label}
            </span>
          ))}
        </div>

        {step === "supplier" && (
          <section className="mt-8">
            <h3 className="text-xl font-bold text-gray-950">
              Choose Supplier
            </h3>

            <div className="relative mt-5">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={supplierSearch}
                onChange={(event) => setSupplierSearch(event.target.value)}
                placeholder="Search suppliers..."
                className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none focus:border-green-800"
              />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredSuppliers.map((supplier) => (
                <button
                  type="button"
                  key={supplier.id}
                  onClick={() => chooseSupplier(supplier)}
                  className="rounded-3xl bg-slate-50 p-6 text-left transition hover:-translate-y-1 hover:bg-green-50 hover:shadow-md"
                >
                  <h4 className="text-xl font-bold text-gray-950">
                    {supplier.name}
                  </h4>
                  <p className="mt-2 text-sm text-gray-500">
                    {supplier.leadTime}
                  </p>
                  <p className="mt-5 font-semibold text-green-800">
                    Select →
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === "products" && selectedSupplier && (
          <section className="mt-8">
            <div className="flex items-center justify-between rounded-2xl bg-green-50 p-5">
              <div>
                <p className="text-sm font-semibold text-green-700">
                  Selected Supplier
                </p>
                <p className="text-2xl font-bold text-green-950">
                  {selectedSupplier.name}
                </p>
              </div>

              <button
                type="button"
                onClick={changeSupplier}
                className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
                Change Supplier
              </button>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
              <div>
                <div className="relative">
                  <Search
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Search supplier items..."
                    className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none focus:border-green-800"
                  />
                </div>

                {supplierProducts.length === 0 ? (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-10 text-center">
                    <h3 className="text-xl font-bold text-gray-950">
                      No products found
                    </h3>
                    <p className="mt-2 text-gray-500">
                      No active products are linked to {selectedSupplier.name}.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {supplierProducts.map((product) => {
                      const quantity = basket[product.id] ?? 0;

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
                              {formatMoney(product.price)}
                            </p>
                          </div>

                          <div className="mt-4 space-y-2 text-sm text-gray-600">
                            <p>
                              <strong>Order Unit:</strong> {product.orderUnit}
                            </p>
                            {product.supplierCode && (
                              <p>
                                <strong>Code:</strong> {product.supplierCode}
                              </p>
                            )}
                          </div>

                          <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                            <button
                              type="button"
                              onClick={() => decrease(product.id)}
                              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
                            >
                              <Minus size={18} />
                            </button>

                            <input
                              type="number"
                              min={0}
                              value={quantity}
                              onChange={(event) =>
                                setQuantity(product.id, Number(event.target.value))
                              }
                              className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-center text-xl font-bold"
                            />

                            <button
                              type="button"
                              onClick={() => increase(product.id)}
                              className="flex h-10 w-10 items-center justify-center rounded-full bg-green-800 text-white shadow-sm"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              <Card className="h-fit">
                <h3 className="text-xl font-bold text-gray-950">Basket</h3>

                {basketItems.length === 0 ? (
                  <p className="mt-5 text-gray-500">No items added yet.</p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {basketItems.map(({ product, quantity, total }) => (
                      <div
                        key={product.id}
                        className="rounded-xl bg-slate-50 p-4"
                      >
                        <div className="flex justify-between gap-4">
                          <div>
                            <p className="font-bold text-gray-950">
                              {product.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {quantity} × {product.orderUnit}
                            </p>
                          </div>
                          <p className="font-bold">{formatMoney(total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 border-t pt-5">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Total Items</span>
                    <strong className="text-gray-950">{totalItems}</strong>
                  </div>
                  <div className="mt-3 flex justify-between">
                    <span className="text-gray-500">Estimated Total</span>
                    <strong className="text-xl text-gray-950">
                      {formatMoney(estimatedTotal)}
                    </strong>
                  </div>

                  {error && (
                    <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={openReview}
                    disabled={basketItems.length === 0}
                    className="mt-5 w-full rounded-xl bg-green-800 px-5 py-3 font-semibold text-white disabled:bg-gray-300 disabled:text-gray-600"
                  >
                    Review Order
                  </button>
                </div>
              </Card>
            </div>
          </section>
        )}

        {step === "review" && selectedSupplier && (
          <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
            <Card>
              <h3 className="text-2xl font-bold text-gray-950">
                Review Order
              </h3>
              <p className="mt-2 text-gray-600">
                Check the order before sending.
              </p>

              <div className="mt-6 rounded-2xl bg-green-50 p-5">
                <p className="text-sm text-green-700">Supplier</p>
                <p className="mt-1 text-xl font-bold text-green-950">
                  {selectedSupplier.name}
                </p>
              </div>

              <div className="mt-6 grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Requested Delivery Date
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(event) => setDeliveryDate(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-800"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Order Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    placeholder="Optional notes..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-800"
                  />
                </div>
              </div>

              {error && (
                <p className="mt-5 rounded-xl bg-red-50 p-3 font-semibold text-red-800">
                  {error}
                </p>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStep("products")}
                  className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={saveOrder}
                  disabled={saving}
                  className="rounded-xl bg-green-800 px-6 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Sending..." : "Send Order"}
                </button>
              </div>
            </Card>

            <Card className="h-fit">
              <h3 className="text-xl font-bold text-gray-950">
                Order Summary
              </h3>
              <div className="mt-5 space-y-3">
                {basketItems.map(({ product, quantity, total }) => (
                  <div key={product.id} className="rounded-xl bg-slate-50 p-4">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-bold">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {quantity} × {product.orderUnit}
                        </p>
                      </div>
                      <p className="font-bold">{formatMoney(total)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t pt-5">
                <div className="flex justify-between">
                  <span>Total Items</span>
                  <strong>{totalItems}</strong>
                </div>
                <div className="mt-3 flex justify-between text-xl">
                  <span>Total</span>
                  <strong>{formatMoney(estimatedTotal)}</strong>
                </div>
              </div>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
