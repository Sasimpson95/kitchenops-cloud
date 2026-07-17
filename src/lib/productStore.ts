import {
  type CountMethod,
  type Product,
  starterProducts,
} from "@/data/products";

import {
  getSuppliers,
} from "@/lib/supplierStore";

import { scheduleCloudCatalogSave } from "@/lib/cloud/catalogSync";

const STORAGE_KEY = "kitchenops-products";
const PRODUCTS_CHANGED_EVENT =
  "kitchenops-products-changed";
const LEGACY_STOCK_STORAGE_KEY =
  "kitchenops-legacy-product-stock";

export type CreateProductInput = {
  name: string;
  category: string;

  productType:
    | "ingredient"
    | "packaging"
    | "retail"
    | "cleaning"
    | "consumable";

  internalCode: string;
  posCode: string;
  barcode: string;

  supplierId: number;
  supplierName: string;
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

export type UpdateProductInput =
  CreateProductInput;

function now(): string {
  return new Date().toISOString();
}

function cloneStarterProducts(): Product[] {
  return JSON.parse(
    JSON.stringify(starterProducts)
  ) as Product[];
}

function emitProductsChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(PRODUCTS_CHANGED_EVENT)
  );
}

function initialiseProducts(): Product[] {
  const products: Product[] = [];

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(products)
    );
  }

  return products;
}

function inferPurchaseQuantity(
  orderUnit: string
): number {
  const match =
    orderUnit.match(/(\d+(?:\.\d+)?)/);

  const value = match
    ? Number(match[1])
    : 1;

  return Number.isFinite(value) &&
    value > 0
    ? value
    : 1;
}

function cleanOrderUnit(
  orderUnit: string
): string {
  const cleaned = orderUnit
    .replace(/\d+(?:\.\d+)?/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "Each";
}

function inferCountMethod(
  inventoryUnit: string
): CountMethod {
  const unit =
    inventoryUnit
      .trim()
      .toLowerCase();

  if (
    [
      "kg",
      "g",
      "gram",
      "grams",
      "kilogram",
      "kilograms",
    ].includes(unit)
  ) {
    return "Weight";
  }

  if (
    [
      "l",
      "litre",
      "litres",
      "ml",
      "millilitre",
      "millilitres",
    ].includes(unit)
  ) {
    return "Volume";
  }

  if (
    [
      "portion",
      "portions",
      "slice",
      "slices",
    ].includes(unit)
  ) {
    return "Portion";
  }

  return "Each";
}

function uniquePositiveIds(
  values: unknown
): number[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map(Number)
        .filter(
          (value) =>
            Number.isFinite(value) &&
            value > 0
        )
    )
  );
}

function normaliseProduct(
  product: Partial<Product> & {
    id: number;
    name: string;
  }
): Product {
  const timestamp = now();

  const legacySupplier =
    "supplier" in product
      ? String(
          (
            product as Partial<Product> & {
              supplier?: string;
            }
          ).supplier ?? ""
        )
      : "";

  const supplierName =
    product.supplierName?.trim() ||
    legacySupplier.trim() ||
    "Not assigned";

  const matchingSupplier =
    typeof window !== "undefined"
      ? getSuppliers().find(
          (supplier) =>
            supplier.name
              .trim()
              .toLowerCase() ===
            supplierName
              .trim()
              .toLowerCase()
        )
      : undefined;

  const savedSupplierId =
    Number.isFinite(product.supplierId)
      ? Number(product.supplierId)
      : 0;

  const supplierId =
    savedSupplierId > 0
      ? savedSupplierId
      : matchingSupplier?.id ?? 0;

  const legacyLocation =
    product.location?.trim() ||
    "Not assigned";

  const storageArea =
    product.storageArea?.trim() ||
    legacyLocation;

  return {
    id: product.id,

    name: product.name.trim(),

    category:
      product.category?.trim() ||
      "Uncategorised",

    productType:
      product.productType ||
      "ingredient",

    internalCode:
      product.internalCode?.trim() ||
      "",

    posCode:
      product.posCode?.trim() ||
      "",

    barcode:
      product.barcode?.trim() ||
      "",

    supplierId,
    supplierName,

    supplierCode:
      product.supplierCode?.trim() ||
      "",

    alternativeSupplierIds:
      uniquePositiveIds(
        product.alternativeSupplierIds
      ).filter(
        (id) => id !== supplierId
      ),

    orderUnit:
      cleanOrderUnit(
        product.orderUnit?.trim() ||
          "Each"
      ),

    purchaseQuantity: Math.max(
      0.000001,
      Number.isFinite(
        product.purchaseQuantity
      )
        ? Number(
            product.purchaseQuantity
          )
        : inferPurchaseQuantity(
            product.orderUnit?.trim() ||
              "Each"
          )
    ),

    inventoryUnit:
      product.inventoryUnit?.trim() ||
      "Each",

    countMethod:
      product.countMethod ||
      inferCountMethod(
        product.inventoryUnit?.trim() ||
          "Each"
      ),

    minimumStock: Math.max(
      0,
      Number(
        product.minimumStock
      ) || 0
    ),

    maximumStock: Math.max(
      0,
      Number(
        product.maximumStock
      ) || 0
    ),

    reorderPoint: Math.max(
      0,
      Number.isFinite(
        product.reorderPoint
      )
        ? Number(
            product.reorderPoint
          )
        : Number(
            product.minimumStock
          ) || 0
    ),

    price: Math.max(
      0,
      Number(product.price) || 0
    ),

    location: storageArea,
    storageArea,

    shelf:
      product.shelf?.trim() || "",

    binLocation:
      product.binLocation?.trim() ||
      "",

    leadTimeDays: Math.max(
      0,
      Math.round(
        Number(
          product.leadTimeDays
        ) || 0
      )
    ),

    deliveryDays:
      Array.isArray(
        product.deliveryDays
      )
        ? product.deliveryDays
            .map(String)
            .map((day) => day.trim())
            .filter(Boolean)
        : matchingSupplier?.deliveryDays ??
          [],

    storageNotes:
      product.storageNotes?.trim() ||
      "",

    internalNotes:
      product.internalNotes?.trim() ||
      "",

    active:
      typeof product.active ===
      "boolean"
        ? product.active
        : true,

    createdAt:
      product.createdAt ||
      timestamp,

    updatedAt:
      product.updatedAt ||
      timestamp,
  };
}

