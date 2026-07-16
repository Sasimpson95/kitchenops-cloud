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

async function readJson<T>(
  response: Response
): Promise<T> {
  const text = await response.text();

  if (!text) {
    throw new Error(
      "KitchenOps received an empty response."
    );
  }

  return JSON.parse(text) as T;
}

export async function loadProductOptions():
  Promise<ProductOptionsResponse> {
  const response = await fetch(
    "/api/cloud/product-options",
    {
      cache: "no-store",
    }
  );

  const data = await readJson<
    ProductOptionsResponse & {
      error?: string;
    }
  >(response);

  if (!response.ok) {
    throw new Error(
      data.error ??
        "Product options could not be loaded."
    );
  }

  return data;
}

export async function createProductCategory(
  name: string
): Promise<ProductCategoryOption> {
  const response = await fetch(
    "/api/cloud/product-options",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        optionType: "category",
        name,
      }),
    }
  );

  const data = await readJson<{
    category?: ProductCategoryOption;
    error?: string;
  }>(response);

  if (!response.ok || !data.category) {
    throw new Error(
      data.error ??
        "The category could not be created."
    );
  }

  return data.category;
}

export async function updateProductCategory(
  input: {
    id: string;
    name?: string;
    active?: boolean;
    sortOrder?: number;
  }
): Promise<void> {
  const response = await fetch(
    "/api/cloud/product-options",
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        optionType: "category",
        ...input,
      }),
    }
  );

  const data = await readJson<{
    error?: string;
  }>(response);

  if (!response.ok) {
    throw new Error(
      data.error ??
        "The category could not be updated."
    );
  }
}
