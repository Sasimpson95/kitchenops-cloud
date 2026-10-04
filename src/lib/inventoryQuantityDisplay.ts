import type { Product } from "@/data/products";

const number = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 3,
  }).format(value);

function unitLabel(unit: string, quantity: number): string {
  const singular = unit.trim().toLowerCase();

  if (quantity === 1) return singular;

  const irregular: Record<string, string> = {
    box: "boxes",
    case: "cases",
    tray: "trays",
    loaf: "loaves",
  };

  return irregular[singular] ?? `${singular}s`;
}

function canConvert(product: Product): boolean {
  return (
    Number.isFinite(product.purchaseQuantity) &&
    product.purchaseQuantity > 0 &&
    Boolean(product.orderUnit.trim())
  );
}

export function formatStockQuantity(
  quantity: number,
  product: Product
): string {
  const exact = `${number(quantity)} ${product.inventoryUnit}`;

  if (!canConvert(product) || quantity < 0) return exact;

  const size = product.purchaseQuantity;
  const whole = Math.floor(quantity / size + 1e-9);
  const remainder = Math.max(
    0,
    Number((quantity - whole * size).toFixed(6))
  );

  const packs = `${number(whole)} ${unitLabel(product.orderUnit, whole)}`;

  if (remainder === 0) return packs;
  if (whole === 0) {
    return `${number(remainder)} ${product.inventoryUnit}`;
  }

  return `${packs} + ${number(remainder)} ${product.inventoryUnit}`;
}

export function formatMovementQuantity(
  quantity: number,
  product: Product
): string {
  const sign = quantity > 0 ? "+" : quantity < 0 ? "-" : "";
  const absolute = Math.abs(quantity);
  const exact = `${number(absolute)} ${product.inventoryUnit}`;

  if (!canConvert(product)) return `${sign}${exact}`;

  const packs = Number(
    (absolute / product.purchaseQuantity).toFixed(6)
  );

  return `${sign}${number(packs)} ${unitLabel(product.orderUnit, packs)} (${exact})`;
}