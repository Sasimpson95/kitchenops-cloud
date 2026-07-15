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

export const inventoryMovements: InventoryMovement[] = [
  {
    id: 1,
    productId: 1,
    site: "Beeston",
    type: "opening",
    quantity: 3960,
    note: "Opening stock",
    date: "2026-07-01",
  },
  {
    id: 2,
    productId: 2,
    site: "Beeston",
    type: "opening",
    quantity: 42,
    note: "Opening stock",
    date: "2026-07-01",
  },
  {
    id: 3,
    productId: 3,
    site: "Beeston",
    type: "opening",
    quantity: 24,
    note: "Opening stock",
    date: "2026-07-01",
  },
  {
    id: 4,
    productId: 1,
    site: "Beeston",
    type: "production",
    quantity: -500,
    note: "Wet Mix x5",
    date: "2026-07-07",
  },
  {
    id: 5,
    productId: 2,
    site: "Beeston",
    type: "production",
    quantity: -75,
    note: "Wet Mix x5",
    date: "2026-07-07",
  },
  {
    id: 6,
    productId: 3,
    site: "Beeston",
    type: "production",
    quantity: -50,
    note: "Wet Mix x5",
    date: "2026-07-07",
  },
];

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