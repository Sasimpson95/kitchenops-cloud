export type ProductType =
  | "ingredient"
  | "packaging"
  | "retail"
  | "cleaning"
  | "consumable";

export type UnitKind =
  | "each"
  | "weight"
  | "volume"
  | "packaging"
  | "portion";

export type ProductCategoryOption = {
  id: string;
  name: string;
  product_type: ProductType;
  active: boolean;
  sort_order: number;
};

export type ProductUnitOption = {
  id: string;
  name: string;
  symbol: string;
  unit_kind: UnitKind;
  active: boolean;
  sort_order: number;
};

export type ProductOptionsResponse = {
  categories: ProductCategoryOption[];
  units: ProductUnitOption[];
};

export async function loadProductOptions():
  Promise<ProductOptionsResponse> {
  const response = await fetch(
    "/api/cloud/product-options",
    {
      cache: "no-store",
    }
  );

  const data = await response.json() as
    ProductOptionsResponse & {
      error?: string;
    };

  if (!response.ok) {
    throw new Error(
      data.error ??
        "Product options could not be loaded."
    );
  }

  return data;
}
