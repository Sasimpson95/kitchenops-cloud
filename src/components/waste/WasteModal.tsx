"use client";

import { getActiveBusinessId } from "@/lib/businessWorkspace";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";

import type { User } from "@/config/roles";
import type { Product } from "@/data/products";
import { getProductStock } from "@/lib/inventoryStore";
import { useBusinessSites } from "@/lib/useBusinessSites";
import {
  createWasteRecord,
  type WasteReason,
} from "@/lib/wasteStore";

const WASTE_REASONS: WasteReason[] = [
  "Burnt",
  "Damaged",
  "Over Production",
  "Customer Return",
  "Expired",
  "Quality Issue",
  "Other",
];

type WasteModalProps = {
  currentUser: User;
  products: Product[];
  initialSite: string;
  onClose: () => void;
  onSaved?: () => void;
};

function getSiteId(siteName: string): string {
  return siteName.trim().toLowerCase().replace(/\s+/g, "-");
}

export default function WasteModal({
  currentUser,
  products,
  initialSite,
  onClose,
  onSaved,
}: WasteModalProps) {
  const { siteNames: SITE_OPTIONS } = useBusinessSites();
  const isOperations = currentUser.role === "operations";

  const [siteName, setSiteName] = useState(
    initialSite === "All Sites" ? "" : initialSite
  );
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<WasteReason>("Damaged");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const siteId = getSiteId(siteName);

  const selectedProduct = useMemo(
    () =>
      products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  const availableStock = selectedProduct
    ? getProductStock("current-business", siteId, selectedProduct.id)
    : 0;

  const filteredProducts = useMemo(() => {
    const normalisedSearch = search.trim().toLowerCase();

    return products
      .filter((product) => {
        if (!normalisedSearch) return true;

        return (
          product.name.toLowerCase().includes(normalisedSearch) ||
          product.category.toLowerCase().includes(normalisedSearch) ||
          product.location.toLowerCase().includes(normalisedSearch)
        );
      })
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [products, search]);

  function chooseProduct(product: Product): void {
    setSelectedProductId(product.id);
    setQuantity(1);
    setError("");
  }

  function changeSite(nextSite: string): void {
    if (!isOperations) return;

    setSiteName(nextSite);
    setSelectedProductId(null);
    setQuantity(1);
    setError("");
  }

  function handleSave(): void {
    if (saving) return;

    if (!selectedProduct) {
      setError("Choose a product.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      createWasteRecord({
        siteId,
        siteName,
        product: selectedProduct,
        quantity,
        reason,
        notes,
        recordedBy: currentUser.name,
      });

      onSaved?.();
      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The waste record could not be saved."
      );
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-red-700">Waste</p>

            <h2 className="mt-1 text-3xl font-bold text-gray-950">
              New Waste Record
            </h2>

            <p className="mt-2 text-gray-600">
              Record the actual inventory quantity being discarded.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-gray-600 transition hover:bg-slate-200"
            aria-label="Close"
          >
            <X size={21} />
          </button>
        </div>

        <div className="mt-8">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Site
          </label>

          {isOperations ? (
            <select
              value={siteName}
              onChange={(event) => changeSite(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-violet-800"
            >
              {SITE_OPTIONS.map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 font-semibold text-gray-900">
              {siteName}
            </div>
          )}
        </div>

        <div className="mt-7 border-t pt-7">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Product
          </label>

          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-11 outline-none focus:border-violet-800"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 hover:bg-slate-100"
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const stock = getProductStock(
                getActiveBusinessId(),
                siteId,
                product.id
              );
              const selected = product.id === selectedProductId;

              return (
                <button
                  type="button"
                  key={product.id}
                  onClick={() => chooseProduct(product)}
                  disabled={stock <= 0}
                  className={`w-full rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    selected
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-gray-950">{product.name}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {product.category} • {product.location}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-gray-950">
                        {stock} {product.inventoryUnit}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">Available</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedProduct && (
          <div className="mt-7 grid gap-6 border-t pt-7 lg:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-semibold text-gray-700">
                Waste Quantity ({selectedProduct.inventoryUnit})
              </label>

              <div className="flex items-center justify-center gap-7 rounded-2xl border border-gray-200 p-5">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 transition hover:bg-slate-200"
                >
                  <Minus size={25} />
                </button>

                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(Math.max(0, Number(event.target.value) || 0))
                  }
                  className="w-28 rounded-xl border border-gray-300 px-3 py-3 text-center text-3xl font-bold outline-none focus:border-red-600"
                />

                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
                >
                  <Plus size={25} />
                </button>
              </div>

              <p className="mt-3 text-center text-sm text-gray-500">
                Available: {availableStock} {selectedProduct.inventoryUnit}
              </p>
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-gray-700">
                Reason
              </label>

              <select
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value as WasteReason)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-red-600"
              >
                {WASTE_REASONS.map((wasteReason) => (
                  <option key={wasteReason} value={wasteReason}>
                    {wasteReason}
                  </option>
                ))}
              </select>

              <label className="mb-2 mt-5 block text-sm font-semibold text-gray-700">
                Notes <span className="font-normal text-gray-500">(optional)</span>
              </label>

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Add any useful details..."
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-600"
              />
            </div>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <p>
              Saving this record immediately reduces inventory at {siteName}.
              Waste value will be added after purchase-unit conversions are
              introduced, so KitchenOps does not show an inaccurate cost.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 font-semibold text-red-800">
            {error}
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3 border-t pt-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !selectedProduct || quantity <= 0}
            className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Recording Waste..." : "Record Waste"}
          </button>
        </div>
      </div>
    </div>
  );
}
