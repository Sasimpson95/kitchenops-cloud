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
  Boxes,
  Edit3,
  RotateCcw,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import ProductActivity from "@/components/products/ProductActivity";
import ProductFormModal, {
  productToForm,
  type ProductFormState,
} from "@/components/products/ProductFormModal";
import ProductHealth from "@/components/products/ProductHealth";
import ProductInformation from "@/components/products/ProductInformation";

import type {
  User,
} from "@/config/roles";

import type {
  Product,
} from "@/data/products";

import {
  getCurrentUser,
} from "@/lib/currentUser";
import { getActiveBusinessId } from "@/lib/businessWorkspace";
import { useBusinessSites } from "@/lib/useBusinessSites";

import {
  getInventoryMovements,
  getInventoryStock,
  getProductStock,
  subscribeToInventoryChanges,
} from "@/lib/inventoryStore";

import {
  getOrders,
  subscribeToOrderChanges,
} from "@/lib/orderStore";

import {
  archiveProduct,
  getProductById,
  getProductStockValue,
  getProductUnitCost,
  restoreProduct,
  subscribeToProductChanges,
  updateProduct,
} from "@/lib/productStore";

import {
  getActiveSuppliers,
  subscribeToSupplierChanges,
} from "@/lib/supplierStore";

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ProductTab =
  | "information"
  | "activity";

const SITE_NAMES: Record<string, string> = {};

function formatMoney(
  value: number,
  digits = 2
): string {
  return new Intl.NumberFormat(
    "en-GB",
    {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits:
        digits,
    }
  ).format(value);
}

