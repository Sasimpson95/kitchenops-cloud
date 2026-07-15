import {
  type OrderStatus,
  type OrderTimelineEvent,
  type OrderTimelineEventType,
  type PurchaseOrder,
  type PurchaseOrderItem,
  starterOrders,
} from "@/data/orders";

import { receiveProductStock } from "@/lib/inventoryStore";

const STORAGE_KEY = "kitchenops-purchase-orders";
const ORDERS_CHANGED_EVENT =
  "kitchenops-orders-changed";

const CURRENT_USER = "Alex";

export type DeliveryReceiptItem = {
  productId: number;
  receivedQuantity: number;
  receivedUnitPrice: number;
};

export type PurchaseOrderFormInput = {
  siteId: string;
  siteName: string;

  supplierId: number;
  supplierName: string;

  items: Omit<
    PurchaseOrderItem,
    "receivedQuantity" | "receivedUnitPrice"
  >[];

  requestedDeliveryDate: string;
  notes: string;
};

export type UpdatePurchaseOrderInput = {
  items: Omit<
    PurchaseOrderItem,
    "receivedQuantity" | "receivedUnitPrice"
  >[];

  requestedDeliveryDate: string;
  notes: string;
};

function now(): string {
  return new Date().toISOString();
}

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function cloneStarterOrders(): PurchaseOrder[] {
  return JSON.parse(
    JSON.stringify(starterOrders)
  ) as PurchaseOrder[];
}

function createTimelineEvent(input: {
  type: OrderTimelineEventType;
  title: string;
  description?: string;
  performedBy?: string;
  createdAt?: string;
}): OrderTimelineEvent {
  return {
    id: createId(),
    type: input.type,
    title: input.title,
    description: input.description,
    performedBy:
      input.performedBy ?? CURRENT_USER,
    createdAt: input.createdAt ?? now(),
  };
}

function normaliseOrder(
  order: PurchaseOrder
): PurchaseOrder {
  const oldStatus = String(order.status);

  const status: OrderStatus =
    oldStatus === "Partially Received"
      ? "Completed"
      : order.status;

  const items = order.items.map((item) => ({
    ...item,
    receivedQuantity:
      item.receivedQuantity ?? 0,
    receivedUnitPrice:
      item.receivedUnitPrice,
  }));

  let timeline = Array.isArray(order.timeline)
    ? order.timeline.map((event) => {
        if (
          String(event.type) ===
          "partially_received"
        ) {
          return {
            ...event,
            type: "completed" as const,
            title: "Delivery received",
          };
        }

        return event;
      })
    : [];

  if (timeline.length === 0) {
    timeline = [
      createTimelineEvent({
        type: "created",
        title:
          status === "Draft"
            ? "Draft order created"
            : "Order created",
        description: `Order created for ${order.supplierName}.`,
        performedBy: order.createdBy,
        createdAt: order.createdAt,
      }),
    ];

    if (status === "Sent") {
      timeline.push(
        createTimelineEvent({
          type: "sent",
          title: "Order sent",
          description: `Order sent to ${order.supplierName}.`,
          performedBy: order.createdBy,
          createdAt: order.updatedAt,
        })
      );
    }

    if (status === "Completed") {
      timeline.push(
        createTimelineEvent({
          type: "completed",
          title: "Delivery received",
          description:
            "Delivery quantities and invoice prices were recorded.",
          performedBy: order.createdBy,
          createdAt:
            order.receivedAt ??
            order.updatedAt,
        })
      );
    }

    if (status === "Cancelled") {
      timeline.push(
        createTimelineEvent({
          type: "cancelled",
          title: "Order cancelled",
          description:
            "The purchase order was cancelled.",
          performedBy: order.createdBy,
          createdAt: order.updatedAt,
        })
      );
    }
  }

  return {
    ...order,
    status,
    items,
    timeline,
  };
}

function emitOrdersChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(ORDERS_CHANGED_EVENT)
  );
}

function initialiseOrders(): PurchaseOrder[] {
  const initialOrders =
    cloneStarterOrders().map(normaliseOrder);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(initialOrders)
    );
  }

  return initialOrders;
}

function calculateOrderSubtotal(
  items: Omit<
    PurchaseOrderItem,
    "receivedQuantity" | "receivedUnitPrice"
  >[]
): number {
  return roundMoney(
    items.reduce(
      (total, item) =>
        total +
        item.quantity * item.unitPrice,
      0
    )
  );
}

