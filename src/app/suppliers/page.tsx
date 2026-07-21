"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import {
  Archive,
  Edit3,
  Eye,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import SupplierModal from "@/components/suppliers/SupplierModal";

import type { User } from "@/config/roles";

import { getCurrentUser } from "@/lib/currentUser";

import type {
  Supplier,
} from "@/data/suppliers";

import {
  archiveSupplier,
  getSuppliers,
  restoreSupplier,
  subscribeToSupplierChanges,
} from "@/lib/supplierStore";

export default function SuppliersPage() {
  const router = useRouter();

  const [
    currentUser,
    setCurrentUser,
  ] = useState<User | null>(null);

  const [
    loadingUser,
    setLoadingUser,
  ] = useState(true);

  const [
    supplierList,
    setSupplierList,
  ] = useState<Supplier[]>([]);

  const [search, setSearch] =
    useState("");

  const [view, setView] = useState<
    "active" | "archived"
  >("active");

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editingSupplier,
    setEditingSupplier,
  ] = useState<Supplier | null>(
    null
  );

  const canManageSuppliers =
    currentUser?.role === "operations";

  const refreshSuppliers =
    useCallback(() => {
      setSupplierList(
        getSuppliers()
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
    refreshSuppliers();

    const unsubscribe =
      subscribeToSupplierChanges(
        refreshSuppliers
      );

    return unsubscribe;
  }, [refreshSuppliers]);

  const activeSuppliers =
    useMemo(
      () =>
        supplierList.filter(
          (supplier) =>
            supplier.active
        ),
      [supplierList]
    );

  const archivedSuppliers =
    useMemo(
      () =>
        supplierList.filter(
          (supplier) =>
            !supplier.active
        ),
      [supplierList]
    );

  const filteredSuppliers =
    useMemo(() => {
      const baseSuppliers =
        view === "active"
          ? activeSuppliers
          : archivedSuppliers;

      const normalisedSearch = search
        .trim()
        .toLowerCase();

      if (!normalisedSearch) {
        return baseSuppliers;
      }

      return baseSuppliers.filter(
        (supplier) =>
          supplier.name
            .toLowerCase()
            .includes(
              normalisedSearch
            ) ||
          supplier.contactName
            .toLowerCase()
            .includes(
              normalisedSearch
            ) ||
          supplier.email
            .toLowerCase()
            .includes(
              normalisedSearch
            )
      );
    }, [
      activeSuppliers,
      archivedSuppliers,
      search,
      view,
    ]);

  function openAddSupplier(): void {
    if (!canManageSuppliers) {
      return;
    }

    setEditingSupplier(null);
    setShowModal(true);
  }

  function openEditSupplier(
    supplier: Supplier
  ): void {
    if (!canManageSuppliers) {
      return;
    }

    setEditingSupplier(supplier);
    setShowModal(true);
  }

  function closeModal(): void {
    setShowModal(false);
    setEditingSupplier(null);
  }

  function handleArchive(
    supplier: Supplier
  ): void {
    if (!canManageSuppliers) {
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

  function handleRestore(
    supplier: Supplier
  ): void {
    if (!canManageSuppliers) {
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

  if (loadingUser) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="font-semibold text-gray-600">
            Loading Suppliers...
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
                Suppliers
              </h1>

              <p className="mt-2 text-gray-600">
                Suppliers used for ordering,
                deliveries and stock.
              </p>
            </div>

            {canManageSuppliers ? (
              <button
                type="button"
                onClick={openAddSupplier}
                className="flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white transition hover:bg-violet-900"
              >
                <Plus size={20} />
                New Supplier
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-800">
                <Eye size={18} />
                View-only access
              </div>
            )}
          </div>

          {!canManageSuppliers && (
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-800">
              <p className="font-semibold">
                Suppliers are managed
                centrally.
              </p>

              <p className="mt-1 text-sm">
                Managers and chefs can view
                supplier information, but only
                an operations account can add,
                edit, archive or restore
                suppliers.
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Active Suppliers
              </p>

              <p className="mt-1 text-3xl font-bold text-gray-950">
                {activeSuppliers.length}
              </p>
            </div>

            <div className="rounded-3xl bg-blue-50 p-5 shadow-sm">
              <p className="text-sm text-blue-700">
                Internal Kitchens
              </p>

              <p className="mt-1 text-3xl font-bold text-blue-900">
                {
                  activeSuppliers.filter(
                    (supplier) =>
                      supplier.supplierType === "internal"
                  ).length
                }
              </p>
            </div>

            <div className="rounded-3xl bg-slate-200 p-5 shadow-sm">
              <p className="text-sm text-gray-600">
                Archived
              </p>

              <p className="mt-1 text-3xl font-bold text-gray-950">
                {archivedSuppliers.length}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-3xl bg-white p-5 shadow-sm">
            <div className="relative">
              <Search
                size={21}
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
                placeholder="Search suppliers, contacts or email..."
                className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-12 outline-none transition focus:border-violet-800"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 hover:bg-slate-100"
                  aria-label="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="mt-5 flex gap-3 border-t pt-5">
              <button
                type="button"
                onClick={() =>
                  setView("active")
                }
                className={`rounded-full px-5 py-2 font-semibold transition ${
                  view === "active"
                    ? "bg-violet-800 text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-slate-50"
                }`}
              >
                Active
              </button>

              <button
                type="button"
                onClick={() =>
                  setView("archived")
                }
                className={`rounded-full px-5 py-2 font-semibold transition ${
                  view === "archived"
                    ? "bg-gray-800 text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-slate-50"
                }`}
              >
                Archived
              </button>
            </div>
          </div>

          {filteredSuppliers.length ===
          0 ? (
            <div className="mt-8 rounded-3xl bg-white p-12 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-gray-950">
                No suppliers found
              </h2>

              <p className="mt-3 text-gray-600">
                Try another search.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {filteredSuppliers.map(
                (supplier) => (
                  <div
                    key={supplier.id}
                    className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-950">
                          {supplier.name}
                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            supplier.supplierType === "internal"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-gray-700"
                          }`}>
                            {supplier.supplierType === "internal"
                              ? "Internal Kitchen"
                              : "External Supplier"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-gray-500">
                          {supplier.supplierType === "internal"
                            ? supplier.linkedSiteName || "KitchenOps site"
                            : supplier.contactName}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
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

                    <div className="mt-5 space-y-4 rounded-2xl bg-slate-50 p-4 text-sm">
                      {supplier.supplierType === "internal" ? (
                        <div>
                          <p className="text-gray-500">
                            Supplying Site
                          </p>
                          <p className="font-semibold text-gray-900">
                            {supplier.linkedSiteName || "Not set"}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="text-gray-500">Email</p>
                            <p className="font-semibold text-gray-900">
                              {supplier.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Phone</p>
                            <p className="font-semibold text-gray-900">
                              {supplier.phone}
                            </p>
                          </div>
                        </>
                      )}

                      <div>
                        <p className="text-gray-500">
                          Lead Time
                        </p>

                        <p className="font-semibold text-gray-900">
                          {
                            supplier.leadTime
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">
                          Delivery Days
                        </p>

                        <p className="font-semibold text-gray-900">
                          {supplier
                            .deliveryDays
                            .length > 0
                            ? supplier.deliveryDays.join(
                                ", "
                              )
                            : "Not set"}
                        </p>
                      </div>
                    </div>

                    {supplier.notes && (
                      <p className="mt-4 text-sm text-gray-500">
                        {supplier.notes}
                      </p>
                    )}

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <Link
                        href={`/suppliers/${supplier.id}`}
                        className={`rounded-xl bg-violet-800 px-4 py-3 text-center font-semibold text-white transition hover:bg-violet-900 ${
                          !canManageSuppliers
                            ? "sm:col-span-2"
                            : ""
                        }`}
                      >
                        View Supplier
                      </Link>

                      {canManageSuppliers &&
                        supplier.active && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                openEditSupplier(
                                  supplier
                                )
                              }
                              className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:bg-slate-50"
                            >
                              <Edit3
                                size={18}
                              />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleArchive(
                                  supplier
                                )
                              }
                              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-700 transition hover:bg-red-50 sm:col-span-2"
                            >
                              <Archive
                                size={18}
                              />
                              Archive Supplier
                            </button>
                          </>
                        )}

                      {canManageSuppliers &&
                        !supplier.active && (
                          <button
                            type="button"
                            onClick={() =>
                              handleRestore(
                                supplier
                              )
                            }
                            className="flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-4 py-3 font-semibold text-white transition hover:bg-violet-900 sm:col-span-2"
                          >
                            <RotateCcw
                              size={18}
                            />
                            Restore Supplier
                          </button>
                        )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {showModal &&
            canManageSuppliers && (
              <SupplierModal
                supplier={
                  editingSupplier
                }
                onClose={closeModal}
              />
            )}
        </div>
      </main>
    </ProtectedPage>
  );
}