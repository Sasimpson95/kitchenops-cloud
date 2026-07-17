"use client";

import {
  Archive,
  ArrowDown,
  ArrowUp,
  Edit3,
  MapPin,
  PackagePlus,
  Plus,
  RotateCcw,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import ProtectedPage from "@/components/ProtectedPage";

import type {
  User,
} from "@/config/roles";

import type {
  Product,
} from "@/data/products";

import {
  getCurrentUser,
} from "@/lib/currentUser";
import { useBusinessSites } from "@/lib/useBusinessSites";

import {
  archiveStorageArea,
  createStorageArea,
  deleteStorageArea,
  getStorageAreasForSite,
  moveStorageArea,
  restoreStorageArea,
  subscribeToStorageAreaChanges,
  updateStorageArea,
  type StorageArea,
} from "@/lib/storageAreaStore";

import {
  getActiveProducts,
  subscribeToProductChanges,
} from "@/lib/productStore";

import {
  assignProductToArea,
  getAssignmentsForArea,
  getAssignmentsForProduct,
  moveProductWithinArea,
  removeProductLocation,
  removeStorageAreaAssignments,
  renameStorageAreaAssignments,
  setPrimaryLocation,
  subscribeToProductLocationChanges,
  type ProductLocationAssignment,
} from "@/lib/productLocationStore";



function getSiteId(
  siteName: string
): string {
  return siteName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function ProductPicker({
  area,
  products,
  onClose,
}: {
  area: StorageArea;
  products: Product[];
  onClose: () => void;
}) {
  const [search, setSearch] =
    useState("");

  const [
    selectedIds,
    setSelectedIds,
  ] = useState<number[]>([]);

  const [error, setError] =
    useState("");

  const filtered =
    products.filter(
      (product) =>
        !search.trim() ||
        `${product.name} ${product.category}`
          .toLowerCase()
          .includes(
            search
              .trim()
              .toLowerCase()
          )
    );

  function toggle(
    productId: number
  ): void {
    setSelectedIds(
      (current) =>
        current.includes(
          productId
        )
          ? current.filter(
              (id) =>
                id !==
                productId
            )
          : [
              ...current,
              productId,
            ]
    );
  }

  function addSelected(): void {
    try {
      setError("");

      selectedIds.forEach(
        (productId) => {
          const product =
            products.find(
              (item) =>
                item.id ===
                productId
            );

          if (!product) {
            return;
          }

          const existing =
            getAssignmentsForProduct(
              area.siteId,
              product.id
            ).some(
              (assignment) =>
                assignment.storageAreaId ===
                area.id
            );

          if (!existing) {
            assignProductToArea({
              siteId:
                area.siteId,

              siteName:
                area.siteName,

              storageAreaId:
                area.id,

              storageAreaName:
                area.name,

              productId:
                product.id,

              productName:
                product.name,
            });
          }
        }
      );

      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Products could not be added."
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-950">
              Add Products
            </h2>

            <p className="mt-1 text-gray-500">
              {area.siteName}
              {" • "}
              {area.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search products..."
          className="mt-6 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
        />

        <div className="mt-5 space-y-3">
          {filtered.map(
            (product) => {
              const existingLocations =
                getAssignmentsForProduct(
                  area.siteId,
                  product.id
                );

              const alreadyHere =
                existingLocations.some(
                  (assignment) =>
                    assignment.storageAreaId ===
                    area.id
                );

              return (
                <label
                  key={product.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${
                    alreadyHere
                      ? "border-gray-200 bg-slate-50 opacity-60"
                      : "border-gray-200 bg-white hover:bg-violet-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.includes(
                        product.id
                      )
                    }
                    disabled={
                      alreadyHere
                    }
                    onChange={() =>
                      toggle(
                        product.id
                      )
                    }
                    className="mt-1 h-5 w-5 accent-violet-800"
                  />

                  <div>
                    <p className="font-bold text-gray-950">
                      {
                        product.name
                      }
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {
                        product.category
                      }
                    </p>

                    {existingLocations.length >
                      0 && (
                      <p className="mt-2 text-xs font-semibold text-blue-700">
                        Already stored in:{" "}
                        {existingLocations
                          .map(
                            (
                              assignment
                            ) =>
                              assignment.storageAreaName
                          )
                          .join(", ")}
                      </p>
                    )}

                    {alreadyHere && (
                      <p className="mt-1 text-xs font-semibold text-gray-500">
                        Already assigned to this area
                      </p>
                    )}
                  </div>
                </label>
              );
            }
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={addSelected}
            disabled={
              selectedIds.length ===
              0
            }
            className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900 disabled:opacity-50"
          >
            <PackagePlus
              size={18}
            />
            Add Selected
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignmentRow({
  assignment,
  index,
  total,
}: {
  assignment:
    ProductLocationAssignment;

  index: number;
  total: number;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-gray-950">
            {
              assignment.productName
            }
          </p>

          {assignment.isPrimary && (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-900">
              <Star size={13} />
              Main
            </span>
          )}

          {!assignment.isPrimary && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
              Backup
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-gray-500">
          Count order{" "}
          {index + 1}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            moveProductWithinArea(
              assignment.id,
              "up"
            )
          }
          disabled={
            index === 0
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 text-gray-700 disabled:opacity-40"
        >
          <ArrowUp
            size={17}
          />
        </button>

        <button
          type="button"
          onClick={() =>
            moveProductWithinArea(
              assignment.id,
              "down"
            )
          }
          disabled={
            index === total - 1
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 text-gray-700 disabled:opacity-40"
        >
          <ArrowDown
            size={17}
          />
        </button>

        {!assignment.isPrimary && (
          <button
            type="button"
            onClick={() =>
              setPrimaryLocation(
                assignment.id
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-yellow-300 px-4 py-2 font-semibold text-yellow-900 hover:bg-yellow-50"
          >
            <Star size={16} />
            Make Main
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            removeProductLocation(
              assignment.id
            )
          }
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50"
        >
          <Trash2
            size={16}
          />
          Remove
        </button>
      </div>
    </div>
  );
}

export default function StorageAreasPage() {
  const { sites: SITES } = useBusinessSites();
  const router =
    useRouter();

  const [
    currentUser,
    setCurrentUser,
  ] = useState<User | null>(
    null
  );

  const [
    selectedSiteId,
    setSelectedSiteId,
  ] = useState("");

  const [
    version,
    setVersion,
  ] = useState(0);

  const [
    showArchived,
    setShowArchived,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState<StorageArea | null>(
    null
  );

  const [
    addingProductsTo,
    setAddingProductsTo,
  ] = useState<StorageArea | null>(
    null
  );

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [name, setName] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [
    products,
    setProducts,
  ] = useState<Product[]>(
    []
  );

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "chef") {
      router.replace("/home");
      return;
    }

    setCurrentUser(user);
  }, [router]);

  useEffect(() => {
    function refresh(): void {
      setVersion(
        (value) =>
          value + 1
      );

      setProducts(
        getActiveProducts()
      );
    }

    refresh();

    const unsubscribeAreas =
      subscribeToStorageAreaChanges(
        refresh
      );

    const unsubscribeLocations =
      subscribeToProductLocationChanges(
        refresh
      );

    const unsubscribeProducts =
      subscribeToProductChanges(
        refresh
      );

    return () => {
      unsubscribeAreas();
      unsubscribeLocations();
      unsubscribeProducts();
    };
  }, []);

  const selectedSite =
    SITES.find(
      (site) =>
        site.id ===
        selectedSiteId
    ) ?? SITES[0];

  useEffect(() => {
    if (SITES.length === 0) {
      if (selectedSiteId) {
        setSelectedSiteId("");
      }
      return;
    }

    const selectedSiteStillExists = SITES.some(
      (site) => site.id === selectedSiteId
    );

    if (!selectedSiteStillExists) {
      setSelectedSiteId(SITES[0].id);
    }
  }, [SITES, selectedSiteId]);

  const areas =
    useMemo(
      () =>
        getStorageAreasForSite(
          selectedSiteId,
          true
        ).filter(
          (area) =>
            showArchived ||
            area.active
        ),
      [
        selectedSiteId,
        showArchived,
        version,
      ]
    );

  function openCreate(): void {
    setEditing(null);
    setName("");
    setDescription("");
    setError("");
    setShowForm(true);
  }

  function openEdit(
    area: StorageArea
  ): void {
    setEditing(area);
    setName(area.name);
    setDescription(
      area.description
    );
    setError("");
    setShowForm(true);
  }

  function closeForm(): void {
    setShowForm(false);
    setEditing(null);
    setName("");
    setDescription("");
    setError("");
  }

  function saveArea(): void {
    try {
      setError("");

      if (editing) {
        const updated =
          updateStorageArea(
            editing.id,
            {
              name,
              description,
            }
          );

        renameStorageAreaAssignments(
          updated.id,
          updated.name
        );
      } else {
        createStorageArea({
          siteId:
            selectedSite.id,

          siteName:
            selectedSite.name,

          name,
          description,
        });
      }

      closeForm();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The storage area could not be saved."
      );
    }
  }

  function removeArea(
    area: StorageArea
  ): void {
    const assigned =
      getAssignmentsForArea(
        area.id
      );

    if (
      assigned.length > 0
    ) {
      const archive =
        window.confirm(
          `${area.name} has ${assigned.length} assigned product location(s). Archive the area instead?`
        );

      if (archive) {
        archiveStorageArea(
          area.id
        );
      }

      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${area.name}? This cannot be undone.`
      );

    if (confirmed) {
      removeStorageAreaAssignments(
        area.id
      );

      deleteStorageArea(
        area.id
      );
    }
  }

  if (!currentUser) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          Loading Storage Areas...
        </main>
      </ProtectedPage>
    );
  }

  if (SITES.length === 0 || !selectedSite) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100 p-8">
          <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
            <MapPin
              className="mx-auto text-violet-700"
              size={42}
            />

            <h1 className="mt-4 text-2xl font-bold text-gray-950">
              No Sites Yet
            </h1>

            <p className="mt-3 text-gray-600">
              Storage areas belong to a site. Create your first site before adding storage areas.
            </p>

            <button
              type="button"
              onClick={() => router.push("/settings/sites")}
              className="mt-8 rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900"
            >
              Create First Site
            </button>
          </div>
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-bold text-gray-950">
                Storage Areas
              </h1>

              <p className="mt-2 text-gray-600">
                Assign products to main and backup locations for each site.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {currentUser.role ===
                "operations" && (
                <select
                  value={
                    selectedSiteId
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedSiteId(
                      event.target
                        .value
                    )
                  }
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-violet-800"
                >
                  {SITES.map(
                    (site) => (
                      <option
                        key={
                          site.id
                        }
                        value={
                          site.id
                        }
                      >
                        {
                          site.name
                        }
                      </option>
                    )
                  )}
                </select>
              )}

              <button
                type="button"
                onClick={
                  openCreate
                }
                className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900"
              >
                <Plus size={19} />
                New Area
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
            <div>
              <p className="font-bold text-gray-950">
                {
                  selectedSite.name
                }
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Products can appear in one main location and multiple backup locations.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={
                  showArchived
                }
                onChange={(
                  event
                ) =>
                  setShowArchived(
                    event.target
                      .checked
                  )
                }
                className="h-5 w-5 accent-violet-800"
              />
              Show archived
            </label>
          </div>

          {areas.length === 0 ? (
            <div className="mt-8 rounded-3xl bg-white p-12 text-center shadow-sm">
              <MapPin
                size={40}
                className="mx-auto text-gray-400"
              />

              <h2 className="mt-4 text-2xl font-bold text-gray-950">
                No storage areas
              </h2>
            </div>
          ) : (
            <div className="mt-8 space-y-5">
              {areas.map(
                (
                  area,
                  areaIndex
                ) => {
                  const assignments =
                    getAssignmentsForArea(
                      area.id
                    );

                  return (
                    <article
                      key={
                        area.id
                      }
                      className={`rounded-3xl bg-white p-6 shadow-sm ${
                        !area.active
                          ? "opacity-70"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
                            <MapPin
                              size={23}
                            />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-xl font-bold text-gray-950">
                                {
                                  area.name
                                }
                              </h2>

                              {!area.active && (
                                <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                                  Archived
                                </span>
                              )}

                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                                {
                                  assignments.length
                                }{" "}
                                product location
                                {assignments.length ===
                                1
                                  ? ""
                                  : "s"}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-gray-500">
                              {area.description ||
                                "No description added."}
                            </p>

                            <p className="mt-2 text-xs font-semibold text-gray-400">
                              Stocktake area order:{" "}
                              {areaIndex +
                                1}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {area.active && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  moveStorageArea(
                                    area.id,
                                    "up"
                                  )
                                }
                                disabled={
                                  areaIndex ===
                                  0
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 text-gray-700 disabled:opacity-40"
                              >
                                <ArrowUp
                                  size={17}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  moveStorageArea(
                                    area.id,
                                    "down"
                                  )
                                }
                                disabled={
                                  areaIndex ===
                                  areas.length -
                                    1
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 text-gray-700 disabled:opacity-40"
                              >
                                <ArrowDown
                                  size={17}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setAddingProductsTo(
                                    area
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-4 py-2 font-semibold text-white hover:bg-violet-900"
                              >
                                <PackagePlus
                                  size={17}
                                />
                                Add Products
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    area
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-slate-50"
                              >
                                <Edit3
                                  size={17}
                                />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  archiveStorageArea(
                                    area.id
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-orange-200 px-4 py-2 font-semibold text-orange-700 hover:bg-orange-50"
                              >
                                <Archive
                                  size={17}
                                />
                                Archive
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  removeArea(
                                    area
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50"
                              >
                                <Trash2
                                  size={17}
                                />
                                Delete
                              </button>
                            </>
                          )}

                          {!area.active && (
                            <button
                              type="button"
                              onClick={() =>
                                restoreStorageArea(
                                  area.id
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-4 py-2 font-semibold text-white hover:bg-violet-900"
                            >
                              <RotateCcw
                                size={17}
                              />
                              Restore
                            </button>
                          )}
                        </div>
                      </div>

                      {area.active && (
                        <div className="mt-6 border-t pt-5">
                          {assignments.length ===
                          0 ? (
                            <div className="rounded-2xl bg-slate-50 p-8 text-center text-gray-500">
                              No products assigned to this area.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {assignments.map(
                                (
                                  assignment,
                                  index
                                ) => (
                                  <AssignmentRow
                                    key={
                                      assignment.id
                                    }
                                    assignment={
                                      assignment
                                    }
                                    index={
                                      index
                                    }
                                    total={
                                      assignments.length
                                    }
                                  />
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>

        {addingProductsTo && (
          <ProductPicker
            area={
              addingProductsTo
            }
            products={
              products
            }
            onClose={() =>
              setAddingProductsTo(
                null
              )
            }
          />
        )}

        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
            onClick={
              closeForm
            }
          >
            <div
              className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl"
              onClick={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-950">
                    {editing
                      ? "Edit Storage Area"
                      : "New Storage Area"}
                  </h2>

                  <p className="mt-1 text-gray-500">
                    {
                      selectedSite.name
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              <label className="mt-6 block">
                <span className="text-sm font-semibold text-gray-700">
                  Area Name
                </span>

                <input
                  value={name}
                  onChange={(
                    event
                  ) =>
                    setName(
                      event.target
                        .value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                />
              </label>

              <label className="mt-5 block">
                <span className="text-sm font-semibold text-gray-700">
                  Description
                </span>

                <textarea
                  value={
                    description
                  }
                  onChange={(
                    event
                  ) =>
                    setDescription(
                      event.target
                        .value
                    )
                  }
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                />
              </label>

              {error && (
                <p className="mt-4 rounded-xl bg-red-50 p-3 font-semibold text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    saveArea
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900"
                >
                  <Save
                    size={18}
                  />
                  Save Area
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedPage>
  );
}
