import { getOrders } from "@/lib/orderStore";
import { getProducts } from "@/lib/productStore";
import { getPrepItems } from "@/lib/prepStore";
import { getStocktakes } from "@/lib/stocktakeStore";
import { getWasteRecords } from "@/lib/wasteStore";
import { getInventoryStock, getProductStock } from "@/lib/inventoryStore";
import { getActiveBusinessId } from "@/lib/businessWorkspace";

export type NotificationSeverity = "info" | "warning" | "critical";

export type KitchenNotification = {
  id: string;
  title: string;
  description: string;
  href: string;
  severity: NotificationSeverity;
  siteName?: string;
};

function getSiteId(siteName: string): string {
  return siteName.trim().toLowerCase().replace(/\s+/g, "-");
}

function isToday(value: string): boolean {
  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function getNotifications(
  siteName: string | "All Sites"
): KitchenNotification[] {
  if (typeof window === "undefined") return [];

  const siteId =
    siteName === "All Sites" ? null : getSiteId(siteName);

  const notifications: KitchenNotification[] = [];

  const orders = getOrders().filter(
    (order) => !siteId || order.siteId === siteId
  );

  orders
    .filter((order) => order.status === "Sent")
    .forEach((order) => {
      notifications.push({
        id: `order-${order.id}`,
        title: "Order awaiting receipt",
        description: `${order.orderNumber} from ${order.supplierName}`,
        href: "/purchasing",
        severity: "warning",
        siteName: order.siteName,
      });
    });

  const businessId = getActiveBusinessId();

  const knownSites = new Map<string, string>();
  getOrders().forEach((order) => knownSites.set(order.siteId, order.siteName));
  getWasteRecords().forEach((record) => knownSites.set(record.siteId, record.siteName));
  getStocktakes().forEach((stocktake) => knownSites.set(stocktake.siteId, stocktake.siteName));
  getInventoryStock()
    .filter((record) => !businessId || record.businessId === businessId)
    .forEach((record) => {
      if (!knownSites.has(record.siteId)) knownSites.set(record.siteId, record.siteId);
    });

  const sites = siteId
    ? [{ id: siteId, name: siteName as string }]
    : Array.from(knownSites, ([id, name]) => ({ id, name }));

  sites.forEach((site) => {
    getProducts()
      .filter((product) => product.active)
      .forEach((product) => {
        const stock = getProductStock(
          businessId,
          site.id,
          product.id
        );

        if (stock <= 0) {
          notifications.push({
            id: `out-${site.id}-${product.id}`,
            title: `${product.name} is out of stock`,
            description: `${site.name} has no ${product.inventoryUnit} remaining.`,
            href: "/inventory",
            severity: "critical",
            siteName: site.name,
          });
        } else if (stock <= product.reorderPoint) {
          notifications.push({
            id: `reorder-${site.id}-${product.id}`,
            title: `${product.name} needs reordering`,
            description: `${site.name}: ${stock} ${product.inventoryUnit} remaining.`,
            href: "/inventory",
            severity: "warning",
            siteName: site.name,
          });
        }
      });

    const wasteToday = getWasteRecords().some(
      (record) =>
        record.siteId === site.id && isToday(record.createdAt)
    );

    if (!wasteToday) {
      notifications.push({
        id: `waste-${site.id}`,
        title: "No waste recorded today",
        description: `${site.name} has no waste entry for today.`,
        href: "/waste",
        severity: "info",
        siteName: site.name,
      });
    }

    const openStocktake = getStocktakes().find(
      (stocktake) =>
        stocktake.siteId === site.id &&
        stocktake.status === "In Progress"
    );

    if (openStocktake) {
      notifications.push({
        id: `stocktake-${openStocktake.id}`,
        title: "Stocktake in progress",
        description: `${site.name}: ${openStocktake.stocktakeNumber}`,
        href: "/stocktakes",
        severity: "info",
        siteName: site.name,
      });
    }

    const prepOutstanding = getPrepItems().filter(
      (item) =>
        item.site === site.name &&
        item.day === "today" &&
        item.status !== "approved"
    ).length;

    if (prepOutstanding > 0) {
      notifications.push({
        id: `prep-${site.id}`,
        title: `${prepOutstanding} prep item${
          prepOutstanding === 1 ? "" : "s"
        } outstanding`,
        description: `${site.name} still has prep to complete.`,
        href: "/production",
        severity: "warning",
        siteName: site.name,
      });
    }
  });

  return notifications;
}