function getSiteId(
  siteName: string
): string {
  return siteName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export default function ProductPage({
  params,
}: ProductPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const productId = Number(id);
  const { sites } = useBusinessSites();

  const [
    currentUser,
    setCurrentUser,
  ] = useState<User | null>(null);

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [tab, setTab] =
    useState<ProductTab>(
      "information"
    );

  const [showEdit, setShowEdit] =
    useState(false);

  const [form, setForm] =
    useState<ProductFormState | null>(
      null
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    inventoryVersion,
    setInventoryVersion,
  ] = useState(0);

  const [
    orderVersion,
    setOrderVersion,
  ] = useState(0);

  const [
    supplierVersion,
    setSupplierVersion,
  ] = useState(0);

  void inventoryVersion;
  void orderVersion;
  void supplierVersion;

  const canManageProducts =
    currentUser?.role ===
    "operations";

  const suppliers =
    getActiveSuppliers();

  const refreshProduct =
    useCallback(() => {
      if (
        !Number.isFinite(productId)
      ) {
        setProduct(null);
        setLoading(false);
        return;
      }

      setProduct(
        getProductById(productId) ??
          null
      );

      setLoading(false);
    }, [productId]);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setCurrentUser(user);
  }, [router]);

  useEffect(() => {
    refreshProduct();

    return subscribeToProductChanges(
      refreshProduct
    );
  }, [refreshProduct]);

  useEffect(() => {
    return subscribeToInventoryChanges(
      () =>
        setInventoryVersion(
          (value) => value + 1
        )
    );
  }, []);

  useEffect(() => {
    return subscribeToOrderChanges(
      () =>
        setOrderVersion(
          (value) => value + 1
        )
    );
  }, []);

  useEffect(() => {
    return subscribeToSupplierChanges(
      () =>
        setSupplierVersion(
          (value) => value + 1
        )
    );
  }, []);

  const allMovements =
    getInventoryMovements();

  const allOrders = getOrders();

  const allSiteStocks = useMemo(() => {
    if (!product) return [];

    const businessId = getActiveBusinessId();
    return sites.map((site) => ({
      siteId: site.id,
      siteName: site.name,
      stock: getProductStock(businessId, site.id, product.id),
    }));
  }, [product, inventoryVersion, sites]);

  const visibleSiteStocks =
    useMemo(() => {
      if (!currentUser) {
        return [];
      }

      if (
        currentUser.role ===
        "operations"
      ) {
        return allSiteStocks;
      }

      const assignedSiteId =
        getSiteId(
          currentUser.site
        );

      return allSiteStocks.filter(
        (site) =>
          site.siteId ===
          assignedSiteId
      );
    }, [
      allSiteStocks,
      currentUser,
    ]);

  const currentStock =
    visibleSiteStocks.reduce(
      (total, site) =>
        total + site.stock,
      0
    );

  const unitCost = product
    ? getProductUnitCost(product)
    : 0;

  const stockValue = product
    ? getProductStockValue(
        product,
        currentStock
      )
    : 0;

  const alternativeSuppliers =
    product
      ? suppliers.filter(
          (supplier) =>
            product.alternativeSupplierIds.includes(
              supplier.id
            )
        )
      : [];

  function updateForm<
    K extends keyof ProductFormState,
  >(
    field: K,
    value: ProductFormState[K]
  ): void {
    setForm((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current
    );
  }

  function openEdit(): void {
    if (
      !product ||
      !canManageProducts
    ) {
      return;
    }

    setForm(
      productToForm(product)
    );

    setError("");
    setShowEdit(true);
  }

  function saveEdit(): void {
    if (
      !product ||
      !form ||
      saving ||
      !canManageProducts
    ) {
      return;
    }

    const supplier =
      suppliers.find(
        (item) =>
          item.id ===
          form.supplierId
      );

    if (!supplier) {
      setError(
        "Choose a preferred supplier."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      updateProduct(product.id, {
        ...form,
        supplierId:
          supplier.id,
        supplierName:
          supplier.name,
      });

      setShowEdit(false);
      setForm(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The product could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleArchive(): void {
    if (
      !product ||
      !canManageProducts
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Archive ${product.name}? It will remain in historical records.`
      );

    if (!confirmed) {
      return;
    }

    archiveProduct(product.id);
  }

  function handleRestore(): void {
    if (
      !product ||
      !canManageProducts
    ) {
      return;
    }

    restoreProduct(product.id);
  }

  if (
    loading ||
    !currentUser
  ) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="font-semibold text-gray-600">
            Loading Product...
          </p>
        </main>
      </ProtectedPage>
    );
  }

  if (!product) {
    return (
      <ProtectedPage>
        <main className="min-h-screen bg-slate-100 p-8">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-950">
              Product not found
            </h1>

            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 font-semibold text-violet-800 hover:underline"
            >
              <ArrowLeft size={18} />
              Back to Products
            </Link>
          </div>
        </main>
      </ProtectedPage>
    );
  }

  const status =
    currentStock <= 0
      ? {
          label:
            "Out of Stock",
          className:
            "bg-gray-900 text-white",
        }
      : currentStock <=
          product.minimumStock
        ? {
            label: "Reorder",
            className:
              "bg-red-100 text-red-800",
          }
        : currentStock <=
            product.reorderPoint
          ? {
              label: "Low Stock",
              className:
                "bg-orange-100 text-orange-800",
            }
          : currentStock >
              product.maximumStock
            ? {
                label:
                  "Overstock",
                className:
                  "bg-blue-100 text-blue-800",
              }
            : {
                label:
                  "Healthy",
                className:
                  "bg-violet-100 text-violet-800",
              };

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 font-semibold text-violet-800 hover:underline"
            >
              <ArrowLeft size={18} />
              Back to Products
            </Link>

            {canManageProducts && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openEdit}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 transition hover:bg-slate-50"
                >
                  <Edit3 size={18} />
                  Edit Product
                </button>

                {product.active ? (
                  <button
                    type="button"
                    onClick={
                      handleArchive
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    <Archive size={18} />
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
            )}
          </div>

          <section className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-bold text-gray-950">
                    {product.name}
                  </h1>

                  {!product.active && (
                    <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">
                      Archived
                    </span>
                  )}
                </div>

                <p className="mt-2 text-gray-500">
                  {product.category} •{" "}
                  {product.supplierName}
                </p>
              </div>

              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-gray-500">
                  Current Stock
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-950">
                  {currentStock}{" "}
                  {
                    product.inventoryUnit
                  }
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {currentUser.role ===
                  "operations"
                    ? "Across all sites"
                    : currentUser.site}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-5">
                <p className="text-sm text-emerald-700">
                  Current Value
                </p>

                <p className="mt-1 text-3xl font-bold text-emerald-950">
                  {formatMoney(
                    stockValue
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-gray-500">
                  Unit Cost
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-950">
                  {formatMoney(
                    unitCost,
                    4
                  )}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Per{" "}
                  {
                    product.inventoryUnit
                  }
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-gray-500">
                  Total Movements
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-950">
                  {
                    allMovements.filter(
                      (movement) =>
                        movement.productId ===
                        product.id
                    ).length
                  }
                </p>
              </div>
            </div>

            {visibleSiteStocks.length >
              1 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {visibleSiteStocks.map(
                  (site) => (
                    <div
                      key={site.siteId}
                      className="rounded-2xl border border-gray-200 p-4"
                    >
                      <p className="text-sm text-gray-500">
                        {site.siteName}
                      </p>

                      <p className="mt-1 text-xl font-bold text-gray-950">
                        {site.stock}{" "}
                        {
                          product.inventoryUnit
                        }
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setTab(
                  "information"
                )
              }
              className={`rounded-xl px-5 py-3 font-semibold transition ${
                tab ===
                "information"
                  ? "bg-violet-800 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-slate-50"
              }`}
            >
              Product Information
            </button>

            <button
              type="button"
              onClick={() =>
                setTab("activity")
              }
              className={`rounded-xl px-5 py-3 font-semibold transition ${
                tab === "activity"
                  ? "bg-violet-800 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-slate-50"
              }`}
            >
              Product Activity
            </button>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
            <div>
              {tab ===
              "information" ? (
                <ProductInformation
                  product={product}
                  alternativeSuppliers={
                    alternativeSuppliers
                  }
                />
              ) : (
                <ProductActivity
                  productId={
                    product.id
                  }
                  inventoryUnit={
                    product.inventoryUnit
                  }
                  movements={
                    allMovements
                  }
                  orders={
                    allOrders
                  }
                />
              )}
            </div>

            <div>
              <ProductHealth
                product={product}
              />

              <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Boxes
                    size={22}
                    className="text-violet-800"
                  />

                  <h2 className="text-xl font-bold text-gray-950">
                    Purchase Conversion
                  </h2>
                </div>

                <div className="mt-5 rounded-2xl bg-violet-50 p-5 text-center">
                  <p className="text-sm text-violet-700">
                    1{" "}
                    {
                      product.orderUnit
                    }
                  </p>

                  <p className="my-2 text-2xl font-bold text-violet-950">
                    =
                  </p>

                  <p className="text-2xl font-bold text-violet-950">
                    {
                      product.purchaseQuantity
                    }{" "}
                    {
                      product.inventoryUnit
                    }
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>

        {showEdit &&
          form &&
          canManageProducts && (
            <ProductFormModal
              form={form}
              editingProduct={
                product
              }
              suppliers={
                suppliers
              }
              saving={saving}
              error={error}
              onChange={updateForm}
              onSave={saveEdit}
              onClose={() => {
                setShowEdit(false);
                setForm(null);
                setError("");
              }}
            />
          )}
      </main>
    </ProtectedPage>
  );
}
