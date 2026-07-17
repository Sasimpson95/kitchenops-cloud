"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Minus, Plus, Search, X } from "lucide-react";

import type { User } from "@/config/roles";
import type { Product } from "@/data/products";

import { getProductStock } from "@/lib/inventoryStore";
import { createTransfer, setTransferSites } from "@/lib/transferStore";
import { useBusinessSites } from "@/lib/useBusinessSites";

type TransferModalProps = {
  currentUser: User;
  products: Product[];
  onClose: () => void;
  onCompleted: () => void;
};

function siteNameToId(siteName: string): string {
  return siteName.trim().toLowerCase().replace(/\s+/g, "-");
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 2,
  }).format(value);
}

export default function TransferModal({
  currentUser,
  products,
  onClose,
  onCompleted,
}: TransferModalProps) {
  const { sites: TRANSFER_SITES } = useBusinessSites();
  const managerSiteId = siteNameToId(currentUser.site);
  const isOperations = currentUser.role === "operations";

  const [fromSiteId, setFromSiteId] = useState(isOperations ? "" : managerSiteId);
  const [toSiteId, setToSiteId] = useState("");
  const [productId, setProductId] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTransferSites(TRANSFER_SITES);
    if (isOperations && !fromSiteId && TRANSFER_SITES[0]) setFromSiteId(TRANSFER_SITES[0].id);
  }, [TRANSFER_SITES, fromSiteId, isOperations]);

  useEffect(() => { setToSiteId(""); }, [fromSiteId]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId) ?? null,
    [productId, products]
  );

  const availableStock = selectedProduct
    ? getProductStock("current-business", fromSiteId, selectedProduct.id)
    : 0;

  const destinationSites = TRANSFER_SITES.filter(
    (site) => site.id !== fromSiteId
  );

  const filteredProducts = useMemo(() => {
    const normalisedSearch = search.trim().toLowerCase();

    return products
      .filter((product) => product.active)
      .filter(
        (product) =>
          !normalisedSearch ||
          product.name.toLowerCase().includes(normalisedSearch) ||
          product.category.toLowerCase().includes(normalisedSearch)
      )
      .sort((firstProduct, secondProduct) =>
        firstProduct.name.localeCompare(secondProduct.name)
      );
  }, [products, search]);

  function handleTransfer(): void {
    if (saving) return;

    try {
      setSaving(true);
      setError("");

      createTransfer({
        fromSiteId,
        toSiteId,
        productId,
        quantity,
        reason,
        transferredBy: currentUser.name,
      });

      onCompleted();
      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The transfer could not be completed."
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
        className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-violet-800">Inventory</p>
            <h2 className="mt-1 text-3xl font-bold text-gray-950">
              Transfer Stock
            </h2>
            <p className="mt-2 text-gray-600">
              Stock leaves one site and is added to the destination instantly.
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

        <div className="mt-8 grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              From
            </label>

            {isOperations ? (
              <select
                value={fromSiteId}
                onChange={(event) => setFromSiteId(event.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-violet-800"
              >
                {TRANSFER_SITES.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 font-semibold text-gray-900">
                {currentUser.site}
              </div>
            )}
          </div>

          <ArrowRight className="mx-auto mb-3 text-violet-800" size={24} />

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              To
            </label>

            <select
              value={toSiteId}
              onChange={(event) => setToSiteId(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-violet-800"
            >
              <option value="">Select destination</option>
              {destinationSites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 border-t pt-8">
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
              className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none focus:border-violet-800"
            />
          </div>

          <select
            value={productId}
            onChange={(event) => {
              setProductId(Number(event.target.value));
              setQuantity(1);
            }}
            className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-violet-800"
          >
            <option value={0}>Select product</option>
            {filteredProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} — {product.inventoryUnit}
              </option>
            ))}
          </select>

          {selectedProduct && (
            <div className="mt-4 rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Available at source</p>
                  <p className="mt-1 text-2xl font-bold text-gray-950">
                    {formatQuantity(availableStock)} {selectedProduct.inventoryUnit}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-600">
                  {selectedProduct.location}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Quantity
            </label>

            <div className="flex items-center justify-center gap-6 rounded-2xl border border-gray-200 p-4">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(0.01, quantity - 1))}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 transition hover:bg-slate-200"
              >
                <Minus size={22} />
              </button>

              <input
                type="number"
                min={0.01}
                step="0.01"
                value={quantity}
                onChange={(event) =>
                  setQuantity(Math.max(0, Number(event.target.value) || 0))
                }
                className="w-28 rounded-xl border border-gray-300 px-3 py-3 text-center text-2xl font-bold outline-none focus:border-violet-800"
              />

              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-800 text-white transition hover:bg-violet-900"
              >
                <Plus size={22} />
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Reason <span className="font-normal text-gray-500">(optional)</span>
            </label>

            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder="Example: Weekend support"
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
            />
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-800">
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
            onClick={handleTransfer}
            disabled={saving || !toSiteId || !productId || quantity <= 0}
            className="rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white transition hover:bg-violet-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Transferring..." : "Complete Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}
