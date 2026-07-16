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
  CheckCircle2,
  Plus,
  RefreshCw,
  Tags,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";

import {
  loadProductOptions,
  type ProductCategoryOption,
  type ProductType,
  type ProductUnitOption,
  type UnitKind,
} from "@/lib/productOptions";

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-800";

async function send(
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
      data.error ?? "The change could not be saved."
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

  const [productType, setProductType] =
    useState<ProductType>("ingredient");

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
      await send("POST", {
        optionType: "category",
        name: categoryName,
        productType,
      });

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
      await send("POST", {
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

  async function toggleCategory(
    category: ProductCategoryOption
  ) {
    await send("PATCH", {
      optionType: "category",
      id: category.id,
      active: !category.active,
    });

    await refresh();
  }

  async function toggleUnit(
    unit: ProductUnitOption
  ) {
    await send("PATCH", {
      optionType: "unit",
      id: unit.id,
      active: !unit.active,
    });

    await refresh();
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
                Product Foundation
              </p>

              <h1 className="mt-1 text-4xl font-bold text-gray-950">
                Categories & Units
              </h1>

              <p className="mt-2 text-gray-600">
                Standardise product setup across every site in this business.
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

              <form
                onSubmit={addCategory}
                className="mt-5 grid gap-3 sm:grid-cols-[1fr_190px_auto]"
              >
                <input
                  value={categoryName}
                  onChange={(event) =>
                    setCategoryName(event.target.value)
                  }
                  placeholder="Category name"
                  className={inputClass}
                />

                <select
                  value={productType}
                  onChange={(event) =>
                    setProductType(
                      event.target.value as ProductType
                    )
                  }
                  className={inputClass}
                >
                  <option value="ingredient">Ingredient</option>
                  <option value="packaging">Packaging</option>
                  <option value="retail">Retail</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="consumable">Consumable</option>
                </select>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-800 px-4 py-3 font-semibold text-white disabled:opacity-50"
                >
                  <Plus size={18} />
                  Add
                </button>
              </form>

              <div className="mt-5 space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                  >
                    <div>
                      <p className="font-bold text-gray-950">
                        {category.name}
                      </p>
                      <p className="mt-1 text-xs capitalize text-gray-500">
                        {category.product_type}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void toggleCategory(category)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        category.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {category.active ? "Active" : "Archived"}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-950">
                Units
              </h2>

              <form
                onSubmit={addUnit}
                className="mt-5 grid gap-3 sm:grid-cols-2"
              >
                <input
                  value={unitName}
                  onChange={(event) =>
                    setUnitName(event.target.value)
                  }
                  placeholder="Unit name"
                  className={inputClass}
                />

                <input
                  value={unitSymbol}
                  onChange={(event) =>
                    setUnitSymbol(event.target.value)
                  }
                  placeholder="Symbol, e.g. kg"
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
                        <span className="ml-2 font-normal text-gray-500">
                          ({unit.symbol})
                        </span>
                      </p>
                      <p className="mt-1 text-xs capitalize text-gray-500">
                        {unit.unit_kind}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void toggleUnit(unit)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        unit.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {unit.active ? "Active" : "Archived"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {loading && (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-white p-5 text-gray-600 shadow-sm">
              <RefreshCw size={18} className="animate-spin" />
              Loading product options...
            </div>
          )}
        </div>
      </main>
    </ProtectedPage>
  );
}