function getNextOrderNumber(
  orders: PurchaseOrder[]
): string {
  const highestOrderNumber = orders.reduce(
    (highest, order) => {
      const finalPart =
        order.orderNumber
          .split("-")
          .at(-1) ?? "0";

      const parsedNumber =
        Number(finalPart);

      if (!Number.isFinite(parsedNumber)) {
        return highest;
      }

      return Math.max(
        highest,
        parsedNumber
      );
    },
    0
  );

  return `BEE-${String(
    highestOrderNumber + 1
  ).padStart(6, "0")}`;
}

function validateOrderInput(
  input: PurchaseOrderFormInput
): void {
  if (
    !input.siteId.trim() ||
    input.siteId === "all-sites" ||
    !input.siteName.trim() ||
    input.siteName === "All Sites"
  ) {
    throw new Error(
      "Select a specific site before creating an order."
    );
  }

  if (!input.supplierId) {
    throw new Error("Choose a supplier.");
  }

  if (!input.supplierName.trim()) {
    throw new Error(
      "Supplier name is missing."
    );
  }

  if (input.items.length === 0) {
    throw new Error(
      "Add at least one product to the order."
    );
  }

  const hasInvalidItem =
    input.items.some(
      (item) =>
        !item.productId ||
        item.quantity <= 0 ||
        item.unitPrice < 0
    );

  if (hasInvalidItem) {
    throw new Error(
      "One or more order items are invalid."
    );
  }
}

function buildPurchaseOrder(
  input: PurchaseOrderFormInput,
  status: OrderStatus,
  currentOrders: PurchaseOrder[]
): PurchaseOrder {
  validateOrderInput(input);

  const subtotal =
    calculateOrderSubtotal(input.items);

  const timestamp = now();

  const timeline: OrderTimelineEvent[] = [
    createTimelineEvent({
      type: "created",
      title:
        status === "Draft"
          ? "Draft order created"
          : "Order created",
      description: `Order created for ${input.supplierName}.`,
      createdAt: timestamp,
    }),
  ];

  if (status === "Sent") {
    timeline.push(
      createTimelineEvent({
        type: "sent",
        title: "Order sent",
        description: `Order sent to ${input.supplierName}.`,
        createdAt: timestamp,
      })
    );
  }

  return {
    id: createId(),

    orderNumber:
      getNextOrderNumber(currentOrders),

    businessId: "pudding-pantry",
    siteId: input.siteId,
    siteName: input.siteName,

    supplierId: input.supplierId,
    supplierName:
      input.supplierName,

    status,

    items: input.items.map((item) => ({
      ...item,
      receivedQuantity: 0,
      receivedUnitPrice: undefined,
    })),

    requestedDeliveryDate:
      input.requestedDeliveryDate.trim() ||
      "Not set",

    notes: input.notes.trim(),

    subtotal,
    vat: 0,
    total: subtotal,

    createdBy: CURRENT_USER,
    createdAt: timestamp,
    updatedAt: timestamp,

    timeline,
  };
}

export function getOrders(): PurchaseOrder[] {
  if (typeof window === "undefined") {
    return cloneStarterOrders().map(
      normaliseOrder
    );
  }

  const savedOrders =
    window.localStorage.getItem(
      STORAGE_KEY
    );

  if (!savedOrders) {
    return initialiseOrders();
  }

  try {
    const parsedOrders: unknown =
      JSON.parse(savedOrders);

    if (!Array.isArray(parsedOrders)) {
      return initialiseOrders();
    }

    const normalisedOrders = (
      parsedOrders as PurchaseOrder[]
    ).map(normaliseOrder);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalisedOrders)
    );

    return normalisedOrders;
  } catch {
    return initialiseOrders();
  }
}

export function saveOrders(
  orders: PurchaseOrder[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(orders)
  );

  emitOrdersChanged();
}

export function subscribeToOrderChanges(
  callback: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleLocalOrderChange(): void {
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
    ORDERS_CHANGED_EVENT,
    handleLocalOrderChange
  );

  window.addEventListener(
    "storage",
    handleStorageChange
  );

  return () => {
    window.removeEventListener(
      ORDERS_CHANGED_EVENT,
      handleLocalOrderChange
    );

    window.removeEventListener(
      "storage",
      handleStorageChange
    );
  };
}

export function getOrderById(
  id: string
): PurchaseOrder | undefined {
  return getOrders().find(
    (order) => order.id === id
  );
}

