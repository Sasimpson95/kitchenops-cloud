import {
  type Supplier,
} from "@/data/suppliers";

const STORAGE_KEY =
  "kitchenops-suppliers";

const SUPPLIERS_CHANGED_EVENT =
  "kitchenops-suppliers-changed";

export type SupplierInput = {
  name: string;
  contactName: string;

  email: string;
  phone: string;

  deliveryDays: string[];
  leadTime: string;

  notes: string;
};

function now(): string {
  return new Date().toISOString();
}

function cloneStarterSuppliers(): Supplier[] {
  return JSON.parse(
    JSON.stringify(starterSuppliers)
  ) as Supplier[];
}

function emitSuppliersChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      SUPPLIERS_CHANGED_EVENT
    )
  );
}

function normaliseSupplier(
  supplier: Partial<Supplier> & {
    id: number;
    name: string;
  }
): Supplier {
  const timestamp = now();

  return {
    id: supplier.id,

    name:
      supplier.name.trim(),

    contactName:
      supplier.contactName?.trim() ||
      "Not set",

    email:
      supplier.email?.trim() || "",

    phone:
      supplier.phone?.trim() || "",

    deliveryDays:
      Array.isArray(
        supplier.deliveryDays
      )
        ? supplier.deliveryDays
        : [],

    leadTime:
      supplier.leadTime?.trim() ||
      "Not set",

    notes:
      supplier.notes?.trim() || "",

    active:
      typeof supplier.active ===
      "boolean"
        ? supplier.active
        : true,

    createdAt:
      supplier.createdAt ||
      timestamp,

    updatedAt:
      supplier.updatedAt ||
      timestamp,
  };
}

function initialiseSuppliers(): Supplier[] {
  const initialSuppliers =
    cloneStarterSuppliers();

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        initialSuppliers
      )
    );
  }

  return initialSuppliers;
}

function getNextSupplierId(
  suppliers: Supplier[]
): number {
  return (
    suppliers.reduce(
      (highestId, supplier) =>
        Math.max(
          highestId,
          supplier.id
        ),
      0
    ) + 1
  );
}

function validateSupplierInput(
  input: SupplierInput
): void {
  if (!input.name.trim()) {
    throw new Error(
      "Enter a supplier name."
    );
  }

  if (!input.contactName.trim()) {
    throw new Error(
      "Enter a contact name."
    );
  }

  if (!input.email.trim()) {
    throw new Error(
      "Enter an email address."
    );
  }

  if (
    !input.email.includes("@")
  ) {
    throw new Error(
      "Enter a valid email address."
    );
  }

  if (!input.phone.trim()) {
    throw new Error(
      "Enter a phone number."
    );
  }

  if (!input.leadTime.trim()) {
    throw new Error(
      "Enter the supplier lead time."
    );
  }
}

export function getSuppliers(): Supplier[] {
  if (typeof window === "undefined") {
    return [];
  }

  const saved =
    window.localStorage.getItem(
      STORAGE_KEY
    );

  if (!saved) {
    return initialiseSuppliers();
  }

  try {
    const parsed: unknown =
      JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return initialiseSuppliers();
    }

    const normalisedSuppliers =
      parsed.map((supplier) =>
        normaliseSupplier(
          supplier as Partial<Supplier> & {
            id: number;
            name: string;
          }
        )
      );

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        normalisedSuppliers
      )
    );

    return normalisedSuppliers;
  } catch {
    return initialiseSuppliers();
  }
}

export function getActiveSuppliers(): Supplier[] {
  return getSuppliers().filter(
    (supplier) => supplier.active
  );
}

export function getArchivedSuppliers(): Supplier[] {
  return getSuppliers().filter(
    (supplier) => !supplier.active
  );
}

export function getSupplierById(
  id: number
): Supplier | undefined {
  return getSuppliers().find(
    (supplier) =>
      supplier.id === id
  );
}

export function saveSuppliers(
  suppliers: Supplier[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(suppliers)
  );

  emitSuppliersChanged();
}

