export type OrderStatus =
  | "Draft"
  | "Sent"
  | "Completed"
  | "Cancelled";

export type OrderTimelineEventType =
  | "created"
  | "updated"
  | "sent"
  | "completed"
  | "cancelled";

export type OrderTimelineEvent = {
  id: string;
  type: OrderTimelineEventType;
  title: string;
  description?: string;
  performedBy: string;
  createdAt: string;
};

export type PurchaseOrderItem = {
  productId: number;
  productName: string;
  orderUnit: string;

  /**
   * Quantity originally ordered.
   */
  quantity: number;

  /**
   * Price recorded when the order was sent.
   */
  unitPrice: number;

  /**
   * Quantity physically received.
   */
  receivedQuantity: number;

  /**
   * Actual price shown on the delivery invoice.
   */
  receivedUnitPrice?: number;
};

export type PurchaseOrder = {
  id: string;
  orderNumber: string;

  businessId: string;
  siteId: string;
  siteName: string;

  supplierId: number;
  supplierName: string;

  status: OrderStatus;
  items: PurchaseOrderItem[];

  requestedDeliveryDate: string;
  notes: string;

  /**
   * Original order values.
   */
  subtotal: number;
  vat: number;
  total: number;

  /**
   * Final values entered when receiving.
   */
  invoiceSubtotal?: number;
  invoiceVat?: number;
  invoiceTotal?: number;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
  receivedAt?: string;

  timeline: OrderTimelineEvent[];
};

export const starterOrders: PurchaseOrder[] = [
  {
    id: "starter-order-1",
    orderNumber: "BEE-000001",

    businessId: "pudding-pantry",
    siteId: "beeston",
    siteName: "Beeston",

    supplierId: 1,
    supplierName: "Brakes",

    status: "Draft",

    items: [
      {
        productId: 1,
        productName: "Eggs",
        orderUnit: "Tray",
        quantity: 2,
        unitPrice: 12.5,
        receivedQuantity: 0,
      },
      {
        productId: 2,
        productName: "Milk",
        orderUnit: "Case",
        quantity: 4,
        unitPrice: 7.25,
        receivedQuantity: 0,
      },
    ],

    requestedDeliveryDate: "2026-07-11",
    notes: "Please deliver before 10am.",

    subtotal: 54,
    vat: 0,
    total: 54,

    createdBy: "Alex",
    createdAt: "2026-07-10T09:00:00.000Z",
    updatedAt: "2026-07-10T09:00:00.000Z",

    timeline: [
      {
        id: "starter-event-1",
        type: "created",
        title: "Draft order created",
        description: "Order started for Brakes.",
        performedBy: "Alex",
        createdAt: "2026-07-10T09:00:00.000Z",
      },
    ],
  },
];