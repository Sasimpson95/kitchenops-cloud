"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Archive,
  Check,
  Edit3,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  X,
} from "lucide-react";

import {
  createProductCategory,
  loadProductOptions,
  updateProductCategory,
  type ProductCategoryOption,
} from "@/lib/productOptions";

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-violet-800";

type CategoryManagerModalProps = {
  selectedCategory?: string;
  onSelect?: (name: string) => void;
  onClose: () => void;
  onChanged?: () => void;
};

export default function CategoryManagerModal({
  selectedCategory,
  onSelect,
  onClose,
  onChanged,
}: CategoryManagerModalProps) {
  const [categories, setCategories] =
    useState<ProductCategoryOption[]>([]);

  const [newName, setNewName] =
    useState("");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editingName, setEditingName] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function refresh() {
    setLoading(true);
    setError("");

    try {
      const options =
        await loadProductOptions();

      setCategories(
        [...options.categories].sort(
          (first, second) =>
            first.sort_order -
              second.sort_order ||
            first.name.localeCompare(
              second.name
            )
        )
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Categories could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function addCategory(
    event: FormEvent
  ) {
    event.preventDefault();

    const name = newName.trim();

    if (!name || saving) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const category =
        await createProductCategory(
          name
        );

      setNewName("");
      await refresh();
      onChanged?.();
      onSelect?.(category.name);
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

  function startEdit(
    category: ProductCategoryOption
  ) {
    setEditingId(category.id);
    setEditingName(category.name);
    setError("");
  }

  async function saveEdit(
    category: ProductCategoryOption
  ) {
    const name = editingName.trim();

    if (!name || saving) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateProductCategory({
        id: category.id,
        name,
      });

      if (
        selectedCategory ===
        category.name
      ) {
        onSelect?.(name);
      }

      setEditingId(null);
      setEditingName("");
      await refresh();
      onChanged?.();
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
    if (
      category.active &&
      selectedCategory ===
        category.name
    ) {
      setError(
        "Choose another category before archiving the category currently selected on this product."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateProductCategory({
        id: category.id,
        active: !category.active,
      });

      await refresh();
      onChanged?.();
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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-violet-800">
              Product Setup
            </p>

            <h2 className="mt-1 text-2xl font-bold text-gray-950">
              Manage Categories
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Categories belong to this business. Add, rename or archive them without leaving the product form.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-gray-600 hover:bg-slate-200"
            aria-label="Close category manager"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={addCategory}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={newName}
            onChange={(event) =>
              setNewName(
                event.target.value
              )
            }
            placeholder="New category, for example Frozen"
            className={inputClass}
          />

          <button
            type="submit"
            disabled={saving}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900 disabled:opacity-50"
          >
            {saving ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <Plus size={18} />
            )}
            Add Category
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-3">
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
                Add the first category above. KitchenOps does not force a preset category list.
              </p>
            </div>
          ) : (
            categories.map(
              (category) => {
                const selected =
                  selectedCategory ===
                  category.name;

                const editing =
                  editingId ===
                  category.id;

                return (
                  <article
                    key={category.id}
                    className={`rounded-2xl border p-4 ${
                      selected
                        ? "border-green-300 bg-violet-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        {editing ? (
                          <input
                            value={editingName}
                            onChange={(event) =>
                              setEditingName(
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

                            {selected && (
                              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800">
                                Selected
                              </span>
                            )}

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
                                void saveEdit(
                                  category
                                )
                              }
                              disabled={saving}
                              className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-4 py-2 text-sm font-semibold text-white"
                            >
                              <Save size={16} />
                              Save
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditingName("");
                              }}
                              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {category.active &&
                              onSelect && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSelect(
                                      category.name
                                    )
                                  }
                                  className="inline-flex items-center gap-2 rounded-xl border border-violet-700 px-4 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50"
                                >
                                  <Check size={16} />
                                  Use
                                </button>
                              )}

                            <button
                              type="button"
                              onClick={() =>
                                startEdit(
                                  category
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50"
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
                              disabled={saving}
                              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                                category.active
                                  ? "border border-red-200 text-red-700 hover:bg-red-50"
                                  : "bg-violet-800 text-white hover:bg-violet-900"
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
    </div>
  );
}
