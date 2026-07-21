export type SupplierType = "external" | "internal";

export type Supplier = {
  id: number;

  name: string;
  supplierType: SupplierType;
  linkedSiteId: string;
  linkedSiteName: string;
  contactName: string;

  email: string;
  phone: string;

  deliveryDays: string[];
  leadTime: string;

  notes: string;

  active: boolean;

  createdAt: string;
  updatedAt: string;
};

export const starterSuppliers: Supplier[] = [];

/*
 * Compatibility export.
 *
 * Existing pages importing:
 *
 * import { suppliers } from "@/data/suppliers";
 *
 * will continue to compile.
 *
 * Updated pages should use getSuppliers()
 * or getActiveSuppliers() from supplierStore.
 */
export const suppliers =
  starterSuppliers;