function validateProductInput(
  input: CreateProductInput
): void {
  if (!input.name.trim()) {
    throw new Error(
      "Enter a product name."
    );
  }

  if (!input.category.trim()) {
    throw new Error(
      "Enter a category."
    );
  }

  if (!input.supplierId) {
    throw new Error(
      "Choose a preferred supplier."
    );
  }

  if (!input.orderUnit.trim()) {
    throw new Error(
      "Enter a purchase unit."
    );
  }

  if (
    !Number.isFinite(
      input.purchaseQuantity
    ) ||
    input.purchaseQuantity <= 0
  ) {
    throw new Error(
      "Purchase quantity must be greater than zero."
    );
  }

  if (!input.inventoryUnit.trim()) {
    throw new Error(
      "Enter an inventory unit."
    );
  }

  if (
    !Number.isFinite(input.price) ||
    input.price < 0
  ) {
    throw new Error(
      "Enter a valid purchase price."
    );
  }

  if (
    input.maximumStock > 0 &&
    input.minimumStock >
      input.maximumStock
  ) {
    throw new Error(
      "Minimum stock cannot exceed maximum stock."
    );
  }

  if (
    input.maximumStock > 0 &&
    input.reorderPoint >
      input.maximumStock
  ) {
    throw new Error(
      "Reorder point cannot exceed maximum stock."
    );
  }
}

function getNextProductId(
  products: Product[]
): number {
  return (
    products.reduce(
      (highest, product) =>
        Math.max(
          highest,
          product.id
        ),
      0
    ) + 1
  );
}

export function getProducts(): Product[] {
  if (typeof window === "undefined") {
    return cloneStarterProducts();
  }

  const saved =
    window.localStorage.getItem(
      STORAGE_KEY
    );

  if (!saved) {
    return initialiseProducts();
  }

  try {
    const parsed: unknown =
      JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return initialiseProducts();
    }

    if (
      !window.localStorage.getItem(
        LEGACY_STOCK_STORAGE_KEY
      )
    ) {
      const legacyStock = (
        parsed as Array<{
          id?: unknown;
          currentStock?: unknown;
        }>
      )
        .filter(
          (product) =>
            Number.isFinite(
              product.id
            ) &&
            Number.isFinite(
              product.currentStock
            )
        )
        .map((product) => ({
          productId:
            Number(product.id),

          quantity: Math.max(
            0,
            Number(
              product.currentStock
            )
          ),
        }));

      window.localStorage.setItem(
        LEGACY_STOCK_STORAGE_KEY,
        JSON.stringify(legacyStock)
      );
    }

    const products = parsed.map(
      (product) =>
        normaliseProduct(
          product as Partial<Product> & {
            id: number;
            name: string;
          }
        )
    );

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(products)
    );

    return products;
  } catch {
    return initialiseProducts();
  }
}