export function createPurchaseOrder(
  input: PurchaseOrderFormInput
): PurchaseOrder {
  const currentOrders = getOrders();

  const newOrder = buildPurchaseOrder(
    input,
    "Sent",
    currentOrders
  );

  saveOrders([
    newOrder,
    ...currentOrders,
  ]);

  return newOrder;
}

export function createDraftPurchaseOrder(
  input: PurchaseOrderFormInput
): PurchaseOrder {
  const currentOrders = getOrders();

  const newOrder = buildPurchaseOrder(
    input,
    "Draft",
    currentOrders
  );

  saveOrders([
    newOrder,
    ...currentOrders,
  ]);

  return newOrder;
}

export function updatePurchaseOrder(
  id: string,
  input: UpdatePurchaseOrderInput
): PurchaseOrder {
  const existingOrder =
    getOrderById(id);

  if (!existingOrder) {
    throw new Error("Order not found.");
  }

  if (existingOrder.status !== "Draft") {
    throw new Error(
      "Only draft orders can be edited."
    );
  }

  if (input.items.length === 0) {
    throw new Error(
      "The order must contain at least one item."
    );
  }

  const subtotal =
    calculateOrderSubtotal(input.items);

  const timestamp = now();

  const updatedOrder: PurchaseOrder = {
    ...existingOrder,

    items: input.items.map((item) => ({
      ...item,
      receivedQuantity: 0,
      receivedUnitPrice: undefined,
    })),

    requestedDeliveryDate:
      input.requestedDeliveryDate.trim() ||
      "Not set",

    notes: input.notes.trim(),

    subtotal,
    vat: 0,
    total: subtotal,

    updatedAt: timestamp,

    timeline: [
      ...existingOrder.timeline,
      createTimelineEvent({
        type: "updated",
        title: "Draft updated",
        description:
          "Order quantities, prices or details were changed.",
        createdAt: timestamp,
      }),
    ],
  };

  const updatedOrders =
    getOrders().map((order) =>
      order.id === id
        ? updatedOrder
        : order
    );

  saveOrders(updatedOrders);

  return updatedOrder;
}

export function sendDraftPurchaseOrder(
  id: string
): PurchaseOrder {
  const existingOrder =
    getOrderById(id);

  if (!existingOrder) {
    throw new Error("Order not found.");
  }

  if (existingOrder.status !== "Draft") {
    throw new Error(
      "Only a draft order can be sent."
    );
  }

  return updateOrderStatus(id, "Sent");
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus
): PurchaseOrder {
  const currentOrders = getOrders();

  const existingOrder =
    currentOrders.find(
      (order) => order.id === id
    );

  if (!existingOrder) {
    throw new Error("Order not found.");
  }

  const timestamp = now();

  let timelineEvent:
    | OrderTimelineEvent
    | undefined;

  if (status === "Sent") {
    timelineEvent =
      createTimelineEvent({
        type: "sent",
        title: "Order sent",
        description: `Order sent to ${existingOrder.supplierName}.`,
        createdAt: timestamp,
      });
  }

  if (status === "Cancelled") {
    timelineEvent =
      createTimelineEvent({
        type: "cancelled",
        title: "Order cancelled",
        description:
          "The purchase order was cancelled.",
        createdAt: timestamp,
      });
  }

  const updatedOrder: PurchaseOrder = {
    ...existingOrder,
    status,
    updatedAt: timestamp,

    timeline: timelineEvent
      ? [
          ...existingOrder.timeline,
          timelineEvent,
        ]
      : existingOrder.timeline,
  };

  const updatedOrders =
    currentOrders.map((order) =>
      order.id === id
        ? updatedOrder
        : order
    );

  saveOrders(updatedOrders);

  return updatedOrder;
}

export function deletePurchaseOrder(
  id: string
): void {
  const currentOrders = getOrders();

  const existingOrder =
    currentOrders.find(
      (order) => order.id === id
    );

  if (!existingOrder) {
    throw new Error("Order not found.");
  }

  if (existingOrder.status !== "Draft") {
    throw new Error(
      "Only draft orders can be deleted."
    );
  }

  saveOrders(
    currentOrders.filter(
      (order) => order.id !== id
    )
  );
}

