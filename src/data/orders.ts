export type OrderStatus =
  | "Draft"
  | "Sent"
  | "Accepted"
  | "Declined"
  | "Completed"
  | "Cancelled";

export type OrderTimelineEventType =
  | "created"
  | "updated"
  | "sent"
  | "accepted"
  | "declined"
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

  /** Snapshot of the linked supplier site at order creation. */
  orderType?: "external" | "internal";
  supplyingSiteId?: string;
  supplyingSiteName?: string;

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

  acceptedAt?: string;
  acceptedBy?: string;
  declinedAt?: string;
  declinedBy?: string;
  declineReason?: string;

  timeline: OrderTimelineEvent[];
};

export const starterOrders: PurchaseOrder[] = [];