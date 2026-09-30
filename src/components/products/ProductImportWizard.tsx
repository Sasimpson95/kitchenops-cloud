"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  PackagePlus,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { readSheet } from "read-excel-file/browser";

import type { CountMethod } from "@/data/products";
import {
  createProduct,
  createProductsBulk,
  getProducts,
  type CreateProductInput,
} from "@/lib/productStore";
import { getSuppliers } from "@/lib/supplierStore";
import {
  createProductCategory,
  loadProductOptions,
  type ProductCategoryOption,
  type ProductUnitOption,
} from "@/lib/productOptions";

type ImportStage =
  | "choose"
  | "upload"
  | "manual"
  | "mapping"
  | "preview"
  | "complete";

type ProductImportWizardProps = {
  onImported?: (count: number) => void;
  onCancel?: () => void;
  onBack?: () => void;
};

type RawRow = Record<string, unknown>;

type MappingKey =
  | "name"
  | "category"
  | "supplierName"
  | "supplierCode"
  | "productType"
  | "internalCode"
  | "posCode"
  | "barcode"
  | "orderUnit"
  | "purchaseQuantity"
  | "inventoryUnit"
  | "price"
  | "minimumStock"
  | "maximumStock"
  | "reorderPoint"
  | "storageArea"
  | "shelf"
  | "binLocation"
  | "leadTimeDays"
  | "deliveryDays"
  | "storageNotes"
  | "internalNotes";

type ColumnMapping = Record<MappingKey, string>;

type PreviewRow = {
  rowNumber: number;
  product: CreateProductInput | null;
  name: string;
  supplierName: string;
  errors: string[];
};

const EMPTY_MAPPING: ColumnMapping = {
  name: "",
  category: "",
  supplierName: "",
  supplierCode: "",
  productType: "",
  internalCode: "",
  posCode: "",
  barcode: "",
  orderUnit: "",
  purchaseQuantity: "",
  inventoryUnit: "",
  price: "",
  minimumStock: "",
  maximumStock: "",
  reorderPoint: "",
  storageArea: "",
  shelf: "",
  binLocation: "",
  leadTimeDays: "",
  deliveryDays: "",
  storageNotes: "",
  internalNotes: "",
};

const FIELD_OPTIONS: Array<{
  key: MappingKey;
  label: string;
  required?: boolean;
  description?: string;
}> = [
  {
    key: "name",
    label: "Product Name",
    required: true,
  },
  {
    key: "category",
    label: "Category",
    required: true,
  },
  {
    key: "supplierName",
    label: "Supplier Name",
    required: true,
  },
  {
    key: "supplierCode",
    label: "Supplier Product Code",
  },
  {
    key: "productType",
    label: "Product Type",
    description:
      "ingredient, packaging, retail, cleaning or consumable",
  },
  {
    key: "internalCode",
    label: "Internal Code",
  },
  {
    key: "posCode",
    label: "POS / Sales Code",
  },
  {
    key: "barcode",
    label: "Barcode",
  },
  {
    key: "orderUnit",
    label: "Purchase Unit",
    required: true,
  },
  {
    key: "purchaseQuantity",
    label: "Quantity in Purchase Unit",
    required: true,
  },
  {
    key: "inventoryUnit",
    label: "Inventory Unit",
    required: true,
  },
  {
    key: "price",
    label: "Purchase Price",
    required: true,
  },
  {
    key: "minimumStock",
    label: "Minimum Stock",
  },
  {
    key: "maximumStock",
    label: "Maximum Stock",
  },
  {
    key: "reorderPoint",
    label: "Reorder Point",
  },
  {
    key: "storageArea",
    label: "Storage Area",
  },
  {
    key: "shelf",
    label: "Shelf",
  },
  {
    key: "binLocation",
    label: "Bin / Position",
  },
  {
    key: "leadTimeDays",
    label: "Lead Time (days)",
  },
  {
    key: "deliveryDays",
    label: "Delivery Days",
    description:
      "Separate multiple days with commas",
  },
  {
    key: "storageNotes",
    label: "Storage Instructions",
  },
  {
    key: "internalNotes",
    label: "Internal Notes",
  },
];

const HEADER_ALIASES: Record<MappingKey, string[]> = {
  name: [
    "product",
    "product name",
    "item",
    "item name",
    "description",
    "product description",
  ],
  category: [
    "category",
    "product category",
    "group",
  ],
  supplierName: [
    "supplier",
    "supplier name",
    "vendor",
    "vendor name",
  ],
  supplierCode: [
    "supplier code",
    "supplier product code",
    "vendor code",
    "product code",
    "sku",
  ],
  productType: [
    "product type",
    "type",
  ],
  internalCode: [
    "internal code",
    "internal sku",
  ],
  posCode: [
    "pos code",
    "sales code",
    "plu",
  ],
  barcode: [
    "barcode",
    "ean",
    "upc",
  ],
  orderUnit: [
    "purchase unit",
    "order unit",
    "case unit",
    "pack unit",
    "buying unit",
  ],
  purchaseQuantity: [
    "purchase quantity",
    "quantity in purchase unit",
    "pack size",
    "case size",
    "units per case",
    "qty per case",
  ],
  inventoryUnit: [
    "inventory unit",
    "stock unit",
    "base unit",
    "count unit",
  ],
  price: [
    "price",
    "purchase price",
    "cost",
    "case cost",
    "unit price",
  ],
  minimumStock: [
    "minimum stock",
    "min stock",
    "minimum",
  ],
  maximumStock: [
    "maximum stock",
    "max stock",
    "maximum",
  ],
  reorderPoint: [
    "reorder point",
    "reorder",
    "par",
    "par level",
  ],
  storageArea: [
    "storage area",
    "location",
    "storage",
  ],
  shelf: [
    "shelf",
  ],
  binLocation: [
    "bin",
    "bin location",
    "position",
  ],
  leadTimeDays: [
    "lead time",
    "lead time days",
    "lead days",
  ],
  deliveryDays: [
    "delivery days",
    "delivery day",
  ],
  storageNotes: [
    "storage notes",
    "storage instructions",
  ],
  internalNotes: [
    "internal notes",
    "notes",
  ],
};

function cleanHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function autoMapHeaders(
  headers: string[]
): ColumnMapping {
  const next: ColumnMapping = {
    ...EMPTY_MAPPING,
  };

  const normalisedHeaders = headers.map(
    (header) => ({
      original: header,
      normalised: cleanHeader(header),
    })
  );

  (
    Object.keys(
      HEADER_ALIASES
    ) as MappingKey[]
  ).forEach((key) => {
    const aliases = HEADER_ALIASES[key];

    const exact = normalisedHeaders.find(
      (header) =>
        aliases.includes(header.normalised)
    );

    if (exact) {
      next[key] = exact.original;
      return;
    }

    const partial = normalisedHeaders.find(
      (header) =>
        aliases.some(
          (alias) =>
            header.normalised.includes(alias) ||
            alias.includes(header.normalised)
        )
    );

    if (partial) {
      next[key] = partial.original;
    }
  });

  return next;
}

function cellString(
  row: RawRow,
  column: string
): string {
  if (!column) return "";

  const value = row[column];

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

function cellNumber(
  row: RawRow,
  column: string,
  fallback = 0
): number {
  if (!column) return fallback;

  const raw = row[column];

  if (
    raw === null ||
    raw === undefined ||
    raw === ""
  ) {
    return fallback;
  }

  if (typeof raw === "number") {
    return Number.isFinite(raw)
      ? raw
      : fallback;
  }

  const cleaned = String(raw)
    .trim()
    .replace(/\u00A3/g, "")
    .replace(/\u00A3/g, "");

  const value = Number(cleaned);

  return Number.isFinite(value)
    ? value
    : Number.NaN;
}

function parseDays(value: string): string[] {
  if (!value.trim()) return [];

  const validDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return value
    .split(/[,;/|]+/)
    .map((day) => day.trim())
    .filter(Boolean)
    .map((day) => {
      const match = validDays.find(
        (validDay) =>
          validDay.toLowerCase() ===
          day.toLowerCase()
      );

      return match ?? day;
    });
}

function inferCountMethod(
  inventoryUnit: string
): CountMethod {
  const unit = inventoryUnit
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

function normaliseProductType(
  value: string
):
  | "ingredient"
  | "packaging"
  | "retail"
  | "cleaning"
  | "consumable" {
  const cleaned = value
    .trim()
    .toLowerCase();

  if (
    cleaned === "packaging" ||
    cleaned === "retail" ||
    cleaned === "cleaning" ||
    cleaned === "consumable"
  ) {
    return cleaned;
  }

  return "ingredient";
}

function makeTemplate(): void {
  const headers = [
    "Product Name",
    "Category",
    "Supplier Name",
    "Supplier Product Code",
    "Product Type",
    "Purchase Unit",
    "Quantity in Purchase Unit",
    "Inventory Unit",
    "Purchase Price",
    "Minimum Stock",
    "Maximum Stock",
    "Reorder Point",
    "Storage Area",
    "Shelf",
    "Bin / Position",
    "Lead Time (days)",
    "Delivery Days",
    "Barcode",
    "Internal Code",
    "POS / Sales Code",
    "Storage Instructions",
    "Internal Notes",
  ];

  const example = [
    "Example Eggs",
    "Dairy",
    "Example Supplier",
    "EGG001",
    "ingredient",
    "Tray",
    "30",
    "Each",
    "6.50",
    "30",
    "120",
    "60",
    "Fridge",
    "",
    "",
    "1",
    "Monday, Wednesday, Friday",
    "",
    "",
    "",
    "Keep refrigerated",
    "",
  ];

  function csvEscape(value: string): string {
    if (
      value.includes(",") ||
      value.includes('"') ||
      value.includes("\n")
    ) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }

  const csv = [
    headers.map(csvEscape).join(","),
    example.map(csvEscape).join(","),
  ].join("\r\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download =
    "KitchenOps_Product_Import_Template.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (
      (character === "\n" ||
        character === "\r") &&
      !inQuotes
    ) {
      if (
        character === "\r" &&
        nextCharacter === "\n"
      ) {
        index += 1;
      }

      row.push(cell);

      if (
        row.some(
          (value) =>
            value.trim() !== ""
        )
      ) {
        rows.push(row);
      }

      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  row.push(cell);

  if (
    row.some(
      (value) =>
        value.trim() !== ""
    )
  ) {
    rows.push(row);
  }

  return rows;
}

export default function ProductImportWizard({
  onImported,
  onCancel,
  onBack,
}: ProductImportWizardProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(null);

  const [stage, setStage] =
    useState<ImportStage>("choose");

  const [fileName, setFileName] =
    useState("");

  const [headers, setHeaders] =
    useState<string[]>([]);

  const [rows, setRows] =
    useState<RawRow[]>([]);

  const [mapping, setMapping] =
    useState<ColumnMapping>({
      ...EMPTY_MAPPING,
    });

  const [importing, setImporting] =
    useState(false);

  const [importedCount, setImportedCount] =
    useState(0);

  const [error, setError] =
    useState("");

  const [categories, setCategories] =
    useState<ProductCategoryOption[]>([]);

  const [units, setUnits] =
    useState<ProductUnitOption[]>([]);

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  const [manualName, setManualName] =
    useState("");

  const [manualCategory, setManualCategory] =
    useState("");

  const [showNewCategory, setShowNewCategory] =
    useState(false);

  const [newCategoryName, setNewCategoryName] =
    useState("");

  const [creatingCategory, setCreatingCategory] =
    useState(false);

  const [manualSupplierId, setManualSupplierId] =
    useState(0);

  const [manualSupplierCode, setManualSupplierCode] =
    useState("");

  const [manualOrderUnit, setManualOrderUnit] =
    useState("");

  const [
    manualPurchaseQuantity,
    setManualPurchaseQuantity,
  ] = useState(1);

  const [
    manualInventoryUnit,
    setManualInventoryUnit,
  ] = useState("");

  const [manualPrice, setManualPrice] =
    useState("");

  const [savingManual, setSavingManual] =
    useState(false);

  const suppliers = useMemo(
    () =>
      getSuppliers().filter(
        (supplier) => supplier.active
      ),
    []
  );

  const existingProducts = useMemo(
    () => getProducts(),
    []
  );

  useEffect(() => {
    async function loadOptions(): Promise<void> {
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
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Product options could not be loaded."
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    void loadOptions();
  }, []);

  function resetManualForm(): void {
    setManualName("");
    setManualCategory("");
    setManualSupplierId(0);
    setManualSupplierCode("");
    setManualOrderUnit("");
    setManualPurchaseQuantity(1);
    setManualInventoryUnit("");
    setManualPrice("");
  }

  async function addCategory(): Promise<void> {
    const name = newCategoryName.trim();

    if (!name || creatingCategory) {
      return;
    }

    setCreatingCategory(true);
    setError("");

    try {
      const category =
        await createProductCategory(name);

      setCategories((current) => [
        ...current,
        category,
      ]);

      setManualCategory(category.name);
      setNewCategoryName("");
      setShowNewCategory(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The category could not be created."
      );
    } finally {
      setCreatingCategory(false);
    }
  }

  function saveManualProduct(): void {
    if (savingManual) return;

    setError("");

    const supplier =
      suppliers.find(
        (item) =>
          item.id === manualSupplierId
      );

    if (!manualName.trim()) {
      setError("Enter a product name.");
      return;
    }

    if (!manualCategory) {
      setError("Choose a category.");
      return;
    }

    if (!supplier) {
      setError("Choose a supplier.");
      return;
    }

    if (!manualOrderUnit) {
      setError("Choose how you buy this product.");
      return;
    }

    if (
      !Number.isFinite(
        manualPurchaseQuantity
      ) ||
      manualPurchaseQuantity <= 0
    ) {
      setError(
        "Quantity in the purchase unit must be greater than zero."
      );
      return;
    }

    if (!manualInventoryUnit) {
      setError(
        "Choose how KitchenOps should track this product."
      );
      return;
    }

    const parsedManualPrice =
      Number(manualPrice);

    if (
      manualPrice.trim() === "" ||
      !Number.isFinite(parsedManualPrice) ||
      parsedManualPrice < 0
    ) {
      setError(
        "Enter a valid purchase price."
      );
      return;
    }

    try {
      setSavingManual(true);

      createProduct({
        name: manualName.trim(),
        category: manualCategory,
        productType: "ingredient",
        internalCode: "",
        posCode: "",
        barcode: "",
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierCode:
          manualSupplierCode.trim(),
        alternativeSupplierIds: [],
        orderUnit: manualOrderUnit,
        purchaseQuantity:
          manualPurchaseQuantity,
        inventoryUnit:
          manualInventoryUnit,
        countMethod:
          inferCountMethod(
            manualInventoryUnit
          ),
        stocktakeUnits:
          Array.from(
            new Set(
              [
                manualOrderUnit,
                manualInventoryUnit,
              ].filter(Boolean)
            )
          ),
        minimumStock: 0,
        maximumStock: 0,
        reorderPoint: 0,
        price: parsedManualPrice,
        storageArea: "",
        shelf: "",
        binLocation: "",
        leadTimeDays: 0,
        deliveryDays:
          supplier.deliveryDays,
        storageNotes: "",
        internalNotes: "",
      });

      resetManualForm();
      setImportedCount(1);
      setStage("complete");
      onImported?.(1);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The product could not be created."
      );
    } finally {
      setSavingManual(false);
    }
  }

  async function readFile(
    file: File
  ): Promise<void> {
    setError("");

    try {
      let table: unknown[][];

      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() ?? "";

      if (extension === "xlsx") {
        table =
          (await readSheet(
            file
          )) as unknown[][];
      } else if (extension === "csv") {
        const text =
          await file.text();

        table = parseCsv(text);
      } else {
        throw new Error(
          "Choose an .xlsx or .csv file."
        );
      }

      if (table.length < 2) {
        throw new Error(
          "The spreadsheet needs a header row and at least one product."
        );
      }

      const rawHeaders = table[0].map(
        (value) => String(value).trim()
      );

      const usableHeaders =
        rawHeaders.filter(Boolean);

      if (usableHeaders.length === 0) {
        throw new Error(
          "KitchenOps could not find any column headings."
        );
      }

      const parsedRows: RawRow[] =
        table
          .slice(1)
          .map((cells) => {
            const row: RawRow = {};

            rawHeaders.forEach(
              (header, index) => {
                if (!header) return;
                row[header] =
                  cells[index] ?? "";
              }
            );

            return row;
          })
          .filter((row) =>
            Object.values(row).some(
              (value) =>
                String(value ?? "").trim() !== ""
            )
          );

      if (parsedRows.length === 0) {
        throw new Error(
          "KitchenOps could not find any product rows."
        );
      }

      setFileName(file.name);
      setHeaders(usableHeaders);
      setRows(parsedRows);
      setMapping(
        autoMapHeaders(usableHeaders)
      );
      setStage("mapping");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The spreadsheet could not be read."
      );
    }
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    const file =
      event.target.files?.[0];

    if (!file) return;

    await readFile(file);

    event.target.value = "";
  }

  const requiredMappingsComplete =
    Boolean(
      mapping.name &&
        mapping.category &&
        mapping.supplierName &&
        mapping.orderUnit &&
        mapping.purchaseQuantity &&
        mapping.inventoryUnit &&
        mapping.price
    );

  const preview = useMemo<
    PreviewRow[]
  >(() => {
    if (rows.length === 0) {
      return [];
    }

    const existingNames = new Set(
      existingProducts.map((product) =>
        product.name.trim().toLowerCase()
      )
    );

    const namesInFile =
      new Map<string, number>();

    return rows.map((row, index) => {
      const errors: string[] = [];

      const name =
        cellString(row, mapping.name);

      const category =
        cellString(row, mapping.category);

      const supplierName =
        cellString(
          row,
          mapping.supplierName
        );

      const supplier =
        suppliers.find(
          (item) =>
            item.name
              .trim()
              .toLowerCase() ===
            supplierName
              .trim()
              .toLowerCase()
        );

      const orderUnit =
        cellString(
          row,
          mapping.orderUnit
        );

      const inventoryUnit =
        cellString(
          row,
          mapping.inventoryUnit
        );

      const purchaseQuantity =
        cellNumber(
          row,
          mapping.purchaseQuantity,
          1
        );

      const price =
        cellNumber(
          row,
          mapping.price,
          0
        );

      const minimumStock =
        cellNumber(
          row,
          mapping.minimumStock,
          0
        );

      const maximumStock =
        cellNumber(
          row,
          mapping.maximumStock,
          0
        );

      const reorderPoint =
        cellNumber(
          row,
          mapping.reorderPoint,
          0
        );

      const leadTimeDays =
        cellNumber(
          row,
          mapping.leadTimeDays,
          0
        );

      if (!name) {
        errors.push(
          "Product name is missing."
        );
      }

      if (!category) {
        errors.push(
          "Category is missing."
        );
      }

      if (!supplierName) {
        errors.push(
          "Supplier name is missing."
        );
      } else if (!supplier) {
        errors.push(
          `Supplier "${supplierName}" does not exist in KitchenOps.`
        );
      }

      if (!orderUnit) {
        errors.push(
          "Purchase unit is missing."
        );
      }

      if (!inventoryUnit) {
        errors.push(
          "Inventory unit is missing."
        );
      }

      if (
        !Number.isFinite(
          purchaseQuantity
        ) ||
        purchaseQuantity <= 0
      ) {
        errors.push(
          "Purchase quantity must be greater than zero."
        );
      }

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        errors.push(
          "Purchase price is invalid."
        );
      }

      if (
        !Number.isFinite(
          minimumStock
        ) ||
        minimumStock < 0
      ) {
        errors.push(
          "Minimum stock is invalid."
        );
      }

      if (
        !Number.isFinite(
          maximumStock
        ) ||
        maximumStock < 0
      ) {
        errors.push(
          "Maximum stock is invalid."
        );
      }

      if (
        !Number.isFinite(
          reorderPoint
        ) ||
        reorderPoint < 0
      ) {
        errors.push(
          "Reorder point is invalid."
        );
      }

      if (
        maximumStock > 0 &&
        minimumStock > maximumStock
      ) {
        errors.push(
          "Minimum stock exceeds maximum stock."
        );
      }

      if (
        maximumStock > 0 &&
        reorderPoint > maximumStock
      ) {
        errors.push(
          "Reorder point exceeds maximum stock."
        );
      }

      if (
        !Number.isFinite(
          leadTimeDays
        ) ||
        leadTimeDays < 0
      ) {
        errors.push(
          "Lead time is invalid."
        );
      }

      const normalisedName =
        name.trim().toLowerCase();

      if (
        name &&
        existingNames.has(
          normalisedName
        )
      ) {
        errors.push(
          "A product with this name already exists."
        );
      }

      if (name) {
        const count =
          namesInFile.get(
            normalisedName
          ) ?? 0;

        namesInFile.set(
          normalisedName,
          count + 1
        );
      }

      const stocktakeUnits =
        Array.from(
          new Set(
            [
              orderUnit,
              inventoryUnit,
            ].filter(Boolean)
          )
        );

      const product: CreateProductInput | null =
        supplier
          ? {
              name,
              category,
              productType:
                normaliseProductType(
                  cellString(
                    row,
                    mapping.productType
                  )
                ),
              internalCode:
                cellString(
                  row,
                  mapping.internalCode
                ),
              posCode:
                cellString(
                  row,
                  mapping.posCode
                ),
              barcode:
                cellString(
                  row,
                  mapping.barcode
                ),
              supplierId:
                supplier.id,
              supplierName:
                supplier.name,
              supplierCode:
                cellString(
                  row,
                  mapping.supplierCode
                ),
              alternativeSupplierIds:
                [],
              orderUnit,
              purchaseQuantity,
              inventoryUnit,
              countMethod:
                inferCountMethod(
                  inventoryUnit
                ),
              stocktakeUnits,
              minimumStock,
              maximumStock,
              reorderPoint,
              price,
              storageArea:
                cellString(
                  row,
                  mapping.storageArea
                ),
              shelf:
                cellString(
                  row,
                  mapping.shelf
                ),
              binLocation:
                cellString(
                  row,
                  mapping.binLocation
                ),
              leadTimeDays:
                Math.round(
                  leadTimeDays
                ),
              deliveryDays:
                parseDays(
                  cellString(
                    row,
                    mapping.deliveryDays
                  )
                ).length > 0
                  ? parseDays(
                      cellString(
                        row,
                        mapping.deliveryDays
                      )
                    )
                  : supplier.deliveryDays,
              storageNotes:
                cellString(
                  row,
                  mapping.storageNotes
                ),
              internalNotes:
                cellString(
                  row,
                  mapping.internalNotes
                ),
            }
          : null;

      return {
        rowNumber: index + 2,
        product,
        name,
        supplierName,
        errors,
      };
    });
  }, [
    existingProducts,
    mapping,
    rows,
    suppliers,
  ]);

  const duplicateNames =
    useMemo(() => {
      const counts =
        new Map<string, number>();

      preview.forEach((row) => {
        const name =
          row.name
            .trim()
            .toLowerCase();

        if (!name) return;

        counts.set(
          name,
          (counts.get(name) ?? 0) + 1
        );
      });

      return new Set(
        Array.from(counts.entries())
          .filter(
            ([, count]) => count > 1
          )
          .map(([name]) => name)
      );
    }, [preview]);

  const finalPreview =
    useMemo(
      () =>
        preview.map((row) => {
          if (
            !row.name ||
            !duplicateNames.has(
              row.name
                .trim()
                .toLowerCase()
            )
          ) {
            return row;
          }

          return {
            ...row,
            errors: [
              ...row.errors,
              "This product name appears more than once in the spreadsheet.",
            ],
          };
        }),
      [duplicateNames, preview]
    );

  const errorRows =
    finalPreview.filter(
      (row) => row.errors.length > 0
    );

  const validRows =
    finalPreview.filter(
      (
        row
      ): row is PreviewRow & {
        product: CreateProductInput;
      } =>
        row.errors.length === 0 &&
        row.product !== null
    );

  function goToPreview(): void {
    setError("");

    if (!requiredMappingsComplete) {
      setError(
        "Map every required KitchenOps field before continuing."
      );
      return;
    }

    setStage("preview");
  }

  function updateMapping(
    key: MappingKey,
    value: string
  ): void {
    setMapping((current) => ({
      ...current,
      [key]: value,
    }));

    setError("");
  }

  async function importProducts(): Promise<void> {
    if (
      importing ||
      errorRows.length > 0 ||
      validRows.length === 0
    ) {
      return;
    }

    setImporting(true);
    setError("");

    try {
      const created =
        createProductsBulk(
          validRows.map(
            (row) => row.product
          )
        );

      setImportedCount(
        created.length
      );

      setStage("complete");

      onImported?.(
        created.length
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The products could not be imported."
      );
    } finally {
      setImporting(false);
    }
  }

  function startAgain(): void {
    setStage("choose");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({
      ...EMPTY_MAPPING,
    });
    setImportedCount(0);
    setError("");
  }

  return (
          <div className="w-full">
        {stage === "choose" && (
          <div>
            <div>
              <h3 className="text-2xl font-bold text-gray-950">
                How would you like to add your products?
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                If you already have a product list, importing will save time.
                If you are new to KitchenOps, add one product first and we
                will explain what the important fields mean.
              </p>
            </div>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft size={16} />
                Back to supplier
              </button>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStage("upload");
                }}
                className="rounded-2xl border border-violet-200 bg-violet-50 p-6 text-left transition hover:border-violet-400"
              >
                <FileSpreadsheet
                  size={27}
                  className="text-violet-800"
                />

                <h4 className="mt-4 text-lg font-bold text-violet-950">
                  Import a spreadsheet
                </h4>

                <p className="mt-2 text-sm leading-6 text-violet-800">
                  Best if you already have an Excel or CSV catalogue.
                  KitchenOps will help match and check the information.
                </p>

                <span className="mt-5 inline-flex items-center gap-2 font-semibold text-violet-900">
                  Start import
                  <ArrowRight size={17} />
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStage("manual");
                }}
                className="rounded-2xl border border-gray-200 bg-white p-6 text-left transition hover:border-violet-300 hover:bg-slate-50"
              >
                <PackagePlus
                  size={27}
                  className="text-violet-800"
                />

                <h4 className="mt-4 text-lg font-bold text-gray-950">
                  Add one product manually
                </h4>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Great for learning KitchenOps. We will guide you through
                  your first product and explain each important field.
                </p>

                <span className="mt-5 inline-flex items-center gap-2 font-semibold text-violet-900">
                  Add first product
                  <ArrowRight size={17} />
                </span>
              </button>
            </div>
          </div>
        )}

        {stage === "manual" && (
          <div>
            <button
              type="button"
              onClick={() => {
                setError("");
                setStage("choose");
              }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              Choose another method
            </button>

            <div className="mt-5">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">
                Your first product
              </p>

              <h3 className="mt-2 text-2xl font-bold text-gray-950">
                Let's add one together.
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                We only need the essentials for now. You can add storage
                locations, par levels, barcodes and other details later.
              </p>
            </div>

            {loadingOptions ? (
              <div className="mt-8 flex items-center gap-3 rounded-2xl bg-slate-50 p-6 font-semibold text-gray-600">
                <Loader2
                  size={19}
                  className="animate-spin"
                />
                Loading categories and units...
              </div>
            ) : (
              <div className="mt-7 space-y-5">
                <label className="block rounded-2xl border border-gray-200 p-5">
                  <span className="font-bold text-gray-950">
                    Product name
                  </span>

                  <p className="mt-1 text-sm text-gray-500">
                    The name your team will recognise, such as Eggs,
                    Whole Milk or Hash Browns.
                  </p>

                  <input
                    value={manualName}
                    onChange={(event) => {
                      setManualName(
                        event.target.value
                      );
                      setError("");
                    }}
                    placeholder="Example: Free Range Eggs"
                    className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                  />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="rounded-2xl border border-gray-200 p-5">
                    <span className="font-bold text-gray-950">
                      Category
                    </span>

                    <p className="mt-1 text-sm text-gray-500">
                      Helps organise products in your catalogue and reports.
                    </p>

                    <select
                      value={manualCategory}
                      onChange={(event) => {
                        const value =
                          event.target.value;

                        if (value === "__new__") {
                          setShowNewCategory(true);
                          setManualCategory("");
                        } else {
                          setShowNewCategory(false);
                          setManualCategory(value);
                        }

                        setError("");
                      }}
                      className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-violet-800"
                    >
                      <option value="">
                        Choose category
                      </option>

                      {categories.map(
                        (category) => (
                          <option
                            key={category.id}
                            value={category.name}
                          >
                            {category.name}
                          </option>
                        )
                      )}

                      <option value="__new__">
                        + Create new category
                      </option>
                    </select>

                    {showNewCategory && (
                      <div className="mt-3 rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-gray-600">
                          Create a category
                        </p>

                        <div className="mt-2 flex gap-2">
                          <input
                            value={newCategoryName}
                            onChange={(event) =>
                              setNewCategoryName(
                                event.target.value
                              )
                            }
                            placeholder="Example: Dairy"
                            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-violet-800"
                          />

                          <button
                            type="button"
                            onClick={() => void addCategory()}
                            disabled={
                              creatingCategory ||
                              !newCategoryName.trim()
                            }
                            className="rounded-lg bg-violet-800 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-900 disabled:opacity-50"
                          >
                            {creatingCategory
                              ? "Adding..."
                              : "Add"}
                          </button>
                        </div>
                      </div>
                    )}
                  </label>

                  <label className="rounded-2xl border border-gray-200 p-5">
                    <span className="font-bold text-gray-950">
                      Supplier
                    </span>

                    <p className="mt-1 text-sm text-gray-500">
                      The supplier you normally buy this product from.
                    </p>

                    <select
                      value={manualSupplierId}
                      onChange={(event) => {
                        setManualSupplierId(
                          Number(
                            event.target.value
                          )
                        );
                        setError("");
                      }}
                      className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-violet-800"
                    >
                      <option value={0}>
                        Choose supplier
                      </option>

                      {suppliers.map(
                        (supplier) => (
                          <option
                            key={supplier.id}
                            value={supplier.id}
                          >
                            {supplier.name}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>

                <label className="block rounded-2xl border border-gray-200 p-5">
                  <span className="font-bold text-gray-950">
                    Supplier product code
                  </span>

                  <span className="ml-2 text-xs font-semibold text-gray-400">
                    Optional
                  </span>

                  <p className="mt-1 text-sm text-gray-500">
                    The code the supplier uses for this item. This can make
                    ordering and invoice matching easier later.
                  </p>

                  <input
                    value={manualSupplierCode}
                    onChange={(event) =>
                      setManualSupplierCode(
                        event.target.value
                      )
                    }
                    placeholder="Example: 123456"
                    className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                  />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="rounded-2xl border border-gray-200 p-5">
                    <span className="font-bold text-gray-950">
                      Purchase unit
                    </span>

                    <p className="mt-1 text-sm text-gray-500">
                      How you buy it from the supplier - for example Case,
                      Tray, Bag or Each.
                    </p>

                    <select
                      value={manualOrderUnit}
                      onChange={(event) => {
                        setManualOrderUnit(
                          event.target.value
                        );
                        setError("");
                      }}
                      className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-violet-800"
                    >
                      <option value="">
                        Choose purchase unit
                      </option>

                      {units.map((unit) => (
                        <option
                          key={unit.id}
                          value={unit.name}
                        >
                          {unit.name} ({unit.symbol})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="rounded-2xl border border-gray-200 p-5">
                    <span className="font-bold text-gray-950">
                      Quantity in purchase unit
                    </span>

                    <p className="mt-1 text-sm text-gray-500">
                      How many inventory units are inside what you buy.
                      Example: a tray containing 30 eggs = 30.
                    </p>

                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={manualPurchaseQuantity}
                      onChange={(event) =>
                        setManualPurchaseQuantity(
                          Math.max(
                            1,
                            Math.round(
                              Number(event.target.value)
                            )
                          )
                        )
                      }
                      className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                    />
                  </label>

                  <label className="rounded-2xl border border-gray-200 p-5">
                    <span className="font-bold text-gray-950">
                      Inventory unit
                    </span>

                    <p className="mt-1 text-sm text-gray-500">
                      How KitchenOps should track usage and stock.
                      Example: Each, kg or litre.
                    </p>

                    <select
                      value={manualInventoryUnit}
                      onChange={(event) => {
                        setManualInventoryUnit(
                          event.target.value
                        );
                        setError("");
                      }}
                      className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-violet-800"
                    >
                      <option value="">
                        Choose inventory unit
                      </option>

                      {units.map((unit) => (
                        <option
                          key={unit.id}
                          value={unit.name}
                        >
                          {unit.name} ({unit.symbol})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="rounded-2xl border border-gray-200 p-5">
                    <span className="font-bold text-gray-950">
                      Purchase price
                    </span>

                    <p className="mt-1 text-sm text-gray-500">
                      The cost of the full purchase unit before KitchenOps
                      works out the cost per inventory unit.
                    </p>

                    <div className="relative mt-4">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-gray-500">{"\u00A3"}</span>

                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={manualPrice}
                        onChange={(event) =>
                          setManualPrice(
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-gray-300 py-3 pl-9 pr-4 outline-none focus:border-violet-800"
                      />
                    </div>
                  </label>
                </div>

                {manualOrderUnit &&
                  manualInventoryUnit &&
                  manualPurchaseQuantity > 0 && (
                    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                      <p className="font-bold text-violet-950">
                        How KitchenOps will understand this product
                      </p>

                      <p className="mt-2 text-sm leading-6 text-violet-800">
                        1 {manualOrderUnit} ={" "}
                        {manualPurchaseQuantity}{" "}
                        {manualInventoryUnit}.
                        {Number(manualPrice) > 0
                          ? ` Estimated cost: \u00A3${(
                              Number(manualPrice) /
                              manualPurchaseQuantity
                            ).toFixed(4)} per ${manualInventoryUnit}.`
                          : ""}
                      </p>
                    </div>
                  )}

                <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setStage("choose");
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-slate-50"
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={saveManualProduct}
                    disabled={savingManual}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900 disabled:opacity-50"
                  >
                    {savingManual ? (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <PackagePlus size={18} />
                    )}

                    {savingManual
                      ? "Creating product..."
                      : "Create product & continue"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {stage === "upload" && (
        <div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
                <FileSpreadsheet
                  size={23}
                />
              </span>

              <div>
                <h3 className="text-xl font-bold text-violet-950">
                  Import your existing catalogue
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-800">
                  Upload an Excel or CSV file.
                  KitchenOps will read the headings,
                  help you match them to KitchenOps
                  fields and show any problems before
                  anything is imported.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                inputRef.current?.click()
              }
              className="rounded-2xl border-2 border-dashed border-violet-300 bg-white p-7 text-left transition hover:border-violet-500 hover:bg-violet-50"
            >
              <Upload
                className="text-violet-800"
                size={26}
              />

              <p className="mt-4 font-bold text-gray-950">
                Upload spreadsheet
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Choose .xlsx or .csv
              </p>
            </button>

            <button
              type="button"
              onClick={makeTemplate}
              className="rounded-2xl border border-gray-200 bg-white p-7 text-left transition hover:bg-slate-50"
            >
              <Download
                className="text-violet-800"
                size={26}
              />

              <p className="mt-4 font-bold text-gray-950">
                Download KitchenOps CSV template
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Use our example spreadsheet if
                you are starting from scratch.
              </p>
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <p className="font-semibold text-gray-900">
              Before you import
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Supplier names in the spreadsheet
              must match suppliers already created
              in KitchenOps. You can go back and
              add another supplier if one is
              missing.
            </p>
          </div>
        </div>
      )}

      {stage === "mapping" && (
        <div>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">
                Match your columns
              </p>

              <h3 className="mt-2 text-2xl font-bold text-gray-950">
                Tell KitchenOps what each column means.
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                {fileName} - {rows.length} product
                {rows.length === 1 ? "" : "s"} found
              </p>
            </div>

            <button
              type="button"
              onClick={startAgain}
              className="text-sm font-semibold text-gray-500 hover:text-gray-900"
            >
              Choose another file
            </button>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {FIELD_OPTIONS.map(
              (field) => (
                <label
                  key={field.key}
                  className="rounded-2xl border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-gray-900">
                      {field.label}
                    </span>

                    {field.required ? (
                      <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800">
                        Required
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">
                        Optional
                      </span>
                    )}
                  </div>

                  {field.description && (
                    <p className="mt-1 text-xs text-gray-500">
                      {field.description}
                    </p>
                  )}

                  <select
                    value={
                      mapping[field.key]
                    }
                    onChange={(event) =>
                      updateMapping(
                        field.key,
                        event.target.value
                      )
                    }
                    className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-violet-800"
                  >
                    <option value="">
                      Do not import
                    </option>

                    {headers.map(
                      (header) => (
                        <option
                          key={header}
                          value={header}
                        >
                          {header}
                        </option>
                      )
                    )}
                  </select>
                </label>
              )
            )}
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={startAgain}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
              Back
            </button>

            <button
              type="button"
              onClick={goToPreview}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900"
            >
              Check products
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {stage === "preview" && (
        <div>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">
                Import check
              </p>

              <h3 className="mt-2 text-2xl font-bold text-gray-950">
                Review before importing.
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                KitchenOps found {validRows.length} ready
                product{validRows.length === 1 ? "" : "s"} and{" "}
                {errorRows.length} row
                {errorRows.length === 1 ? "" : "s"} needing attention.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-gray-500">
                Spreadsheet rows
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-950">
                {finalPreview.length}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="text-sm text-emerald-700">
                Ready to import
              </p>
              <p className="mt-1 text-3xl font-bold text-emerald-900">
                {validRows.length}
              </p>
            </div>

            <div
              className={`rounded-2xl p-5 ${
                errorRows.length > 0
                  ? "bg-red-50"
                  : "bg-slate-50"
              }`}
            >
              <p
                className={`text-sm ${
                  errorRows.length > 0
                    ? "text-red-700"
                    : "text-gray-500"
                }`}
              >
                Problems
              </p>
              <p
                className={`mt-1 text-3xl font-bold ${
                  errorRows.length > 0
                    ? "text-red-900"
                    : "text-gray-950"
                }`}
              >
                {errorRows.length}
              </p>
            </div>
          </div>

          <div className="mt-6 max-h-[440px] space-y-3 overflow-y-auto pr-1">
            {finalPreview.map((row) => (
              <div
                key={row.rowNumber}
                className={`rounded-2xl border p-4 ${
                  row.errors.length > 0
                    ? "border-red-200 bg-red-50"
                    : "border-emerald-200 bg-emerald-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {row.errors.length > 0 ? (
                    <AlertCircle
                      className="mt-0.5 shrink-0 text-red-700"
                      size={20}
                    />
                  ) : (
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-emerald-700"
                      size={20}
                    />
                  )}

                  <div className="min-w-0">
                    <p className="font-bold text-gray-950">
                      Row {row.rowNumber}:{" "}
                      {row.name || "Unnamed product"}
                    </p>

                    {row.supplierName && (
                      <p className="mt-1 text-sm text-gray-600">
                        Supplier: {row.supplierName}
                      </p>
                    )}

                    {row.errors.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-red-800">
                        {row.errors.map(
                          (rowError) => (
                            <li key={rowError}>
                              - {rowError}
                            </li>
                          )
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {errorRows.length > 0 && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-bold text-amber-900">
                Fix the spreadsheet before importing
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                Nothing has been imported. Correct the
                rows shown above, save your spreadsheet
                and upload it again.
              </p>
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() =>
                setStage("mapping")
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
              Back to mapping
            </button>

            <button
              type="button"
              onClick={importProducts}
              disabled={
                importing ||
                errorRows.length > 0 ||
                validRows.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Check size={18} />
              )}

              {importing
                ? "Importing..."
                : `Import ${validRows.length} product${
                    validRows.length === 1
                      ? ""
                      : "s"
                  }`}
            </button>
          </div>
        </div>
      )}

      {stage === "complete" && (
        <div className="py-6 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check size={30} />
          </span>

          <h3 className="mt-5 text-2xl font-bold text-gray-950">
            Products added successfully.
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
            {importedCount} product
            {importedCount === 1 ? "" : "s"}{" "}
            {importedCount === 1 ? "has" : "have"} been
            added to your KitchenOps catalogue.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startAgain}
              className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-slate-50"
            >
              Add more products
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900"
              >
                Continue setup
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}