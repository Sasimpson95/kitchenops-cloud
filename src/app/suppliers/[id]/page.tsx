"use client";

import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Archive,
  ArrowLeft,
  Edit3,
  Eye,
  Package,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import SupplierModal from "@/components/suppliers/SupplierModal";

import type { User } from "@/config/roles";
import type { Supplier } from "@/data/suppliers";
import type { Product } from "@/data/products";
import type { PurchaseOrder } from "@/data/orders";

import { getCurrentUser } from "@/lib/currentUser";

import {
  archiveSupplier,
  getSupplierById,
  restoreSupplier,
  subscribeToSupplierChanges,
} from "@/lib/supplierStore";

import {
  getProducts,
  subscribeToProductChanges,
} from "@/lib/productStore";

import {
  getOrders,
} from "@/lib/orderStore";

type SupplierPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

function formatDate(
  value: string
): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
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

export default function SupplierPage({
  params,
}: SupplierPageProps) {
  const { id } = use(params);

  const router = useRouter();

  const supplierId = Number(id);

  const [
    currentUser,
    setCurrentUser,
  ] = useState<User | null>(null);

  const [
    supplier,
    setSupplier,
  ] = useState<Supplier | null>(null);

  const [
    productList,
    setProductList,
  ] = useState<Product[]>([]);

  const [
    orderList,
    setOrderList,
  ] = useState<PurchaseOrder[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    showEditModal,
    setShowEditModal,
  ] = useState(false);

  const canManageSuppliers =
    currentUser?.role === "operations";

  const refreshSupplier =
    useCallback(() => {
      if (
        !Number.isFinite(
          supplierId
        )
      ) {
        setSupplier(null);
        setLoading(false);
        return;
      }

      setSupplier(
        getSupplierById(
          supplierId
        ) ?? null
      );

      setLoading(false);
    }, [supplierId]);

  const refreshProducts =
    useCallback(() => {
      setProductList(
        getProducts()
      );
    }, []);

  const refreshOrders =
    useCallback(() => {
      setOrderList(
        getOrders()
      );
    }, []);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setCurrentUser(user);
  }, [router]);

  useEffect(() => {
    refreshSupplier();
    refreshProducts();
    refreshOrders();

    const unsubscribeSupplier =
      subscribeToSupplierChanges(
        refreshSupplier
      );

    const unsubscribeProducts =
      subscribeToProductChanges(
        refreshProducts
      );

    function handleStorageChange(
      event: StorageEvent
    ): void {
      if (
        event.key ===
        "kitchenops-purchase-orders"
      ) {
        refreshOrders();
      }
    }

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      unsubscribeSupplier();
      unsubscribeProducts();

      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, [
    refreshSupplier,
    refreshProducts,
    refreshOrders,
  ]);

  const supplierProducts =
    useMemo(() => {
      if (!supplier) {
        return [];
      }

      return productList
        .filter(
          (product) =>
            product.supplierId ===
            supplier.id
        )
        .sort(
          (
            firstProduct,
            secondProduct
          ) =>
            firstProduct.name.localeCompare(
              secondProduct.name
            )
        );
    }, [
      productList,
      supplier,
    ]);

  const activeSupplierProducts =
    useMemo(
      () =>
        supplierProducts.filter(
          (product) =>
            product.active
        ),
      [supplierProducts]
    );

  const supplierOrders =
    useMemo(() => {
      if (!supplier) {
        return [];
      }

      return orderList
        .filter(
          (order) =>
            order.supplierId ===
              supplier.id ||
            order.supplierName
              .trim()
              .toLowerCase() ===
              supplier.name
                .trim()
                .toLowerCase()
        )
        .sort(
          (
            firstOrder,
            secondOrder
          ) =>
            new Date(
              secondOrder.createdAt
            ).getTime() -
            new Date(
              firstOrder.createdAt
            ).getTime()
        );
    }, [
      orderList,
      supplier,
    ]);

  const activeOrders =
    supplierOrders.filter(
      (order) =>
        order.status === "Draft" ||
        order.status === "Sent"
    );

  const totalSpend =
    supplierOrders
      .filter(
        (order) =>
          order.status !==
          "Cancelled"
      )
      .reduce(
        (total, order) =>
          total + order.total,
        0
      );

  function handleArchive(): void {
    if (
      !supplier ||
      !canManageSuppliers
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Archive ${supplier.name}? Existing products and order history will remain linked.`
      );

    if (!confirmed) {
      return;
    }

    try {
      archiveSupplier(
        supplier.id
      );
    } catch (caughtError) {
      window.alert(
        caughtError instanceof Error
          ? caughtError.message
          : "The supplier could not be archived."
      );
    }
  }

  function handleRestore(): void {
    if (
      !supplier ||
      !canManageSuppliers
    ) {
      return;
    }

    try {
      restoreSupplier(
        supplier.id
      );
    } catch (caughtError) {
      window.alert(
        caughtError instanceof Error
          ? caughtError.message
          : "The supplier could not be restored."
      );
    }
  }

  if (loading) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="font-semibold text-gray-600">
            Loading supplier...
          </p>
        </main>
      </ProtectedPage>
    );
  }

  if (!supplier) {
    return (
      <ProtectedPage>
        <main className="min-h-screen bg-slate-100 p-8">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-950">
              Supplier not found
            </h1>

            <p className="mt-2 text-gray-600">
              This supplier may have
              been removed or the link
              may be incorrect.
            </p>

            <Link
              href="/suppliers"
              className="mt-6 inline-flex items-center gap-2 font-semibold text-violet-800 hover:underline"
            >
              <ArrowLeft size={18} />
              Back to Suppliers
            </Link>
          </div>
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <Link
              href="/suppliers"
              className="inline-flex items-center gap-2 font-semibold text-violet-800 hover:underline"
            >
              <ArrowLeft size={18} />
              Back to Suppliers
            </Link>

            {canManageSuppliers ? (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowEditModal(
                      true
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 transition hover:bg-slate-50"
                >
                  <Edit3 size={18} />
                  Edit Supplier
                </button>

                {supplier.active ? (
                  <button
                    type="button"
                    onClick={
                      handleArchive
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    <Archive
                      size={18}
                    />
                    Archive
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={
                      handleRestore
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-4 py-2 font-semibold text-white transition hover:bg-violet-900"
                  >
                    <RotateCcw
                      size={18}
                    />
                    Restore
                  </button>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800">
                <Eye size={18} />
                View-only access
              </div>
            )}
          </div>

          <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-bold text-gray-950">
                    {supplier.name}
                  </h1>

                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      supplier.active
                        ? "bg-violet-100 text-violet-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {supplier.active
                      ? "Active"
                      : "Archived"}
                  </span>
                </div>

                <p className="mt-2 text-gray-500">
                  {
                    supplier.contactName
                  }
                </p>
              </div>

              <div className="rounded-2xl bg-violet-50 px-5 py-4 text-right">
                <p className="text-sm text-violet-700">
                  Products Supplied
                </p>

                <p className="mt-1 text-3xl font-bold text-violet-900">
                  {
                    activeSupplierProducts.length
                  }
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-gray-500">
                  Lead Time
                </p>

                <p className="mt-1 text-xl font-bold text-gray-950">
                  {
                    supplier.leadTime
                  }
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-gray-500">
                  Phone
                </p>

                <p className="mt-1 text-xl font-bold text-gray-950">
                  {supplier.phone}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-gray-500">
                  Active Orders
                </p>

                <p className="mt-1 text-xl font-bold text-gray-950">
                  {
                    activeOrders.length
                  }
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-gray-500">
                  Recorded Spend
                </p>

                <p className="mt-1 text-xl font-bold text-gray-950">
                  {formatMoney(
                    totalSpend
                  )}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-950">
                  Supplier Details
                </h2>

                <div className="mt-5 space-y-5 text-sm">
                  <div>
                    <p className="text-gray-500">
                      Contact
                    </p>

                    <p className="font-semibold text-gray-950">
                      {
                        supplier.contactName
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Email
                    </p>

                    <a
                      href={`mailto:${supplier.email}`}
                      className="font-semibold text-violet-800 hover:underline"
                    >
                      {supplier.email}
                    </a>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Phone
                    </p>

                    <p className="font-semibold text-gray-950">
                      {supplier.phone}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Delivery Days
                    </p>

                    <p className="font-semibold text-gray-950">
                      {supplier
                        .deliveryDays
                        .length > 0
                        ? supplier.deliveryDays.join(
                            ", "
                          )
                        : "Not set"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Lead Time
                    </p>

                    <p className="font-semibold text-gray-950">
                      {
                        supplier.leadTime
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Notes
                    </p>

                    <p className="whitespace-pre-wrap font-semibold text-gray-950">
                      {supplier.notes ||
                        "No notes added."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <Package
                    size={23}
                    className="text-violet-800"
                  />

                  <div>
                    <h2 className="text-xl font-bold text-gray-950">
                      Products Supplied
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Products currently
                      linked to this supplier.
                    </p>
                  </div>
                </div>

                {supplierProducts.length ===
                0 ? (
                  <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-gray-500">
                    No products are linked
                    to this supplier yet.
                  </p>
                ) : (
                  <div className="mt-5 max-h-96 space-y-3 overflow-y-auto pr-1">
                    {supplierProducts.map(
                      (product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.id}`}
                          className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 transition hover:bg-violet-50"
                        >
                          <div>
                            <p className="font-semibold text-gray-950">
                              {
                                product.name
                              }
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {
                                product.orderUnit
                              }{" "}
                              •{" "}
                              {formatMoney(
                                product.price
                              )}
                            </p>
                          </div>

                          <div className="text-right">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                product.active
                                  ? "bg-violet-100 text-violet-800"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {product.active
                                ? "Active"
                                : "Archived"}
                            </span>

                            <p className="mt-2 text-violet-800">
                              →
                            </p>
                          </div>
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-gray-200 p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <ShoppingCart
                    size={23}
                    className="text-violet-800"
                  />

                  <div>
                    <h2 className="text-xl font-bold text-gray-950">
                      Recent Orders
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Purchase orders
                      placed with this
                      supplier.
                    </p>
                  </div>
                </div>

                <Link
                  href="/purchasing"
                  className="font-semibold text-violet-800 hover:underline"
                >
                  View Purchasing →
                </Link>
              </div>

              {supplierOrders.length ===
              0 ? (
                <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-gray-500">
                  No purchase orders have
                  been recorded for this
                  supplier.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {supplierOrders
                    .slice(0, 8)
                    .map((order) => (
                      <div
                        key={order.id}
                        className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                      >
                        <div>
                          <p className="font-bold text-gray-950">
                            {
                              order.orderNumber
                            }
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {
                              order.siteName
                            }{" "}
                            • Created{" "}
                            {formatDate(
                              order.createdAt
                            )}
                          </p>
                        </div>

                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                            order.status ===
                            "Completed"
                              ? "bg-violet-100 text-violet-800"
                              : order.status ===
                                "Cancelled"
                              ? "bg-red-100 text-red-800"
                              : order.status ===
                                "Sent"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.status}
                        </span>

                        <p className="font-bold text-gray-950 sm:text-right">
                          {formatMoney(
                            order.total
                          )}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {showEditModal &&
          canManageSuppliers && (
            <SupplierModal
              supplier={supplier}
              onClose={() =>
                setShowEditModal(
                  false
                )
              }
              onSaved={() => {
                setShowEditModal(
                  false
                );

                refreshSupplier();
              }}
            />
          )}
      </main>
    </ProtectedPage>
  );
}