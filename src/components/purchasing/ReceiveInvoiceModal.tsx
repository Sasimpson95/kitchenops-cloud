"use client";

import { useMemo, useState } from "react";
import { Plus, ReceiptText, Trash2, X } from "lucide-react";

import { getActiveBusinessId } from "@/lib/businessWorkspace";
import { getActiveProducts, updateProductPurchasePrice } from "@/lib/productStore";
import { getActiveSuppliers } from "@/lib/supplierStore";
import { receiveProductStock } from "@/lib/inventoryStore";
import { saveReceivedInvoice, type InvoiceLine } from "@/lib/invoiceStore";
import { recordPurchasePrice } from "@/lib/purchasePriceStore";

import type { Product } from "@/data/products";
import type { Supplier } from "@/data/suppliers";

type Props = {
  siteId: string;
  siteName: string;
  receivedBy: string;
  onClose: () => void;
  onSaved: () => void;
};

type DraftLine = {
  key: string;
  productId: number;
  purchaseUnits: string;
  unitPrice: string;
};

function id(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function sameSupplier(product: Product, supplier: Supplier | undefined): boolean {
  if (!supplier) return false;
  return product.supplierId === supplier.id ||
    product.supplierName.trim().toLowerCase() === supplier.name.trim().toLowerCase();
}

export default function ReceiveInvoiceModal({
  siteId,
  siteName,
  receivedBy,
  onClose,
  onSaved,
}: Props) {
  const suppliers = getActiveSuppliers();
  const products = getActiveProducts();

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? 0);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedSupplier = suppliers.find((supplier) => supplier.id === supplierId);
  const supplierProducts = useMemo(
    () => products.filter((product) => sameSupplier(product, selectedSupplier)),
    [products, selectedSupplier]
  );

  const total = useMemo(
    () => lines.reduce(
      (sum, line) => sum + (Number(line.purchaseUnits) || 0) * (Number(line.unitPrice) || 0),
      0
    ),
    [lines]
  );

  function changeSupplier(nextSupplierId: number): void {
    setSupplierId(nextSupplierId);
    setLines([]);
    setError("");
  }

  function addLine(): void {
    const firstProduct = supplierProducts[0];
    if (!firstProduct) {
      setError("This supplier has no products assigned yet.");
      return;
    }

    setLines((current) => [
      ...current,
      {
        key: id(),
        productId: firstProduct.id,
        purchaseUnits: "1",
        unitPrice: String(firstProduct.price || ""),
      },
    ]);
  }

  function update(key: string, patch: Partial<DraftLine>): void {
    setLines((current) =>
      current.map((line) => line.key === key ? { ...line, ...patch } : line)
    );
  }

  async function save(): Promise<void> {
    if (saving) return;

    const supplier = suppliers.find((item) => item.id === supplierId);
    if (!supplier || !invoiceNumber.trim()) {
      setError("Choose a supplier and enter the invoice number.");
      return;
    }

    const valid = lines.filter(
      (line) => line.productId > 0 && Number(line.purchaseUnits) > 0 && Number(line.unitPrice) >= 0
    );

    if (!valid.length) {
      setError("Add at least one received product.");
      return;
    }

    setSaving(true);
    setError("");

    const invoiceLines: InvoiceLine[] = valid.map((line) => {
      const product = products.find((item) => item.id === line.productId)!;
      const quantity = Number(line.purchaseUnits);
      const price = Number(line.unitPrice);

      return {
        productId: product.id,
        productName: product.name,
        purchaseUnits: quantity,
        unitPrice: price,
        lineTotal: quantity * price,
      };
    });

    try {
      const response = await fetch("/api/cloud/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          siteName,
          supplierId: supplier.id,
          supplierName: supplier.name,
          invoiceNumber: invoiceNumber.trim(),
          invoiceDate,
          total,
          receivedBy,
          lines: invoiceLines,
        }),
      });

      const data = await response.json() as { id?: string; error?: string };
      if (!response.ok || !data.id) {
        throw new Error(data.error ?? "Invoice could not be received.");
      }

      invoiceLines.forEach((line) => {
        receiveProductStock({
          businessId: getActiveBusinessId(),
          siteId,
          productId: line.productId,
          productName: line.productName,
          quantity: line.purchaseUnits,
          referenceId: data.id!,
          referenceNumber: `Invoice ${invoiceNumber.trim()}`,
        });

        recordPurchasePrice({
          siteId,
          supplierId: supplier.id,
          supplierName: supplier.name,
          productId: line.productId,
          productName: line.productName,
          unitPrice: line.unitPrice,
          sourceType: "invoice",
          sourceId: data.id!,
          sourceNumber: invoiceNumber.trim(),
        });

        updateProductPurchasePrice(line.productId, line.unitPrice);
      });

      saveReceivedInvoice({
        id: data.id,
        siteId,
        siteName,
        supplierId: supplier.id,
        supplierName: supplier.name,
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        lines: invoiceLines,
        total,
        receivedBy,
        createdAt: new Date().toISOString(),
      });

      onSaved();
      onClose();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Invoice could not be received.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
      <section className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-violet-800">Purchasing • {siteName}</p>
            <h2 className="mt-1 text-3xl font-bold">Receive invoice</h2>
            <p className="mt-2 text-gray-500">Receive a delivery that was not ordered through KitchenOps.</p>
          </div>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100" aria-label="Close">
            <X />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <label>
            <span className="text-sm font-semibold">Supplier</span>
            <select value={supplierId} onChange={(event) => changeSupplier(Number(event.target.value))} className="mt-2 w-full rounded-xl border px-4 py-3">
              <option value={0}>Choose supplier</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold">Invoice number</span>
            <input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3" />
          </label>
          <label>
            <span className="text-sm font-semibold">Invoice date</span>
            <input type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3" />
          </label>
        </div>

        <div className="mt-7 space-y-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-bold">Products received</h3>
              <p className="mt-1 text-sm text-gray-500">Only products assigned to the selected supplier are available.</p>
            </div>
            <button onClick={addLine} disabled={!selectedSupplier} className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-800 px-4 py-2 font-semibold text-violet-800 disabled:opacity-40">
              <Plus size={18} />Add product
            </button>
          </div>

          {lines.length === 0 && (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-gray-500">
              Choose a supplier, then add the products received.
            </div>
          )}

          {lines.map((line) => (
            <div key={line.key} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_150px_150px_44px]">
              <select
                value={line.productId}
                onChange={(event) => {
                  const productId = Number(event.target.value);
                  const product = products.find((item) => item.id === productId);
                  update(line.key, { productId, unitPrice: product ? String(product.price || "") : line.unitPrice });
                }}
                className="rounded-xl border bg-white px-3 py-3"
              >
                {supplierProducts.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.orderUnit})</option>)}
              </select>
              <input type="number" min="0" step="0.01" value={line.purchaseUnits} onChange={(event) => update(line.key, { purchaseUnits: event.target.value })} placeholder="Purchase units" className="rounded-xl border px-3 py-3" />
              <input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(event) => update(line.key, { unitPrice: event.target.value })} placeholder="Price per unit" className="rounded-xl border px-3 py-3" />
              <button onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))} className="flex h-11 w-11 items-center justify-center rounded-xl text-red-700 hover:bg-red-50" aria-label="Remove product">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {error && <p className="mt-5 rounded-xl bg-red-50 p-4 font-semibold text-red-700">{error}</p>}

        <div className="mt-7 flex flex-col items-stretch justify-between gap-4 border-t pt-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-gray-500">Invoice total</p>
            <p className="text-3xl font-bold">£{total.toFixed(2)}</p>
          </div>
          <button disabled={saving} onClick={save} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900 disabled:opacity-50">
            <ReceiptText size={19} />{saving ? "Receiving…" : "Receive invoice"}
          </button>
        </div>
      </section>
    </div>
  );
}
