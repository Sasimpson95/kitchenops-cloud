"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  PackagePlus,
  Save,
  Settings2,
  X,
} from "lucide-react";

import CategoryManagerModal from "@/components/products/CategoryManagerModal";

import type {
  CountMethod,
  Product,
} from "@/data/products";

import type {
  Supplier,
} from "@/data/suppliers";

import {
  loadProductOptions,
  type ProductCategoryOption,
  type ProductType,
  type ProductUnitOption,
} from "@/lib/productOptions";

export type ProductFormState = {
  name: string;
  category: string;

  productType: ProductType;
  internalCode: string;
  posCode: string;
  barcode: string;

  supplierId: number;
  supplierCode: string;
  alternativeSupplierIds: number[];

  orderUnit: string;
  purchaseQuantity: number;
  inventoryUnit: string;
  countMethod: CountMethod;

  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;

  price: number;

  storageArea: string;
  shelf: string;
  binLocation: string;

  leadTimeDays: number;
  deliveryDays: string[];

  storageNotes: string;
  internalNotes: string;
};

export const EMPTY_PRODUCT_FORM: ProductFormState = {
  name: "",
  category: "",

  productType: "ingredient",
  internalCode: "",
  posCode: "",
  barcode: "",

  supplierId: 0,
  supplierCode: "",
  alternativeSupplierIds: [],

  orderUnit: "",
  purchaseQuantity: 1,
  inventoryUnit: "",
  countMethod: "Each",

  minimumStock: 0,
  maximumStock: 0,
  reorderPoint: 0,

  price: 0,

  storageArea: "",
  shelf: "",
  binLocation: "",

  leadTimeDays: 0,
  deliveryDays: [],

  storageNotes: "",
  internalNotes: "",
};

export function productToForm(
  product: Product
): ProductFormState {
  return {
    name: product.name,
    category: product.category,

    productType:
      product.productType ??
      "ingredient",
    internalCode:
      product.internalCode ?? "",
    posCode:
      product.posCode ?? "",
    barcode:
      product.barcode ?? "",

    supplierId:
      product.supplierId,

    supplierCode:
      product.supplierCode,

    alternativeSupplierIds:
      product.alternativeSupplierIds,

    orderUnit:
      product.orderUnit,

    purchaseQuantity:
      product.purchaseQuantity,

    inventoryUnit:
      product.inventoryUnit,

    countMethod:
      product.countMethod,

    minimumStock:
      product.minimumStock,

    maximumStock:
      product.maximumStock,

    reorderPoint:
      product.reorderPoint,

    price: product.price,

    storageArea:
      product.storageArea,

    shelf: product.shelf,

    binLocation:
      product.binLocation,

    leadTimeDays:
      product.leadTimeDays,

    deliveryDays:
      product.deliveryDays,

    storageNotes:
      product.storageNotes,

    internalNotes:
      product.internalNotes,
  };
}

type ProductFormModalProps = {
  form: ProductFormState;
  editingProduct: Product | null;
  suppliers: Supplier[];

  saving: boolean;
  error: string;

  onChange: <
    K extends keyof ProductFormState,
  >(
    field: K,
    value: ProductFormState[K]
  ) => void;

  onSave: () => void;
  onClose: () => void;
};

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-950">
        {title}
      </h3>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
  fullWidth = false,
}: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={
        fullWidth
          ? "md:col-span-2"
          : ""
      }
    >
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-800";

