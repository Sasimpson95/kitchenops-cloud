"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Archive,
  Edit3,
  PackagePlus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import ProductFormModal, {
  EMPTY_PRODUCT_FORM,
  productToForm,
  type ProductFormState,
} from "@/components/products/ProductFormModal";

import type {
  User,
} from "@/config/roles";

import type {
  Product,
} from "@/data/products";

import {
  getCurrentUser,
} from "@/lib/currentUser";

import {
  getProductStock,
  subscribeToInventoryChanges,
} from "@/lib/inventoryStore";

import {
  archiveProduct,
  createProduct,
  deleteAllArchivedProducts,
  deleteProductPermanently,
  getProducts,
  restoreProduct,
  subscribeToProductChanges,
  updateProduct,
} from "@/lib/productStore";

import {
  getActiveSuppliers,
  subscribeToSupplierChanges,
} from "@/lib/supplierStore";

function money(
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

function ProductsContent() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const [
    currentUser,
    setCurrentUser,
  ] = useState<User | null>(null);

  const [
    loadingUser,
    setLoadingUser,
  ] = useState(true);

  const [
    productList,
    setProductList,
  ] = useState<Product[]>([]);

  const [
    supplierVersion,
    setSupplierVersion,
  ] = useState(0);

  const [
    inventoryVersion,
    setInventoryVersion,
  ] = useState(0);

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("All");

  const [
    supplierFilter,
    setSupplierFilter,
  ] = useState("All");

  const [view, setView] =
    useState<
      "active" | "archived"
    >("active");

  const [showForm, setShowForm] =
    useState(false);

  const [
    editingProduct,
    setEditingProduct,
  ] = useState<Product | null>(
    null
  );

  const [form, setForm] =
    useState<ProductFormState>(
      EMPTY_PRODUCT_FORM
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const canManageProducts =
    currentUser?.role ===
    "operations";

  void supplierVersion;
  void inventoryVersion;

  const suppliers =
    getActiveSuppliers();

  const refreshProducts =
    useCallback(() => {
      setProductList(
        getProducts()
      );
    }, []);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setCurrentUser(user);
    setLoadingUser(false);
  }, [router]);

  useEffect(() => {
    refreshProducts();

    return subscribeToProductChanges(
      refreshProducts
    );
  }, [refreshProducts]);

  useEffect(() => {
    return subscribeToSupplierChanges(
      () =>
        setSupplierVersion(
          (value) => value + 1
        )
    );
  }, []);

  useEffect(() => {
    return subscribeToInventoryChanges(
      () =>
        setInventoryVersion(
          (value) => value + 1
        )
    );
  }, []);

  useEffect(() => {
    if (
      !canManageProducts ||
      productList.length === 0
    ) {
      return;
    }

    const editValue =
      searchParams.get("edit");

    if (!editValue) {
      return;
    }

    const id = Number(editValue);

    const product =
      productList.find(
        (item) =>
          item.id === id
      );

    router.replace("/products", {
      scroll: false,
    });

    if (!product) {
      return;
    }

    setEditingProduct(product);
    setForm(
      productToForm(product)
    );
    setError("");
    setShowForm(true);
  }, [
    canManageProducts,
    productList,
    router,
    searchParams,
  ]);

  const baseProducts =
    productList.filter(
      (product) =>
        view === "active"
          ? product.active
          : !product.active
    );

  const categories =
    [
      "All",
      ...Array.from(
        new Set(
          baseProducts.map(
            (product) =>
              product.category
          )
        )
      ).sort(),
    ];

  const supplierNames =
    [
      "All",
      ...Array.from(
        new Set(
          baseProducts.map(
            (product) =>
              product.supplierName
          )
        )
      ).sort(),
    ];

  const filteredProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return baseProducts.filter(
        (product) => {
          const alternatives =
            product.alternativeSupplierIds
              .map(
                (id) =>
                  suppliers.find(
                    (supplier) =>
                      supplier.id === id
                  )?.name || ""
              )
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !query ||
            [
              product.name,
              product.category,
              product.supplierName,
              product.supplierCode,
              product.storageArea,
              product.shelf,
              product.binLocation,
              alternatives,
            ]
              .join(" ")
              .toLowerCase()
              .includes(query);

          return (
            matchesSearch &&
            (
              category === "All" ||
              product.category ===
                category
            ) &&
            (
              supplierFilter ===
                "All" ||
              product.supplierName ===
                supplierFilter
            )
          );
        }
      );
    }, [
      baseProducts,
      category,
      search,
      supplierFilter,
      suppliers,
    ]);

  function updateForm<
    K extends keyof ProductFormState,
  >(
    field: K,
    value: ProductFormState[K]
  ): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openAdd(): void {
    if (!canManageProducts) {
      return;
    }

    setEditingProduct(null);
    setForm({
      ...EMPTY_PRODUCT_FORM,
    });
    setError("");
    setShowForm(true);
  }

  function openEdit(
    product: Product
  ): void {
    if (!canManageProducts) {
      return;
    }

    setEditingProduct(product);
    setForm(
      productToForm(product)
    );
    setError("");
    setShowForm(true);
  }

  function closeForm(): void {
    setShowForm(false);
    setEditingProduct(null);
    setForm({
      ...EMPTY_PRODUCT_FORM,
    });
    setError("");
    setSaving(false);
  }

  function saveProduct(): void {
    if (
      !canManageProducts ||
      saving
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

      const input = {
        ...form,

        supplierId:
          supplier.id,

        supplierName:
          supplier.name,
      };

      if (editingProduct) {
        updateProduct(
          editingProduct.id,
          input
        );
      } else {
        createProduct(input);
      }

      closeForm();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The product could not be saved."
      );

      setSaving(false);
    }
  }

  function archive(
    product: Product
  ): void {
    if (!canManageProducts) {
      return;
    }

    if (
      !window.confirm(
        `Archive ${product.name}?`
      )
    ) {
      return;
    }

    archiveProduct(product.id);
  }


  function permanentlyDelete(
    product: Product
  ): void {
    if (!canManageProducts) {
      return;
    }

    if (
      !window.confirm(
        `Permanently delete ${product.name}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      deleteProductPermanently(
        product.id
      );
    } catch (caughtError) {
      window.alert(
        caughtError instanceof Error
          ? caughtError.message
          : "The product could not be deleted."
      );
    }
  }

  function removeAllArchived(): void {
    if (!canManageProducts) {
      return;
    }

    const archivedCount =
      productList.filter(
        (product) =>
          !product.active
      ).length;

    if (
      archivedCount === 0
    ) {
      window.alert(
        "There are no archived products to delete."
      );
      return;
    }

    if (
      !window.confirm(
        `Permanently delete all ${archivedCount} archived product${archivedCount === 1 ? "" : "s"}? This cannot be undone.`
      )
    ) {
      return;
    }

    deleteAllArchivedProducts();
  }

  if (
    loadingUser ||
    !currentUser
  ) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="font-semibold text-gray-600">
            Loading Products...
          </p>
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-950">
                Products
              </h1>

              <p className="mt-2 text-gray-600">
                Master product information for purchasing, inventory, waste and stocktakes.
              </p>
            </div>

            {canManageProducts && (
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-800 px-6 py-3 font-semibold text-white transition hover:bg-green-900"
              >
                <PackagePlus size={20} />
                New Product
              </button>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setView("active")
              }
              className={`rounded-full px-5 py-2 font-semibold ${
                view === "active"
                  ? "bg-green-800 text-white"
                  : "border border-gray-300 bg-white text-gray-700"
              }`}
            >
              Active
            </button>

            <button
              type="button"
              onClick={() =>
                setView("archived")
              }
              className={`rounded-full px-5 py-2 font-semibold ${
                view === "archived"
                  ? "bg-gray-800 text-white"
                  : "border border-gray-300 bg-white text-gray-700"
              }`}
            >
              Archived
            </button>

            {canManageProducts &&
              view === "archived" && (
              <button
                type="button"
                onClick={removeAllArchived}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2 font-semibold text-red-700 hover:bg-red-50"
              >
                <Trash2 size={17} />
                Delete All Archived
              </button>
            )}
          </div>

          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1fr_240px_240px]">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search products, suppliers or locations..."
                  className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-11 outline-none focus:border-green-800"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 hover:bg-slate-100"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-green-800"
              >
                {categories.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item === "All"
                        ? "All categories"
                        : item}
                    </option>
                  )
                )}
              </select>

              <select
                value={supplierFilter}
                onChange={(event) =>
                  setSupplierFilter(
                    event.target.value
                  )
                }
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-green-800"
              >
                {supplierNames.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item === "All"
                        ? "All suppliers"
                        : item}
                    </option>
                  )
                )}
              </select>
            </div>
          </section>

          {filteredProducts.length ===
          0 ? (
            <div className="mt-8 rounded-3xl bg-white p-12 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-gray-950">
                No products found
              </h2>

              <p className="mt-2 text-gray-600">
                Try changing the search or filters.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map(
                (product) => {
                  const stock =
                    getProductStock(
                      "pudding-pantry",
                      currentUser.role ===
                        "operations"
                        ? "beeston"
                        : currentUser.site
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            ),
                      product.id
                    );

                  const unitCost =
                    product.purchaseQuantity >
                    0
                      ? product.price /
                        product.purchaseQuantity
                      : 0;

                  const alternativeNames =
                    product.alternativeSupplierIds
                      .map(
                        (id) =>
                          suppliers.find(
                            (supplier) =>
                              supplier.id ===
                              id
                          )?.name
                      )
                      .filter(Boolean);

                  return (
                    <article
                      key={product.id}
                      className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-950">
                            {product.name}
                          </h2>

                          <p className="mt-1 text-sm text-gray-500">
                            {product.category}
                          </p>
                        </div>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                          {product.supplierName}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm text-gray-500">
                            Current Stock
                          </p>

                          <p className="mt-1 text-2xl font-bold text-gray-950">
                            {stock}{" "}
                            {product.inventoryUnit}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-green-50 p-4">
                          <p className="text-sm text-green-700">
                            Unit Cost
                          </p>

                          <p className="mt-1 text-2xl font-bold text-green-950">
                            {money(unitCost)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-2 text-sm text-gray-600">
                        <p>
                          <strong>
                            Purchase:
                          </strong>{" "}
                          {
                            product.purchaseQuantity
                          }{" "}
                          {
                            product.inventoryUnit
                          }{" "}
                          per{" "}
                          {
                            product.orderUnit
                          }
                        </p>

                        <p>
                          <strong>
                            Storage:
                          </strong>{" "}
                          {
                            product.storageArea
                          }
                          {product.shelf
                            ? ` • ${product.shelf}`
                            : ""}
                          {product.binLocation
                            ? ` • ${product.binLocation}`
                            : ""}
                        </p>

                        <p>
                          <strong>
                            Lead Time:
                          </strong>{" "}
                          {
                            product.leadTimeDays
                          }{" "}
                          days
                        </p>

                        <p>
                          <strong>
                            Alternatives:
                          </strong>{" "}
                          {alternativeNames.length
                            ? alternativeNames.join(
                                ", "
                              )
                            : "None"}
                        </p>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <Link
                          href={`/products/${product.id}`}
                          className={`rounded-xl bg-green-800 px-4 py-3 text-center font-semibold text-white transition hover:bg-green-900 ${
                            canManageProducts
                              ? ""
                              : "sm:col-span-2"
                          }`}
                        >
                          View Product
                        </Link>

                        {canManageProducts &&
                          product.active && (
                            <>
                              <Link
                                href={`/products/${product.id}`}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:bg-slate-50"
                              >
                                <Edit3
                                  size={18}
                                />
                                Open & Edit
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  archive(
                                    product
                                  )
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-700 transition hover:bg-red-50 sm:col-span-2"
                              >
                                <Archive
                                  size={18}
                                />
                                Archive
                              </button>
                            </>
                          )}

                        {canManageProducts &&
                          !product.active && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  restoreProduct(
                                    product.id
                                  )
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-800 px-4 py-3 font-semibold text-white transition hover:bg-green-900"
                              >
                                <RotateCcw
                                  size={18}
                                />
                                Restore
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  permanentlyDelete(
                                    product
                                  )
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-700 transition hover:bg-red-50"
                              >
                                <Trash2
                                  size={18}
                                />
                                Delete
                              </button>
                            </>
                          )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>

        {showForm &&
          canManageProducts && (
            <ProductFormModal
              form={form}
              editingProduct={
                editingProduct
              }
              suppliers={
                suppliers
              }
              saving={saving}
              error={error}
              onChange={updateForm}
              onSave={saveProduct}
              onClose={closeForm}
            />
          )}
      </main>
    </ProtectedPage>
  );
}

function ProductsLoading() {
  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <p className="font-semibold text-gray-700">
              Loading products...
            </p>
          </div>
        </div>
      </main>
    </ProtectedPage>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <ProductsLoading />
      }
    >
      <ProductsContent />
    </Suspense>
  );
}