import type { Product } from "@/data/products";

export type InventoryStatus =
  | "Healthy"
  | "Low Stock"
  | "Reorder"
  | "Out of Stock"
  | "Overstock";

export function getUnitCost(product: Product): number {
  if (!Number.isFinite(product.price) || product.price <= 0) return 0;
  if (!Number.isFinite(product.purchaseQuantity) || product.purchaseQuantity <= 0) return 0;
  return product.price / product.purchaseQuantity;
}

export function getStockValue(product: Product, stock: number): number {
  return Math.max(0, stock) * getUnitCost(product);
}

export function getInventoryStatus(product: Product, stock: number): InventoryStatus {
  if (stock <= 0) return "Out of Stock";
  if (product.maximumStock > 0 && stock > product.maximumStock) return "Overstock";
  if (product.minimumStock > 0 && stock <= product.minimumStock) return "Reorder";
  if (product.reorderPoint > 0 && stock <= product.reorderPoint) return "Low Stock";
  return "Healthy";
}
