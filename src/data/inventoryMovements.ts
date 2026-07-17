export type InventoryMovementType =
  | "opening"
  | "delivery"
  | "production"
  | "waste"
  | "adjustment";

export type InventoryMovement = {
  id: number;
  productId: number;
  site: string;
  type: InventoryMovementType;
  quantity: number;
  note: string;
  date: string;
};

export const inventoryMovements: InventoryMovement[] = [];

export function getStockForProduct(productId: number, site: string) {
  return inventoryMovements
    .filter((movement) => movement.productId === productId)
    .filter((movement) => movement.site === site)
    .reduce((total, movement) => total + movement.quantity, 0);
}

export function getMovementsForProduct(productId: number, site: string) {
  return inventoryMovements
    .filter((movement) => movement.productId === productId)
    .filter((movement) => movement.site === site);
}