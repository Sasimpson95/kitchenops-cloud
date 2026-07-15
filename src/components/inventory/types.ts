import type { Product } from "@/data/products";
import type {
  InventoryMovement,
} from "@/lib/inventoryStore";
import type {
  InventoryStatus,
} from "@/lib/inventoryValuation";

export type InventoryTrendDirection =
  | "up"
  | "down"
  | "flat";

export type InventoryProductRecord = {
  product: Product;
  stock: number;
  unitCost: number;
  stockValue: number;
  status: InventoryStatus;
  lastMovement?: InventoryMovement;
  movementCount: number;

  trendValues: number[];
  trendDirection: InventoryTrendDirection;
  sevenDayChange: number;
};

export type InventoryAreaSummary = {
  area: string;
  productCount: number;
  inventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
};
