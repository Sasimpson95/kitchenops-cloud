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

export const starterSuppliers: Supplier[] = [];

export const suppliers: Supplier[] = [];