export function receivePurchaseOrder(
  orderId: string,
  receiptItems: DeliveryReceiptItem[]
): PurchaseOrder {
  const order = getOrderById(orderId);

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.status === "Draft") {
    throw new Error(
      "Send the order before receiving the delivery."
    );
  }

  if (order.status === "Cancelled") {
    throw new Error(
      "A cancelled order cannot be received."
    );
  }

  if (order.status === "Completed") {
    throw new Error(
      "This order has already been received."
    );
  }

  const timestamp = now();

  let totalReceivedQuantity = 0;
  let totalShortQuantity = 0;

  const quantityChanges: string[] = [];
  const priceChanges: string[] = [];

  const updatedItems =
    order.items.map((item) => {
      const receipt =
        receiptItems.find(
          (receiptItem) =>
            receiptItem.productId ===
            item.productId
        );

      const receivedQuantity = Math.max(
        0,
        Math.min(
          Number.isFinite(
            receipt?.receivedQuantity
          )
            ? receipt?.receivedQuantity ?? 0
            : 0,
          item.quantity
        )
      );

      const receivedUnitPrice = Math.max(
        0,
        Number.isFinite(
          receipt?.receivedUnitPrice
        )
          ? receipt?.receivedUnitPrice ??
              item.unitPrice
          : item.unitPrice
      );

      const shortQuantity = Math.max(
        0,
        item.quantity -
          receivedQuantity
      );

      const priceDifference = roundMoney(
        receivedUnitPrice -
          item.unitPrice
      );

      totalReceivedQuantity +=
        receivedQuantity;

      totalShortQuantity +=
        shortQuantity;

      if (shortQuantity > 0) {
        quantityChanges.push(
          `${item.productName}: ordered ${item.quantity}, received ${receivedQuantity}`
        );
      }

      if (priceDifference !== 0) {
        const direction =
          priceDifference > 0 ? "+" : "";

        priceChanges.push(
          `${item.productName}: £${item.unitPrice.toFixed(
            2
          )} → £${receivedUnitPrice.toFixed(
            2
          )} (${direction}£${priceDifference.toFixed(
            2
          )})`
        );
      }

      if (receivedQuantity > 0) {
        receiveProductStock({
          businessId:
            order.businessId,

          siteId: order.siteId,

          productId:
            item.productId,

          productName:
            item.productName,

          quantity:
            receivedQuantity,

          referenceId: order.id,

          referenceNumber:
            order.orderNumber,
        });
      }

      return {
        ...item,
        receivedQuantity,
        receivedUnitPrice:
          roundMoney(receivedUnitPrice),
      };
    });

  const invoiceSubtotal = roundMoney(
    updatedItems.reduce(
      (total, item) =>
        total +
        item.receivedQuantity *
          (item.receivedUnitPrice ??
            item.unitPrice),
      0
    )
  );

  const invoiceVat = 0;
  const invoiceTotal = roundMoney(
    invoiceSubtotal + invoiceVat
  );

  const totalDifference = roundMoney(
    invoiceTotal - order.total
  );

  const summaryParts: string[] = [
    `${totalReceivedQuantity} units received.`,
  ];

  if (totalShortQuantity > 0) {
    summaryParts.push(
      `${totalShortQuantity} units short delivered.`
    );
  } else {
    summaryParts.push(
      "All ordered quantities received."
    );
  }

  if (priceChanges.length > 0) {
    summaryParts.push(
      `Price changes: ${priceChanges.join(
        " | "
      )}.`
    );
  } else {
    summaryParts.push(
      "No price changes recorded."
    );
  }

  if (quantityChanges.length > 0) {
    summaryParts.push(
      `Quantity changes: ${quantityChanges.join(
        " | "
      )}.`
    );
  }

  const differencePrefix =
    totalDifference > 0 ? "+" : "";

  summaryParts.push(
    `Original total £${order.total.toFixed(
      2
    )}. Final invoice total £${invoiceTotal.toFixed(
      2
    )}. Difference ${differencePrefix}£${totalDifference.toFixed(
      2
    )}.`
  );

  const updatedOrder: PurchaseOrder = {
    ...order,

    items: updatedItems,

    status: "Completed",

    invoiceSubtotal,
    invoiceVat,
    invoiceTotal,

    receivedAt: timestamp,
    updatedAt: timestamp,

    timeline: [
      ...order.timeline,
      createTimelineEvent({
        type: "completed",
        title: "Delivery received",
        description:
          summaryParts.join(" "),
        createdAt: timestamp,
      }),
    ],
  };

  const updatedOrders =
    getOrders().map(
      (currentOrder) =>
        currentOrder.id === orderId
          ? updatedOrder
          : currentOrder
    );

  saveOrders(updatedOrders);

  return updatedOrder;
}
