import {
  ArrowDown,
  ArrowUp,
  ClipboardCheck,
  PackageCheck,
  Repeat2,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import type {
  InventoryMovement,
} from "@/lib/inventoryStore";

import type {
  PurchaseOrder,
} from "@/data/orders";

type ProductActivityProps = {
  productId: number;
  inventoryUnit: string;
  movements: InventoryMovement[];
  orders: PurchaseOrder[];
};

function formatDateTime(
  value?: string
): string {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function getLastMovement(
  movements: InventoryMovement[],
  types: InventoryMovement["movementType"][]
): InventoryMovement | undefined {
  return movements
    .filter((movement) =>
      types.includes(
        movement.movementType
      )
    )
    .sort(
      (first, second) =>
        new Date(
          second.createdAt
        ).getTime() -
        new Date(
          first.createdAt
        ).getTime()
    )[0];
}

function ActivitySummary({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
        {icon}
        {title}
      </div>

      <p className="mt-3 font-bold text-gray-950">
        {value}
      </p>
    </div>
  );
}

export default function ProductActivity({
  productId,
  inventoryUnit,
  movements,
  orders,
}: ProductActivityProps) {
  const productMovements =
    movements
      .filter(
        (movement) =>
          movement.productId ===
          productId
      )
      .sort(
        (first, second) =>
          new Date(
            second.createdAt
          ).getTime() -
          new Date(
            first.createdAt
          ).getTime()
      );

  const productOrders =
    orders
      .filter((order) =>
        order.items.some(
          (item) =>
            item.productId ===
            productId
        )
      )
      .sort(
        (first, second) =>
          new Date(
            second.createdAt
          ).getTime() -
          new Date(
            first.createdAt
          ).getTime()
      );

  const lastDelivery =
    getLastMovement(
      productMovements,
      ["Delivery"]
    );

  const lastWaste =
    getLastMovement(
      productMovements,
      ["Waste"]
    );

  const lastTransfer =
    getLastMovement(
      productMovements,
      [
        "Transfer In",
        "Transfer Out",
      ]
    );

  const lastStocktake =
    getLastMovement(
      productMovements,
      ["Stocktake"]
    );

  const openOrders =
    productOrders.filter(
      (order) =>
        order.status === "Draft" ||
        order.status === "Sent"
    );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-950">
          Activity Summary
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Latest activity across all sites.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <ActivitySummary
            title="Last Delivery"
            value={formatDateTime(
              lastDelivery?.createdAt
            )}
            icon={
              <PackageCheck
                size={17}
                className="text-violet-700"
              />
            }
          />

          <ActivitySummary
            title="Last Waste"
            value={formatDateTime(
              lastWaste?.createdAt
            )}
            icon={
              <Trash2
                size={17}
                className="text-red-700"
              />
            }
          />

          <ActivitySummary
            title="Last Transfer"
            value={formatDateTime(
              lastTransfer?.createdAt
            )}
            icon={
              <Repeat2
                size={17}
                className="text-blue-700"
              />
            }
          />

          <ActivitySummary
            title="Last Stocktake"
            value={formatDateTime(
              lastStocktake?.createdAt
            )}
            icon={
              <ClipboardCheck
                size={17}
                className="text-orange-700"
              />
            }
          />

          <ActivitySummary
            title="Open Orders"
            value={String(
              openOrders.length
            )}
            icon={
              <ShoppingCart
                size={17}
                className="text-purple-700"
              />
            }
          />
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-950">
              Inventory Movements
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Deliveries, waste, transfers, production, stocktakes and adjustments.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-gray-700">
            {productMovements.length} movements
          </span>
        </div>

        {productMovements.length ===
        0 ? (
          <div className="mt-6 rounded-2xl bg-slate-50 p-10 text-center text-gray-500">
            No inventory movements have been recorded.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {productMovements.map(
              (movement) => (
                <div
                  key={movement.id}
                  className="grid gap-4 rounded-2xl border border-gray-200 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                      movement.quantity >= 0
                        ? "bg-violet-100 text-violet-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {movement.quantity >=
                    0 ? (
                      <ArrowUp
                        size={20}
                      />
                    ) : (
                      <ArrowDown
                        size={20}
                      />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-gray-950">
                        {
                          movement.movementType
                        }
                      </p>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {movement.siteId}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {
                        movement.referenceNumber
                      }
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {formatDateTime(
                        movement.createdAt
                      )}
                    </p>
                  </div>

                  <p
                    className={`text-xl font-bold ${
                      movement.quantity >= 0
                        ? "text-violet-800"
                        : "text-red-700"
                    }`}
                  >
                    {movement.quantity >= 0
                      ? "+"
                      : ""}
                    {movement.quantity}{" "}
                    {inventoryUnit}
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-950">
          Purchase Orders
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Orders containing this product.
        </p>

        {productOrders.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-slate-50 p-10 text-center text-gray-500">
            This product has not appeared on any purchase orders.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {productOrders.map(
              (order) => {
                const item =
                  order.items.find(
                    (orderItem) =>
                      orderItem.productId ===
                      productId
                  );

                return (
                  <div
                    key={order.id}
                    className="grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-[1fr_auto_auto] md:items-center"
                  >
                    <div>
                      <p className="font-bold text-gray-950">
                        {
                          order.orderNumber
                        }
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {order.siteName} •{" "}
                        {order.supplierName}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {formatDateTime(
                          order.createdAt
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Quantity
                      </p>

                      <p className="font-bold text-gray-950">
                        {item?.quantity ?? 0}{" "}
                        {item?.orderUnit}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-center text-sm font-semibold ${
                        order.status ===
                        "Completed"
                          ? "bg-violet-100 text-violet-800"
                          : order.status ===
                            "Cancelled"
                            ? "bg-gray-200 text-gray-700"
                            : order.status ===
                              "Sent"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}