export function getActiveProducts(): Product[] {
  return getProducts().filter(
    (product) => product.active
  );
}

export function getArchivedProducts(): Product[] {
  return getProducts().filter(
    (product) => !product.active
  );
}

export function getProductById(
  id: number
): Product | undefined {
  return getProducts().find(
    (product) => product.id === id
  );
}

export function getProductsBySupplier(
  supplierId: number
): Product[] {
  return getActiveProducts().filter(
    (product) =>
      product.supplierId ===
        supplierId ||
      product.alternativeSupplierIds.includes(
        supplierId
      )
  );
}

export function saveProducts(
  products: Product[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(products)
  );

  emitProductsChanged();
  scheduleCloudCatalogSave();
}

export function createProduct(
  input: CreateProductInput
): Product {
  validateProductInput(input);

  const products = getProducts();

  if (
    products.some(
      (product) =>
        product.name
          .trim()
          .toLowerCase() ===
        input.name
          .trim()
          .toLowerCase()
    )
  ) {
    throw new Error(
      "A product with this name already exists."
    );
  }

  const timestamp = now();

  const product = normaliseProduct({
    id: getNextProductId(
      products
    ),

    ...input,

    location:
      input.storageArea,

    active: true,

    createdAt: timestamp,
    updatedAt: timestamp,
  });

  saveProducts([
    ...products,
    product,
  ]);

  return product;
}

export function updateProduct(
  id: number,
  input: UpdateProductInput
): Product {
  validateProductInput(input);

  const products = getProducts();

  const existing =
    products.find(
      (product) =>
        product.id === id
    );

  if (!existing) {
    throw new Error(
      "Product not found."
    );
  }

  if (
    products.some(
      (product) =>
        product.id !== id &&
        product.name
          .trim()
          .toLowerCase() ===
        input.name
          .trim()
          .toLowerCase()
    )
  ) {
    throw new Error(
      "Another product already uses this name."
    );
  }

  const updated =
    normaliseProduct({
      ...existing,
      ...input,

      id: existing.id,
      name: input.name,

      location:
        input.storageArea,

      updatedAt: now(),
    });

  saveProducts(
    products.map((product) =>
      product.id === id
        ? updated
        : product
    )
  );

  return updated;
}

export function archiveProduct(
  id: number
): Product {
  return setProductActive(
    id,
    false
  );
}

export function restoreProduct(
  id: number
): Product {
  return setProductActive(
    id,
    true
  );
}

function setProductActive(
  id: number,
  active: boolean
): Product {
  const products = getProducts();

  const existing =
    products.find(
      (product) =>
        product.id === id
    );

  if (!existing) {
    throw new Error(
      "Product not found."
    );
  }

  const updated: Product = {
    ...existing,
    active,
    updatedAt: now(),
  };

  saveProducts(
    products.map((product) =>
      product.id === id
        ? updated
        : product
    )
  );

  return updated;
}

export function getProductUnitCost(
  product: Product
): number {
  if (
    product.purchaseQuantity <= 0
  ) {
    return 0;
  }

  return (
    product.price /
    product.purchaseQuantity
  );
}

export function getProductStockValue(
  product: Product,
  quantity: number
): number {
  return (
    getProductUnitCost(product) *
    Math.max(0, quantity)
  );
}


export function deleteProductPermanently(
  productId: number
): void {
  const currentProducts =
    getProducts();

  const product =
    currentProducts.find(
      (item) =>
        item.id === productId
    );

  if (!product) {
    throw new Error(
      "Product not found."
    );
  }

  if (product.active) {
    throw new Error(
      "Archive the product before permanently deleting it."
    );
  }

  saveProducts(
    currentProducts.filter(
      (item) =>
        item.id !== productId
    )
  );
}

export function deleteAllArchivedProducts(): number {
  const currentProducts =
    getProducts();

  const archivedCount =
    currentProducts.filter(
      (product) =>
        !product.active
    ).length;

  saveProducts(
    currentProducts.filter(
      (product) =>
        product.active
    )
  );

  return archivedCount;
}

export function subscribeToProductChanges(
  callback: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleLocal(): void {
    callback();
  }

  function handleStorage(
    event: StorageEvent
  ): void {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  }

  window.addEventListener(
    PRODUCTS_CHANGED_EVENT,
    handleLocal
  );

  window.addEventListener(
    "storage",
    handleStorage
  );

  return () => {
    window.removeEventListener(
      PRODUCTS_CHANGED_EVENT,
      handleLocal
    );

    window.removeEventListener(
      "storage",
      handleStorage
    );
  };
}