export default function ProductFormModal({
  form,
  editingProduct,
  suppliers,
  saving,
  error,
  onChange,
  onSave,
  onClose,
}: ProductFormModalProps) {
  const [
    categories,
    setCategories,
  ] = useState<ProductCategoryOption[]>([]);

  const [
    units,
    setUnits,
  ] = useState<ProductUnitOption[]>([]);

  const [
    showCategoryManager,
    setShowCategoryManager,
  ] = useState(false);

  async function refreshOptions() {
    try {
      const options =
        await loadProductOptions();

      setCategories(
        options.categories.filter(
          (item) => item.active
        )
      );

      setUnits(
        options.units.filter(
          (item) => item.active
        )
      );
    } catch {
      // Existing values remain usable if cloud options cannot load.
    }
  }

  useEffect(() => {
    void refreshOptions();
  }, []);

  const unitCost =
    form.purchaseQuantity > 0
      ? form.price /
        form.purchaseQuantity
      : 0;

  const availableAlternatives =
    suppliers.filter(
      (supplier) =>
        supplier.active &&
        supplier.id !==
          form.supplierId
    );

  function toggleAlternative(
    supplierId: number
  ): void {
    const selected =
      form.alternativeSupplierIds.includes(
        supplierId
      );

    onChange(
      "alternativeSupplierIds",
      selected
        ? form.alternativeSupplierIds.filter(
            (id) =>
              id !== supplierId
          )
        : [
            ...form.alternativeSupplierIds,
            supplierId,
          ]
    );
  }

  function toggleDeliveryDay(
    day: string
  ): void {
    const selected =
      form.deliveryDays.includes(day);

    onChange(
      "deliveryDays",
      selected
        ? form.deliveryDays.filter(
            (value) =>
              value !== day
          )
        : [
            ...form.deliveryDays,
            day,
          ]
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
    >
      <div
        className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-green-800">
              Operations
            </p>

            <h2 className="mt-1 text-3xl font-bold text-gray-950">
              {editingProduct
                ? "Edit Product"
                : "Add Product"}
            </h2>

            <p className="mt-2 text-gray-600">
              Manage supplier, purchasing, storage and stock information.
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

        <div className="mt-8 space-y-5">
          <Section title="General">
            <Field label="Product Name">
              <input
                value={form.name}
                onChange={(event) =>
                  onChange(
                    "name",
                    event.target.value
                  )
                }
                placeholder="Example: Eggs"
                className={inputClass}
              />
            </Field>

            <Field label="Product Type">
              <select
                value={form.productType}
                onChange={(event) =>
                  onChange(
                    "productType",
                    event.target.value as ProductType
                  )
                }
                className={`${inputClass} bg-white`}
              >
                <option value="ingredient">Ingredient</option>
                <option value="packaging">Packaging</option>
                <option value="retail">Retail</option>
                <option value="cleaning">Cleaning</option>
                <option value="consumable">Consumable</option>
              </select>
            </Field>

            <Field label="Category">
              <div className="flex gap-2">
                <select
                  value={form.category}
                  onChange={(event) =>
                    onChange(
                      "category",
                      event.target.value
                    )
                  }
                  className={`${inputClass} min-w-0 bg-white`}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.name}
                    >
                      {category.name}
                    </option>
                  ))}
                  {form.category &&
                    !categories.some(
                      (item) => item.name === form.category
                    ) && (
                      <option value={form.category}>
                        {form.category}
                      </option>
                    )}
                </select>

                <button
                  type="button"
                  onClick={() =>
                    setShowCategoryManager(true)
                  }
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-green-800 px-4 py-3 font-semibold text-green-800 hover:bg-green-50"
                  title="Add, rename or archive categories"
                >
                  <Settings2 size={18} />
                  <span className="hidden sm:inline">
                    Manage
                  </span>
                </button>
              </div>

              {categories.length === 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  No categories have been created yet. Press Manage to add one.
                </p>
              )}
            </Field>

            <Field label="Internal Code">
              <input
                value={form.internalCode}
                onChange={(event) =>
                  onChange(
                    "internalCode",
                    event.target.value
                  )
                }
                placeholder="Optional internal reference"
                className={inputClass}
              />
            </Field>

            <Field label="POS / Sales Code">
              <input
                value={form.posCode}
                onChange={(event) =>
                  onChange(
                    "posCode",
                    event.target.value
                  )
                }
                placeholder="Optional"
                className={inputClass}
              />
            </Field>

            <Field label="Barcode">
              <input
                value={form.barcode}
                onChange={(event) =>
                  onChange(
                    "barcode",
                    event.target.value
                  )
                }
                placeholder="Optional"
                inputMode="numeric"
                className={inputClass}
              />
            </Field>
          </Section>

          <Section title="Suppliers">
            <Field label="Preferred Supplier">
              <select
                value={form.supplierId}
                onChange={(event) =>
                  onChange(
                    "supplierId",
                    Number(
                      event.target.value
                    )
                  )
                }
                className={`${inputClass} bg-white`}
              >
                <option value={0}>
                  Select supplier
                </option>

                {suppliers
                  .filter(
                    (supplier) =>
                      supplier.active
                  )
                  .map((supplier) => (
                    <option
                      key={supplier.id}
                      value={supplier.id}
                    >
                      {supplier.name}
                    </option>
                  ))}
              </select>
            </Field>

            <Field label="Supplier Product Code">
              <input
                value={form.supplierCode}
                onChange={(event) =>
                  onChange(
                    "supplierCode",
                    event.target.value
                  )
                }
                placeholder="Optional"
                className={inputClass}
              />
            </Field>

            <Field
              label="Alternative Suppliers"
              fullWidth
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {availableAlternatives.length ===
                0 ? (
                  <p className="text-sm text-gray-500">
                    No alternative suppliers available.
                  </p>
                ) : (
                  availableAlternatives.map(
                    (supplier) => (
                      <label
                        key={supplier.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4"
                      >
                        <input
                          type="checkbox"
                          checked={form.alternativeSupplierIds.includes(
                            supplier.id
                          )}
                          onChange={() =>
                            toggleAlternative(
                              supplier.id
                            )
                          }
                          className="h-5 w-5 accent-green-800"
                        />

                        <span className="font-semibold text-gray-800">
                          {supplier.name}
                        </span>
                      </label>
                    )
                  )
                )}
              </div>
            </Field>
          </Section>

          <Section title="Purchasing">
            <Field label="Purchase Unit">
              <select
                value={form.orderUnit}
                onChange={(event) =>
                  onChange(
                    "orderUnit",
                    event.target.value
                  )
                }
                className={`${inputClass} bg-white`}
              >
                <option value="">Select purchase unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.name}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
                {form.orderUnit &&
                  !units.some((unit) => unit.name === form.orderUnit) && (
                    <option value={form.orderUnit}>{form.orderUnit}</option>
                  )}
              </select>
            </Field>

            <Field label="Quantity in Purchase Unit">
              <input
                type="number"
                min={0.000001}
                step="0.01"
                value={
                  form.purchaseQuantity
                }
                onChange={(event) =>
                  onChange(
                    "purchaseQuantity",
                    Number(
                      event.target.value
                    )
                  )
                }
                className={inputClass}
              />
            </Field>

            <Field label="Purchase Price">
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  onChange(
                    "price",
                    Number(
                      event.target.value
                    )
                  )
                }
                className={inputClass}
              />
            </Field>

            <Field label="Lead Time (days)">
              <input
                type="number"
                min={0}
                step="1"
                value={
                  form.leadTimeDays
                }
                onChange={(event) =>
                  onChange(
                    "leadTimeDays",
                    Number(
                      event.target.value
                    )
                  )
                }
                className={inputClass}
              />
            </Field>

            <Field
              label="Delivery Days"
              fullWidth
            >
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map(
                  (day) => (
                    <button
                      type="button"
                      key={day}
                      onClick={() =>
                        toggleDeliveryDay(
                          day
                        )
                      }
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        form.deliveryDays.includes(
                          day
                        )
                          ? "bg-green-800 text-white"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-slate-50"
                      }`}
                    >
                      {day}
                    </button>
                  )
                )}
              </div>
            </Field>

            <Field
              label="Calculated Unit Cost"
              fullWidth
            >
              <div className="rounded-xl bg-green-50 px-4 py-3 font-semibold text-green-900">
                £
                {unitCost.toFixed(4)} per{" "}
                {form.inventoryUnit ||
                  "inventory unit"}
              </div>
            </Field>
          </Section>

          <Section title="Inventory">
            <Field label="Inventory Unit">
              <select
                value={form.inventoryUnit}
                onChange={(event) =>
                  onChange(
                    "inventoryUnit",
                    event.target.value
                  )
                }
                className={`${inputClass} bg-white`}
              >
                <option value="">Select inventory unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.name}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
                {form.inventoryUnit &&
                  !units.some((unit) => unit.name === form.inventoryUnit) && (
                    <option value={form.inventoryUnit}>{form.inventoryUnit}</option>
                  )}
              </select>
            </Field>

            <Field label="Count Method">
              <select
                value={form.countMethod}
                onChange={(event) =>
                  onChange(
                    "countMethod",
                    event.target
                      .value as CountMethod
                  )
                }
                className={`${inputClass} bg-white`}
              >
                <option value="Each">
                  Each
                </option>
                <option value="Weight">
                  Weight
                </option>
                <option value="Volume">
                  Volume
                </option>
                <option value="Portion">
                  Portion
                </option>
              </select>
            </Field>

            <Field label="Storage Area (Optional)">
              <input
                value={form.storageArea}
                onChange={(event) =>
                  onChange(
                    "storageArea",
                    event.target.value
                  )
                }
                placeholder="Assign later in Storage Areas"
                className={inputClass}
              />
            </Field>

            <Field label="Shelf">
              <input
                value={form.shelf}
                onChange={(event) =>
                  onChange(
                    "shelf",
                    event.target.value
                  )
                }
                placeholder="Top Shelf"
                className={inputClass}
              />
            </Field>

            <Field label="Bin / Position">
              <input
                value={
                  form.binLocation
                }
                onChange={(event) =>
                  onChange(
                    "binLocation",
                    event.target.value
                  )
                }
                placeholder="A3"
                className={inputClass}
              />
            </Field>
          </Section>

          <Section title="Stock Levels">
            <Field label="Minimum Stock">
              <input
                type="number"
                min={0}
                step="0.01"
                value={
                  form.minimumStock
                }
                onChange={(event) =>
                  onChange(
                    "minimumStock",
                    Number(
                      event.target.value
                    )
                  )
                }
                className={inputClass}
              />
            </Field>

            <Field label="Reorder Point">
              <input
                type="number"
                min={0}
                step="0.01"
                value={
                  form.reorderPoint
                }
                onChange={(event) =>
                  onChange(
                    "reorderPoint",
                    Number(
                      event.target.value
                    )
                  )
                }
                className={inputClass}
              />
            </Field>

            <Field label="Maximum Stock">
              <input
                type="number"
                min={0}
                step="0.01"
                value={
                  form.maximumStock
                }
                onChange={(event) =>
                  onChange(
                    "maximumStock",
                    Number(
                      event.target.value
                    )
                  )
                }
                className={inputClass}
              />
            </Field>
          </Section>

          <Section title="Notes">
            <Field
              label="Storage Instructions"
              fullWidth
            >
              <textarea
                value={
                  form.storageNotes
                }
                onChange={(event) =>
                  onChange(
                    "storageNotes",
                    event.target.value
                  )
                }
                placeholder="FIFO, keep refrigerated, do not freeze..."
                rows={4}
                className={inputClass}
              />
            </Field>

            <Field
              label="Internal Notes"
              fullWidth
            >
              <textarea
                value={
                  form.internalNotes
                }
                onChange={(event) =>
                  onChange(
                    "internalNotes",
                    event.target.value
                  )
                }
                placeholder="Optional internal information..."
                rows={4}
                className={inputClass}
              />
            </Field>
          </Section>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-800">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-800 px-6 py-3 font-semibold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editingProduct ? (
              <Save size={19} />
            ) : (
              <PackagePlus size={19} />
            )}

            {saving
              ? "Saving..."
              : editingProduct
                ? "Save Product"
                : "Create Product"}
          </button>
        </div>
      </div>

      {showCategoryManager && (
        <CategoryManagerModal
          selectedCategory={form.category}
          onSelect={(name) => {
            onChange("category", name);
            void refreshOptions();
          }}
          onChanged={() =>
            void refreshOptions()
          }
          onClose={() => {
            setShowCategoryManager(false);
            void refreshOptions();
          }}
        />
      )}
    </div>
  );
}
