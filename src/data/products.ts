export type CountMethod =
  | "Each"
  | "Weight"
  | "Volume"
  | "Portion";

export type Product = {
  id: number;

  name: string;
  category: string;

  productType?:
    | "ingredient"
    | "packaging"
    | "retail"
    | "cleaning"
    | "consumable";

  internalCode?: string;
  posCode?: string;
  barcode?: string;

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

export const starterProducts: Product[] = [];

export const products: Product[] = [];