export function createSupplier(
  input: SupplierInput
): Supplier {
  validateSupplierInput(input);

  const currentSuppliers =
    getSuppliers();

  const duplicateName =
    currentSuppliers.some(
      (supplier) =>
        supplier.name
          .trim()
          .toLowerCase() ===
        input.name
          .trim()
          .toLowerCase()
    );

  if (duplicateName) {
    throw new Error(
      "A supplier with this name already exists."
    );
  }

  const timestamp = now();

  const newSupplier: Supplier = {
    id: getNextSupplierId(
      currentSuppliers
    ),

    name: input.name.trim(),

    contactName:
      input.contactName.trim(),

    email: input.email.trim(),

    phone: input.phone.trim(),

    deliveryDays:
      input.deliveryDays,

    leadTime:
      input.leadTime.trim(),

    notes: input.notes.trim(),

    active: true,

    createdAt: timestamp,
    updatedAt: timestamp,
  };

  saveSuppliers([
    ...currentSuppliers,
    newSupplier,
  ]);

  return newSupplier;
}

export function updateSupplier(
  id: number,
  input: SupplierInput
): Supplier {
  validateSupplierInput(input);

  const currentSuppliers =
    getSuppliers();

  const existingSupplier =
    currentSuppliers.find(
      (supplier) =>
        supplier.id === id
    );

  if (!existingSupplier) {
    throw new Error(
      "Supplier not found."
    );
  }

  const duplicateName =
    currentSuppliers.some(
      (supplier) =>
        supplier.id !== id &&
        supplier.name
          .trim()
          .toLowerCase() ===
          input.name
            .trim()
            .toLowerCase()
    );

  if (duplicateName) {
    throw new Error(
      "Another supplier already uses this name."
    );
  }

  const updatedSupplier: Supplier = {
    ...existingSupplier,

    name: input.name.trim(),

    contactName:
      input.contactName.trim(),

    email: input.email.trim(),

    phone: input.phone.trim(),

    deliveryDays:
      input.deliveryDays,

    leadTime:
      input.leadTime.trim(),

    notes: input.notes.trim(),

    updatedAt: now(),
  };

  saveSuppliers(
    currentSuppliers.map(
      (supplier) =>
        supplier.id === id
          ? updatedSupplier
          : supplier
    )
  );

  return updatedSupplier;
}

export function archiveSupplier(
  id: number
): Supplier {
  const currentSuppliers =
    getSuppliers();

  const supplier =
    currentSuppliers.find(
      (item) => item.id === id
    );

  if (!supplier) {
    throw new Error(
      "Supplier not found."
    );
  }

  const archivedSupplier: Supplier = {
    ...supplier,

    active: false,
    updatedAt: now(),
  };

  saveSuppliers(
    currentSuppliers.map(
      (item) =>
        item.id === id
          ? archivedSupplier
          : item
    )
  );

  return archivedSupplier;
}

export function restoreSupplier(
  id: number
): Supplier {
  const currentSuppliers =
    getSuppliers();

  const supplier =
    currentSuppliers.find(
      (item) => item.id === id
    );

  if (!supplier) {
    throw new Error(
      "Supplier not found."
    );
  }

  const restoredSupplier: Supplier = {
    ...supplier,

    active: true,
    updatedAt: now(),
  };

  saveSuppliers(
    currentSuppliers.map(
      (item) =>
        item.id === id
          ? restoredSupplier
          : item
    )
  );

  return restoredSupplier;
}

export function subscribeToSupplierChanges(
  callback: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleLocalChange(): void {
    callback();
  }

  function handleStorageChange(
    event: StorageEvent
  ): void {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  }

  window.addEventListener(
    SUPPLIERS_CHANGED_EVENT,
    handleLocalChange
  );

  window.addEventListener(
    "storage",
    handleStorageChange
  );

  return () => {
    window.removeEventListener(
      SUPPLIERS_CHANGED_EVENT,
      handleLocalChange
    );

    window.removeEventListener(
      "storage",
      handleStorageChange
    );
  };
}