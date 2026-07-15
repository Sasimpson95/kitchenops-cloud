export type Supplier = {
  id: number;

  name: string;
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

export const starterSuppliers: Supplier[] = [
  {
    id: 1,

    name: "Brakes",
    contactName: "Customer Services",

    email: "orders@brakes.co.uk",
    phone: "0345 606 9090",

    deliveryDays: [
      "Monday",
      "Wednesday",
      "Friday",
    ],

    leadTime: "Next day",

    notes:
      "Main dry, chilled and frozen supplier.",

    active: true,

    createdAt:
      "2026-07-01T09:00:00.000Z",

    updatedAt:
      "2026-07-01T09:00:00.000Z",
  },

  {
    id: 2,

    name: "Kerry",
    contactName: "Account Manager",

    email:
      "orders@kerryfoods.co.uk",

    phone: "00000 000000",

    deliveryDays: [
      "Tuesday",
      "Thursday",
    ],

    leadTime: "48 hours",

    notes:
      "Secondary food supplier.",

    active: true,

    createdAt:
      "2026-07-01T09:00:00.000Z",

    updatedAt:
      "2026-07-01T09:00:00.000Z",
  },

  {
    id: 3,

    name: "Pudding Pantry Bakery",
    contactName: "Bakery Team",

    email:
      "bakery@puddingpantry.local",

    phone: "Internal",

    deliveryDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ],

    leadTime:
      "Same day / next day",

    notes:
      "Bakery supplier for cakes, cookies, brownies and bread.",

    active: true,

    createdAt:
      "2026-07-01T09:00:00.000Z",

    updatedAt:
      "2026-07-01T09:00:00.000Z",
  },
];

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