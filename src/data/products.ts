export type CountMethod =
  | "Each"
  | "Weight"
  | "Volume"
  | "Portion";

export type Product = {
  id: number;

  name: string;
  category: string;

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

  /** Kept for compatibility with existing Inventory and Stocktake screens. */
  location: string;

  storageArea: string;
  shelf: string;
  binLocation: string;

  leadTimeDays: number;
  deliveryDays: string[];

  storageNotes: string;
  internalNotes: string;

  active: boolean;

  createdAt: string;
  updatedAt: string;
};

export const starterProducts: Product[] = [
  {
    id: 1,
    name: "Eggs",
    category: "Dairy & Eggs",

    supplierId: 1,
    supplierName: "Brakes",
    supplierCode: "EGG180",
    alternativeSupplierIds: [],

    orderUnit: "Case",
    purchaseQuantity: 180,
    inventoryUnit: "Each",
    countMethod: "Each",

    minimumStock: 1800,
    maximumStock: 7200,
    reorderPoint: 2200,

    price: 29.5,

    location: "Walk-in Fridge",
    storageArea: "Walk-in Fridge",
    shelf: "",
    binLocation: "",

    leadTimeDays: 1,
    deliveryDays: [
      "Monday",
      "Wednesday",
      "Friday",
    ],

    storageNotes:
      "Keep refrigerated and rotate using FIFO.",
    internalNotes: "",

    active: true,

    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
  },
  {
    id: 2,
    name: "Milk",
    category: "Dairy",

    supplierId: 1,
    supplierName: "Brakes",
    supplierCode: "MILK2L",
    alternativeSupplierIds: [],

    orderUnit: "Bottle",
    purchaseQuantity: 2,
    inventoryUnit: "Litre",
    countMethod: "Volume",

    minimumStock: 15,
    maximumStock: 60,
    reorderPoint: 20,

    price: 1.42,

    location: "Walk-in Fridge",
    storageArea: "Walk-in Fridge",
    shelf: "",
    binLocation: "",

    leadTimeDays: 1,
    deliveryDays: [
      "Monday",
      "Wednesday",
      "Friday",
    ],

    storageNotes: "Keep refrigerated.",
    internalNotes: "",

    active: true,

    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
  },
  {
    id: 3,
    name: "Plain Flour",
    category: "Dry Goods",

    supplierId: 1,
    supplierName: "Brakes",
    supplierCode: "FLOUR16KG",
    alternativeSupplierIds: [],

    orderUnit: "Bag",
    purchaseQuantity: 16,
    inventoryUnit: "Kg",
    countMethod: "Weight",

    minimumStock: 10,
    maximumStock: 50,
    reorderPoint: 15,

    price: 13.2,

    location: "Dry Store",
    storageArea: "Dry Store",
    shelf: "",
    binLocation: "",

    leadTimeDays: 1,
    deliveryDays: [
      "Monday",
      "Wednesday",
      "Friday",
    ],

    storageNotes:
      "Keep dry, sealed and off the floor.",
    internalNotes: "",

    active: true,

    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
  },
];

export const products = starterProducts;
