"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Archive,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Tags,
  X,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";

import {
  createProductCategory,
  loadProductOptions,
  updateProductCategory,
  type ProductCategoryOption,
  type ProductUnitOption,
  type UnitKind,
} from "@/lib/productOptions";

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-800";

async function sendUnit(
  method: "POST" | "PATCH",
  body: object
) {
  const response = await fetch(
    "/api/cloud/product-options",
    {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json() as {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.error ??
        "The change could not be saved."
    );
  }
}

export default function ProductOptionsPage() {
  const [categories, setCategories] =
    useState<ProductCategoryOption[]>([]);

  const [units, setUnits] =
    useState<ProductUnitOption[]>([]);

  const [categoryName, setCategoryName] =
    useState("");

  const [editingCategoryId, setEditingCategoryId] =
    useState<string | null>(null);

  const [editingCategoryName, setEditingCategoryName] =
    useState("");

  const [unitName, setUnitName] =
    useState("");

  const [unitSymbol, setUnitSymbol] =
    useState("");

  const [unitKind, setUnitKind] =
    useState<UnitKind>("each");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const options =
        await loadProductOptions();

      setCategories(options.categories);
      setUnits(options.units);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Options could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function addCategory(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!categoryName.trim() || saving) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await createProductCategory(
        categoryName
      );

      setCategoryName("");
      setMessage("Category added.");
      await refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Category could not be added."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveCategoryName(
    category: ProductCategoryOption
  ) {
    if (
      !editingCategoryName.trim() ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateProductCategory({
        id: category.id,
        name:
          editingCategoryName,
      });

      setEditingCategoryId(null);
      setEditingCategoryName("");
      setMessage("Category renamed.");
      await refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Category could not be renamed."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleCategory(
    category: ProductCategoryOption
  ) {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateProductCategory({
        id: category.id,
        active: !category.active,
      });

      setMessage(
        category.active
          ? "Category archived."
          : "Category restored."
      );

      await refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Category could not be updated."
      );
    } finally {
      setSaving(false);
    }
  }

  async function addUnit(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !unitName.trim() ||
      !unitSymbol.trim() ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await sendUnit("POST", {
        optionType: "unit",
        name: unitName,
        symbol: unitSymbol,
        unitKind,
      });

      setUnitName("");
      setUnitSymbol("");
      setMessage("Unit added.");
      await refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unit could not be added."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleUnit(
    unit: ProductUnitOption
  ) {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await sendUnit("PATCH", {
        optionType: "unit",
        id: unit.id,
        active: !unit.active,
      });

      setMessage(
        unit.active
          ? "Unit archived."
          : "Unit restored."
      );

      await refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unit could not be updated."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 font-semibold text-green-800 hover:underline"
          >
            <ArrowLeft size={18} />
            Settings
          </Link>

          <div className="mt-5 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-800">
              <Tags size={24} />
            </div>

            <div>
              <p className="font-semibold text-green-800">
                Product Setup
              </p>

              <h1 className="mt-1 text-4xl font-bold text-gray-950">
                Categories & Units
              </h1>

              <p className="mt-2 text-gray-600">
                Create the category structure that suits this business. KitchenOps does not force preset categories.
              </p>
            </div>
          </div>

          {error && (
            <p className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p className="mt-6 flex items-center gap-2 rounded-2xl bg-green-50 p-4 font-semibold text-green-800">
              <CheckCircle2 size={18} />
              {message}
            </p>
          )}

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-950">
                Categories
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Examples could be Dairy, Frozen, Dry Store or Coffee—but the list is entirely yours.
              </p>

              <form
                onSubmit={addCategory}
                className="mt-5 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  value={categoryName}
                  onChange={(event) =>
                    setCategoryName(
                      event.target.value
                    )
                  }
                  placeholder="Category name"
                  className={inputClass}
                />

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-green-800 px-4 py-3 font-semibold text-white disabled:opacity-50"
                >
                  <Plus size={18} />
                  Add
                </button>
              </form>

              <div className="mt-5 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-50 p-8 text-gray-600">
                    <Loader2
                      size={20}
                      className="animate-spin"
                    />
                    Loading categories...
                  </div>
                ) : categories.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-8 text-center">
                    <p className="font-semibold text-gray-700">
                      No categories yet
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Add the first category above.
                    </p>
                  </div>
                ) : (
                  categories.map(
                    (category) => {
                      const editing =
                        editingCategoryId ===
                        category.id;

                      return (
                        <article
                          key={category.id}
                          className="rounded-2xl bg-slate-50 p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 flex-1">
                              {editing ? (
                                <input
                                  value={editingCategoryName}
                                  onChange={(event) =>
                                    setEditingCategoryName(
                                      event.target.value
                                    )
                                  }
                                  className={inputClass}
                                  autoFocus
                                />
                              ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-bold text-gray-950">
                                    {category.name}
                                  </p>

                                  {!category.active && (
                                    <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                      Archived
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {editing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void saveCategoryName(
                                        category
                                      )
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl bg-green-800 px-4 py-2 text-sm font-semibold text-white"
                                  >
                                    <Save size={16} />
                                    Save
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCategoryId(null);
                                      setEditingCategoryName("");
                                    }}
                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                                  >
                                    <X size={16} />
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCategoryId(
                                        category.id
                                      );
                                      setEditingCategoryName(
                                        category.name
                                      );
                                    }}
                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white"
                                  >
                                    <Edit3 size={16} />
                                    Rename
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void toggleCategory(
                                        category
                                      )
                                    }
                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                                      category.active
                                        ? "border border-red-200 text-red-700 hover:bg-red-50"
                                        : "bg-green-800 text-white hover:bg-green-900"
                                    }`}
                                  >
                                    {category.active ? (
                                      <Archive size={16} />
                                    ) : (
                                      <RotateCcw size={16} />
                                    )}
                                    {category.active
                                      ? "Archive"
                                      : "Restore"}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )
                )}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-950">
                Units
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Standard units are added automatically. Add extra business-specific units when required.
              </p>

              <form
                onSubmit={addUnit}
                className="mt-5 grid gap-3 sm:grid-cols-2"
              >
                <input
                  value={unitName}
                  onChange={(event) =>
                    setUnitName(
                      event.target.value
                    )
                  }
                  placeholder="Unit name"
                  className={inputClass}
                />

                <input
                  value={unitSymbol}
                  onChange={(event) =>
                    setUnitSymbol(
                      event.target.value
                    )
                  }
                  placeholder="Symbol, e.g. doz"
                  className={inputClass}
                />

                <select
                  value={unitKind}
                  onChange={(event) =>
                    setUnitKind(
                      event.target.value as UnitKind
                    )
                  }
                  className={inputClass}
                >
                  <option value="each">Each</option>
                  <option value="weight">Weight</option>
                  <option value="volume">Volume</option>
                  <option value="packaging">Packaging</option>
                  <option value="portion">Portion</option>
                </select>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-800 px-4 py-3 font-semibold text-white disabled:opacity-50"
                >
                  <Plus size={18} />
                  Add Unit
                </button>
              </form>

              <div className="mt-5 space-y-3">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                  >
                    <div>
                      <p className="font-bold text-gray-950">
                        {unit.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {unit.symbol} • {unit.unit_kind}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void toggleUnit(unit)
                      }
                      className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                        unit.active
                          ? "border border-red-200 text-red-700 hover:bg-red-50"
                          : "bg-green-800 text-white hover:bg-green-900"
                      }`}
                    >
                      {unit.active
                        ? "Archive"
                        : "Restore"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </ProtectedPage>
  );
}
