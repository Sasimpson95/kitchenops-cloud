"use client";

import {
  AlertTriangle,
  Ban,
  Boxes,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  PackageCheck,
  PackageOpen,
  Repeat2,
  ShoppingCart,
  Trash2,
  TrendingDown,
  ChefHat,
  UtensilsCrossed,
  Percent,
} from "lucide-react";

import type { PurchaseOrder } from "@/data/orders";
import type { Product } from "@/data/products";
import type { InventoryMovement, InventoryStock } from "@/lib/inventoryStore";
import type { StockTransfer } from "@/lib/transferStore";
import type { WasteRecord } from "@/lib/wasteStore";
import type { Stocktake } from "@/lib/stocktakeStore";
import type { Recipe } from "@/data/recipes";
import type { ProductionItem } from "@/data/production";
import { calculateRecipeCosting, getRecipeCostingSetting } from "@/lib/recipeCostingStore";
import type { ReportFiltersState, ReportTab, CsvRow } from "@/components/reports/types";

import ReportActions from "@/components/reports/ReportActions";
import ReportKpiCard from "@/components/reports/ReportKpiCard";
import ReportSection from "@/components/reports/ReportSection";
import ReportTable from "@/components/reports/ReportTable";

import {
  downloadCsv,
  formatDate,
  formatDateTime,
  isWithinDateRange,
  money,
  number,
  printReport,
  REPORT_SITES,
  siteName,
} from "@/lib/reportUtils";

const BUSINESS_ID = "pudding-pantry";

type ReportsContentProps = {
  tab: ReportTab;
  filters: ReportFiltersState;
  products: Product[];
  stock: InventoryStock[];
  movements: InventoryMovement[];
  orders: PurchaseOrder[];
  waste: WasteRecord[];
  transfers: StockTransfer[];
  stocktakes: Stocktake[];
  recipes: Recipe[];
  prepItems: ProductionItem[];
};

function productUnitCost(product: Product): number {
  return product.purchaseQuantity > 0 ? product.price / product.purchaseQuantity : 0;
}

function matchesText(search: string, values: Array<string | number | undefined>): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return values.join(" ").toLowerCase().includes(query);
}

function matchesSite(filterSite: string, recordSite: string): boolean {
  return filterSite === "All Sites" || filterSite === recordSite;
}

function statusBadge(status: string): React.ReactNode {
  const style =
    status === "Completed" || status === "Healthy"
      ? "bg-violet-100 text-violet-800"
      : status === "Sent" || status === "In Progress"
        ? "bg-blue-100 text-blue-800"
        : status === "Draft" || status === "Low Stock"
          ? "bg-orange-100 text-orange-800"
          : status === "Cancelled" || status === "Out of Stock"
            ? "bg-gray-200 text-gray-700"
            : "bg-red-100 text-red-800";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}>{status}</span>;
}

export default function ReportsContent({
  tab,
  filters,
  products,
  stock,
  movements,
  orders,
  waste,
  transfers,
  stocktakes,
  recipes,
  prepItems,
}: ReportsContentProps) {
  const productMap = new Map(products.map((product) => [product.id, product]));

  const visibleStock = stock.filter((record) =>
    record.businessId === BUSINESS_ID && matchesSite(filters.site, siteName(record.siteId))
  );

  const inventoryRows = products
    .filter((product) => product.active)
    .flatMap((product) => {
      const sites = filters.site === "All Sites"
        ? REPORT_SITES.map((site) => site.id)
        : [REPORT_SITES.find((site) => site.name === filters.site)?.id ?? filters.site.toLowerCase()];
      return sites.map((siteId) => {
        const quantity = visibleStock.find((item) => item.siteId === siteId && item.productId === product.id)?.quantity ?? 0;
        const unitCost = productUnitCost(product);
        const value = quantity * unitCost;
        const status = quantity <= 0
          ? "Out of Stock"
          : quantity > product.maximumStock && product.maximumStock > 0
            ? "Overstock"
            : quantity <= product.minimumStock
              ? "Reorder"
              : quantity <= product.reorderPoint
                ? "Low Stock"
                : "Healthy";
        return { product, siteId, site: siteName(siteId), quantity, unitCost, value, status };
      });
    })
    .filter((row) => filters.category === "All Categories" || row.product.category === filters.category)
    .filter((row) => filters.supplier === "All Suppliers" || row.product.supplierName === filters.supplier)
    .filter((row) => matchesText(filters.search, [row.product.name, row.product.category, row.product.supplierName, row.site, row.status]));

  const filteredMovements = movements
    .filter((movement) => movement.businessId === BUSINESS_ID)
    .filter((movement) => matchesSite(filters.site, siteName(movement.siteId)))
    .filter((movement) => isWithinDateRange(movement.createdAt, filters.startDate, filters.endDate))
    .filter((movement) => {
      const product = productMap.get(movement.productId);
      return (filters.category === "All Categories" || product?.category === filters.category) &&
        (filters.supplier === "All Suppliers" || product?.supplierName === filters.supplier) &&
        matchesText(filters.search, [movement.productName, movement.movementType, movement.referenceNumber, siteName(movement.siteId)]);
    });

  const filteredOrders = orders
    .filter((order) => matchesSite(filters.site, order.siteName))
    .filter((order) => filters.supplier === "All Suppliers" || order.supplierName === filters.supplier)
    .filter((order) => isWithinDateRange(order.createdAt, filters.startDate, filters.endDate))
    .filter((order) => matchesText(filters.search, [order.orderNumber, order.supplierName, order.siteName, order.status, order.createdBy]));

  const filteredWaste = waste
    .filter((record) => matchesSite(filters.site, record.siteName))
    .filter((record) => isWithinDateRange(record.createdAt, filters.startDate, filters.endDate))
    .filter((record) => {
      const product = productMap.get(record.productId);
      return (filters.category === "All Categories" || product?.category === filters.category) &&
        (filters.supplier === "All Suppliers" || product?.supplierName === filters.supplier) &&
        matchesText(filters.search, [record.productName, record.reason, record.siteName, record.recordedBy, record.notes]);
    });

  const filteredTransfers = transfers
    .filter((transfer) => filters.site === "All Sites" || transfer.fromSiteName === filters.site || transfer.toSiteName === filters.site)
    .filter((transfer) => isWithinDateRange(transfer.createdAt, filters.startDate, filters.endDate))
    .filter((transfer) => {
      const product = productMap.get(transfer.productId);
      return (filters.category === "All Categories" || product?.category === filters.category) &&
        (filters.supplier === "All Suppliers" || product?.supplierName === filters.supplier) &&
        matchesText(filters.search, [transfer.transferNumber, transfer.productName, transfer.fromSiteName, transfer.toSiteName, transfer.transferredBy, transfer.reason]);
    });

  const filteredStocktakes = stocktakes
    .filter((stocktake) => matchesSite(filters.site, stocktake.siteName))
    .filter((stocktake) => isWithinDateRange(stocktake.startedAt, filters.startDate, filters.endDate))
    .filter((stocktake) => matchesText(filters.search, [stocktake.stocktakeNumber, stocktake.siteName, stocktake.status, stocktake.startedBy, stocktake.completedBy, stocktake.periodLabel]));

  const productRows = products
    .filter((product) => filters.category === "All Categories" || product.category === filters.category)
    .filter((product) => filters.supplier === "All Suppliers" || product.supplierName === filters.supplier)
    .filter((product) => matchesText(filters.search, [product.name, product.category, product.supplierName, product.supplierCode, product.storageArea]))
    .map((product) => {
      const records = inventoryRows.filter((row) => row.product.id === product.id);
      const currentStock = records.reduce((total, row) => total + row.quantity, 0);
      const currentValue = records.reduce((total, row) => total + row.value, 0);
      const productMovements = filteredMovements.filter((movement) => movement.productId === product.id);
      const last = [...movements]
        .filter((movement) => movement.productId === product.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      return { product, currentStock, currentValue, movementCount: productMovements.length, lastMovement: last };
    });

  const actions = (filename: string, rows: CsvRow[]) => (
    <ReportActions onCsv={() => downloadCsv(filename, rows)} onPrint={printReport} />
  );


  if (tab === "recipes") {
    const recipeRows = recipes
      .map((recipe) => {
        const settings = getRecipeCostingSetting(recipe.name);
        const costing = calculateRecipeCosting(recipe, products, settings);
        return { recipe, settings, costing };
      })
      .filter((row) => matchesText(filters.search, [row.recipe.name, row.costing.allergens.join(" ")]))
      .filter((row) => row.settings.active || filters.search.trim().length > 0);

    const activeRows = recipeRows.filter((row) => row.settings.active);
    const averageGpRows = activeRows.filter((row) => row.costing.sellingPrice > 0);
    const averageGp = averageGpRows.length
      ? averageGpRows.reduce((total, row) => total + row.costing.grossProfitPercentage, 0) / averageGpRows.length
      : 0;
    const belowTarget = activeRows.filter((row) => row.costing.sellingPrice > 0 && row.costing.grossProfitPercentage < row.settings.targetGrossProfitPercentage).length;
    const incomplete = activeRows.filter((row) => row.costing.warnings.length > 0).length;
    const csv: CsvRow[] = recipeRows.map((row) => ({
      Recipe: row.recipe.name,
      Active: row.settings.active,
      Portions: row.settings.portions,
      "Portion Size": row.settings.portionSize,
      "Recipe Cost": row.costing.totalRecipeCost,
      "Cost Per Portion": row.costing.costPerPortion,
      "Selling Price": row.costing.sellingPrice,
      "Food Cost %": row.costing.foodCostPercentage,
      "GP %": row.costing.grossProfitPercentage,
      "Target GP %": row.settings.targetGrossProfitPercentage,
      "Target Selling Price": row.costing.targetSellingPrice,
      Allergens: row.costing.allergens.join(", "),
      Warnings: row.costing.warnings.join(" | "),
    }));

    return <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard title="Active Recipes" value={activeRows.length} icon={ChefHat} tone="green" />
        <ReportKpiCard title="Average GP" value={`${averageGp.toFixed(1)}%`} icon={Percent} tone="blue" />
        <ReportKpiCard title="Below Target" value={belowTarget} icon={AlertTriangle} tone="orange" />
        <ReportKpiCard title="Needs Costing Attention" value={incomplete} icon={Ban} tone="red" />
      </div>
      <ReportSection title="Recipe Costing Report" description="Live recipe costs, selling prices, food cost and gross profit." actions={actions("recipe-costing-report.csv", csv)}>
        <ReportTable rows={recipeRows} rowKey={(row) => row.recipe.name} columns={[
          { key: "recipe", label: "Recipe", render: (row) => <><p className="font-bold text-gray-950">{row.recipe.name}</p><p className="text-xs text-gray-500">{row.settings.portions} portions • {row.settings.portionSize}</p></> },
          { key: "cost", label: "Recipe Cost", align: "right", render: (row) => money(row.costing.totalRecipeCost) },
          { key: "portion", label: "Cost / Portion", align: "right", render: (row) => <strong>{money(row.costing.costPerPortion)}</strong> },
          { key: "sell", label: "Selling Price", align: "right", render: (row) => money(row.costing.sellingPrice) },
          { key: "food", label: "Food Cost", align: "right", render: (row) => row.costing.sellingPrice > 0 ? `${row.costing.foodCostPercentage.toFixed(1)}%` : "Not set" },
          { key: "gp", label: "GP", align: "right", render: (row) => row.costing.sellingPrice > 0 ? `${row.costing.grossProfitPercentage.toFixed(1)}%` : "Not set" },
          { key: "target", label: "Target Price", align: "right", render: (row) => money(row.costing.targetSellingPrice) },
          { key: "status", label: "Status", render: (row) => statusBadge(row.costing.warnings.length ? "Reorder" : "Healthy") },
        ]} />
      </ReportSection>
    </>;
  }

  if (tab === "production") {
    const rows = prepItems
      .filter((item) => matchesSite(filters.site, item.site))
      .filter((item) => isWithinDateRange(item.updatedAt, filters.startDate, filters.endDate))
      .filter((item) => matchesText(filters.search, [item.name, item.site, item.status, item.chef]));
    const planned = rows.reduce((total, item) => total + item.planned, 0);
    const produced = rows.reduce((total, item) => total + item.produced, 0);
    const awaiting = rows.filter((item) => item.status === "awaitingApproval").length;
    const completion = planned > 0 ? (produced / planned) * 100 : 0;
    const csv: CsvRow[] = rows.map((item) => ({
      Site: item.site, Recipe: item.name, Day: item.day, Planned: item.planned,
      Produced: item.produced, Status: item.status, Chef: item.chef ?? "", "Ready Time": item.readyTime ?? "", Updated: item.updatedAt,
    }));
    return <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard title="Planned Batches" value={number(planned)} icon={UtensilsCrossed} tone="slate" />
        <ReportKpiCard title="Produced Batches" value={number(produced)} icon={PackageCheck} tone="green" />
        <ReportKpiCard title="Completion" value={`${completion.toFixed(1)}%`} icon={Percent} tone="blue" />
        <ReportKpiCard title="Awaiting Approval" value={awaiting} icon={Clock3} tone="orange" />
      </div>
      <ReportSection title="Prep & Production Report" description="Planned, produced and approved prep by site and date." actions={actions("prep-production-report.csv", csv)}>
        <ReportTable rows={rows} rowKey={(row) => String(row.id)} columns={[
          { key: "site", label: "Site", render: (row) => row.site },
          { key: "recipe", label: "Prep Item", render: (row) => <strong>{row.name}</strong> },
          { key: "day", label: "Plan", render: (row) => row.day === "today" ? "Today" : "Tomorrow" },
          { key: "planned", label: "Planned", align: "right", render: (row) => number(row.planned) },
          { key: "produced", label: "Produced", align: "right", render: (row) => number(row.produced) },
          { key: "person", label: "Completed By", render: (row) => row.chef || "—" },
          { key: "status", label: "Status", render: (row) => statusBadge(row.status === "approved" ? "Completed" : row.status === "awaitingApproval" ? "In Progress" : "Draft") },
          { key: "updated", label: "Updated", render: (row) => formatDateTime(row.updatedAt) },
        ]} />
      </ReportSection>
    </>;
  }

  if (tab === "inventory") {
    const totalValue = inventoryRows.reduce((total, row) => total + row.value, 0);
    const low = inventoryRows.filter((row) => row.status === "Low Stock" || row.status === "Reorder").length;
    const out = inventoryRows.filter((row) => row.status === "Out of Stock").length;
    const over = inventoryRows.filter((row) => row.status === "Overstock").length;
    const csv: CsvRow[] = inventoryRows.map((row) => ({ Site: row.site, Product: row.product.name, Category: row.product.category, Supplier: row.product.supplierName, Stock: row.quantity, Unit: row.product.inventoryUnit, "Unit Cost": row.unitCost, "Stock Value": row.value, Status: row.status }));
    return <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard title="Inventory Value" value={money(totalValue)} icon={CircleDollarSign} tone="green" />
        <ReportKpiCard title="Low / Reorder" value={low} icon={AlertTriangle} tone="orange" />
        <ReportKpiCard title="Out of Stock" value={out} icon={Ban} tone="red" />
        <ReportKpiCard title="Overstock" value={over} icon={PackageOpen} tone="blue" />
      </div>
      <ReportSection title="Current Inventory" description="Current stock and value by product and site." actions={actions("inventory-report.csv", csv)}>
        <ReportTable rows={inventoryRows} rowKey={(row) => `${row.siteId}-${row.product.id}`} columns={[
          { key: "site", label: "Site", render: (row) => row.site },
          { key: "product", label: "Product", render: (row) => <><p className="font-bold text-gray-950">{row.product.name}</p><p className="text-xs text-gray-500">{row.product.category}</p></> },
          { key: "supplier", label: "Supplier", render: (row) => row.product.supplierName },
          { key: "stock", label: "Current Stock", align: "right", render: (row) => `${number(row.quantity)} ${row.product.inventoryUnit}` },
          { key: "cost", label: "Unit Cost", align: "right", render: (row) => money(row.unitCost, 4) },
          { key: "value", label: "Value", align: "right", render: (row) => <strong>{money(row.value)}</strong> },
          { key: "status", label: "Status", align: "center", render: (row) => statusBadge(row.status) },
        ]} />
      </ReportSection>
      <ReportSection title="Inventory Movement Report" description="Movement activity within the selected date range." actions={actions("inventory-movements.csv", filteredMovements.map((movement) => ({ Date: formatDateTime(movement.createdAt), Site: siteName(movement.siteId), Product: movement.productName, Type: movement.movementType, Quantity: movement.quantity, Reference: movement.referenceNumber })))}>
        <ReportTable rows={filteredMovements} rowKey={(row) => row.id} columns={[
          { key: "date", label: "Date", render: (row) => formatDateTime(row.createdAt) },
          { key: "site", label: "Site", render: (row) => siteName(row.siteId) },
          { key: "product", label: "Product", render: (row) => <strong>{row.productName}</strong> },
          { key: "type", label: "Movement", render: (row) => row.movementType },
          { key: "quantity", label: "Quantity", align: "right", render: (row) => <span className={row.quantity >= 0 ? "font-bold text-violet-800" : "font-bold text-red-700"}>{row.quantity >= 0 ? "+" : ""}{number(row.quantity)}</span> },
          { key: "reference", label: "Reference", render: (row) => row.referenceNumber },
        ]} />
      </ReportSection>
    </>;
  }

  if (tab === "purchasing") {
    const spend = filteredOrders.filter((order) => order.status !== "Cancelled").reduce((total, order) => total + (order.invoiceTotal ?? order.total), 0);
    const outstanding = filteredOrders.filter((order) => order.status === "Sent").length;
    const completed = filteredOrders.filter((order) => order.status === "Completed").length;
    const suppliers = new Set(filteredOrders.map((order) => order.supplierId)).size;
    const csv = filteredOrders.map((order) => ({ Date: formatDate(order.createdAt), Order: order.orderNumber, Site: order.siteName, Supplier: order.supplierName, Status: order.status, Items: order.items.length, Total: order.invoiceTotal ?? order.total, "Created By": order.createdBy, "Delivery Date": order.requestedDeliveryDate }));
    return <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard title="Order Spend" value={money(spend)} icon={CircleDollarSign} tone="green" />
        <ReportKpiCard title="Orders" value={filteredOrders.length} icon={ShoppingCart} tone="slate" />
        <ReportKpiCard title="Outstanding" value={outstanding} icon={Clock3} tone="orange" />
        <ReportKpiCard title="Completed" value={completed} subtitle={`${suppliers} suppliers`} icon={PackageCheck} tone="blue" />
      </div>
      <ReportSection title="Purchasing Report" description="Orders created within the selected date range." actions={actions("purchasing-report.csv", csv)}>
        <ReportTable rows={filteredOrders} rowKey={(row) => row.id} columns={[
          { key: "date", label: "Created", render: (row) => formatDate(row.createdAt) },
          { key: "order", label: "Order", render: (row) => <strong>{row.orderNumber}</strong> },
          { key: "site", label: "Site", render: (row) => row.siteName },
          { key: "supplier", label: "Supplier", render: (row) => row.supplierName },
          { key: "items", label: "Items", align: "center", render: (row) => row.items.length },
          { key: "delivery", label: "Requested Delivery", render: (row) => formatDate(row.requestedDeliveryDate) },
          { key: "total", label: "Total", align: "right", render: (row) => <strong>{money(row.invoiceTotal ?? row.total)}</strong> },
          { key: "status", label: "Status", align: "center", render: (row) => statusBadge(row.status) },
        ]} />
      </ReportSection>
    </>;
  }

  if (tab === "waste") {
    const rows = filteredWaste.map((record) => {
      const product = productMap.get(record.productId);
      const unitCost = product ? productUnitCost(product) : 0;
      return { ...record, estimatedValue: record.quantity * unitCost };
    });
    const totalValue = rows.reduce((total, row) => total + row.estimatedValue, 0);
    const totalQty = rows.reduce((total, row) => total + row.quantity, 0);
    const productsCount = new Set(rows.map((row) => row.productId)).size;
    const reasonsCount = new Set(rows.map((row) => row.reason)).size;
    const csv = rows.map((row) => ({ Date: formatDateTime(row.createdAt), Site: row.siteName, Product: row.productName, Quantity: row.quantity, Unit: row.inventoryUnit, Reason: row.reason, "Estimated Value": row.estimatedValue, "Recorded By": row.recordedBy, Notes: row.notes }));
    return <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard title="Estimated Waste Value" value={money(totalValue)} icon={CircleDollarSign} tone="red" />
        <ReportKpiCard title="Waste Records" value={rows.length} icon={Trash2} tone="orange" />
        <ReportKpiCard title="Total Quantity" value={number(totalQty)} icon={TrendingDown} tone="slate" />
        <ReportKpiCard title="Products / Reasons" value={`${productsCount} / ${reasonsCount}`} icon={Boxes} tone="blue" />
      </div>
      <ReportSection title="Waste Report" description="Waste records with estimated value using current product unit costs." actions={actions("waste-report.csv", csv)}>
        <ReportTable rows={rows} rowKey={(row) => row.id} columns={[
          { key: "date", label: "Date", render: (row) => formatDateTime(row.createdAt) },
          { key: "site", label: "Site", render: (row) => row.siteName },
          { key: "product", label: "Product", render: (row) => <strong>{row.productName}</strong> },
          { key: "quantity", label: "Quantity", align: "right", render: (row) => `${number(row.quantity)} ${row.inventoryUnit}` },
          { key: "reason", label: "Reason", render: (row) => row.reason },
          { key: "value", label: "Est. Value", align: "right", render: (row) => <strong className="text-red-700">{money(row.estimatedValue)}</strong> },
          { key: "by", label: "Recorded By", render: (row) => row.recordedBy },
        ]} />
      </ReportSection>
    </>;
  }

  if (tab === "transfers") {
    const quantity = filteredTransfers.reduce((total, transfer) => total + transfer.quantity, 0);
    const sourceSites = new Set(filteredTransfers.map((transfer) => transfer.fromSiteId)).size;
    const destinationSites = new Set(filteredTransfers.map((transfer) => transfer.toSiteId)).size;
    const productsCount = new Set(filteredTransfers.map((transfer) => transfer.productId)).size;
    const csv = filteredTransfers.map((transfer) => ({ Date: formatDateTime(transfer.createdAt), Transfer: transfer.transferNumber, From: transfer.fromSiteName, To: transfer.toSiteName, Product: transfer.productName, Quantity: transfer.quantity, Unit: transfer.inventoryUnit, Reason: transfer.reason ?? "", "Transferred By": transfer.transferredBy, Status: transfer.status }));
    return <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard title="Transfers" value={filteredTransfers.length} icon={Repeat2} tone="blue" />
        <ReportKpiCard title="Quantity Moved" value={number(quantity)} icon={Boxes} tone="slate" />
        <ReportKpiCard title="Products Moved" value={productsCount} icon={PackageOpen} tone="green" />
        <ReportKpiCard title="Source / Destination Sites" value={`${sourceSites} / ${destinationSites}`} icon={Building2} tone="purple" />
      </div>
      <ReportSection title="Transfer Report" description="Completed stock movements between sites." actions={actions("transfer-report.csv", csv)}>
        <ReportTable rows={filteredTransfers} rowKey={(row) => row.id} columns={[
          { key: "date", label: "Date", render: (row) => formatDateTime(row.createdAt) },
          { key: "number", label: "Transfer", render: (row) => <strong>{row.transferNumber}</strong> },
          { key: "route", label: "Route", render: (row) => `${row.fromSiteName} → ${row.toSiteName}` },
          { key: "product", label: "Product", render: (row) => row.productName },
          { key: "quantity", label: "Quantity", align: "right", render: (row) => `${number(row.quantity)} ${row.inventoryUnit}` },
          { key: "reason", label: "Reason", render: (row) => row.reason || "—" },
          { key: "by", label: "Transferred By", render: (row) => row.transferredBy },
        ]} />
      </ReportSection>
    </>;
  }

  if (tab === "stocktakes") {
    const completed = filteredStocktakes.filter((item) => item.status === "Completed");
    const open = filteredStocktakes.filter((item) => item.status === "In Progress");
    const totalVariances = filteredStocktakes.reduce((total, item) => total + item.items.filter((row) => row.countedQuantity !== null && row.countedQuantity !== row.expectedQuantity).length, 0);
    const productsCounted = completed.reduce((total, item) => total + item.items.length, 0);
    const rows = filteredStocktakes.map((stocktake) => {
      const variances = stocktake.items.filter((item) => item.countedQuantity !== null && item.countedQuantity !== item.expectedQuantity).length;
      const durationMinutes = stocktake.completedAt
        ? Math.max(0, Math.round((new Date(stocktake.completedAt).getTime() - new Date(stocktake.startedAt).getTime()) / 60000))
        : null;
      return { ...stocktake, variances, durationMinutes };
    });
    const csv = rows.map((row) => ({ Stocktake: row.stocktakeNumber, Site: row.siteName, Period: row.periodLabel, Status: row.status, Products: row.items.length, Variances: row.variances, "Started By": row.startedBy, "Completed By": row.completedBy ?? "", Started: formatDateTime(row.startedAt), Completed: formatDateTime(row.completedAt), "Duration Minutes": row.durationMinutes ?? "" }));
    return <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard title="Completed" value={completed.length} icon={CheckCircle2} tone="green" />
        <ReportKpiCard title="In Progress" value={open.length} icon={Clock3} tone="blue" />
        <ReportKpiCard title="Products Counted" value={productsCounted} icon={Boxes} tone="slate" />
        <ReportKpiCard title="Variances" value={totalVariances} icon={AlertTriangle} tone="orange" />
      </div>
      <ReportSection title="Stocktake Report" description="Scheduled and manual stocktake activity." actions={actions("stocktake-report.csv", csv)}>
        <ReportTable rows={rows} rowKey={(row) => row.id} columns={[
          { key: "number", label: "Stocktake", render: (row) => <strong>{row.stocktakeNumber}</strong> },
          { key: "site", label: "Site", render: (row) => row.siteName },
          { key: "period", label: "Period", render: (row) => row.periodLabel },
          { key: "products", label: "Products", align: "center", render: (row) => row.items.length },
          { key: "variance", label: "Variances", align: "center", render: (row) => row.variances },
          { key: "duration", label: "Duration", align: "right", render: (row) => row.durationMinutes === null ? "—" : `${row.durationMinutes} min` },
          { key: "by", label: "Completed By", render: (row) => row.completedBy || row.startedBy },
          { key: "status", label: "Status", align: "center", render: (row) => statusBadge(row.status) },
        ]} />
      </ReportSection>
    </>;
  }

  if (tab === "products") {
    const totalValue = productRows.reduce((total, row) => total + row.currentValue, 0);
    const active = productRows.filter((row) => row.product.active).length;
    const categories = new Set(productRows.map((row) => row.product.category)).size;
    const suppliers = new Set(productRows.map((row) => row.product.supplierName)).size;
    const csv = productRows.map((row) => ({ Product: row.product.name, Category: row.product.category, Supplier: row.product.supplierName, "Supplier Code": row.product.supplierCode, "Storage Area": row.product.storageArea, Stock: row.currentStock, Unit: row.product.inventoryUnit, Value: row.currentValue, "Movement Count": row.movementCount, "Last Movement": row.lastMovement?.movementType ?? "", "Last Movement Date": formatDateTime(row.lastMovement?.createdAt), Active: row.product.active }));
    return <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard title="Products" value={productRows.length} icon={Boxes} tone="slate" />
        <ReportKpiCard title="Active Products" value={active} icon={CheckCircle2} tone="green" />
        <ReportKpiCard title="Current Value" value={money(totalValue)} icon={CircleDollarSign} tone="blue" />
        <ReportKpiCard title="Categories / Suppliers" value={`${categories} / ${suppliers}`} icon={PackageOpen} tone="purple" />
      </div>
      <ReportSection title="Product Report" description="Product master data and current stock activity." actions={actions("product-report.csv", csv)}>
        <ReportTable rows={productRows} rowKey={(row) => String(row.product.id)} columns={[
          { key: "product", label: "Product", render: (row) => <><p className="font-bold text-gray-950">{row.product.name}</p><p className="text-xs text-gray-500">{row.product.category}</p></> },
          { key: "supplier", label: "Supplier", render: (row) => <>{row.product.supplierName}<p className="text-xs text-gray-500">{row.product.supplierCode || "No code"}</p></> },
          { key: "area", label: "Storage Area", render: (row) => row.product.storageArea },
          { key: "stock", label: "Current Stock", align: "right", render: (row) => `${number(row.currentStock)} ${row.product.inventoryUnit}` },
          { key: "value", label: "Current Value", align: "right", render: (row) => <strong>{money(row.currentValue)}</strong> },
          { key: "movements", label: "Movements", align: "center", render: (row) => row.movementCount },
          { key: "last", label: "Last Activity", render: (row) => row.lastMovement ? `${row.lastMovement.movementType} • ${formatDate(row.lastMovement.createdAt)}` : "Never" },
          { key: "status", label: "Status", render: (row) => statusBadge(row.product.active ? "Completed" : "Cancelled") },
        ]} />
      </ReportSection>
    </>;
  }

  const siteRows = REPORT_SITES
    .filter((site) => filters.site === "All Sites" || site.name === filters.site)
    .map((site) => {
      const siteInventory = inventoryRows.filter((row) => row.siteId === site.id);
      const siteOrders = filteredOrders.filter((order) => order.siteId === site.id);
      const siteWaste = filteredWaste.filter((record) => record.siteId === site.id);
      const siteTransfers = filteredTransfers.filter((transfer) => transfer.fromSiteId === site.id || transfer.toSiteId === site.id);
      const siteStocktakes = filteredStocktakes.filter((stocktake) => stocktake.siteId === site.id);
      const wasteValue = siteWaste.reduce((total, record) => {
        const product = productMap.get(record.productId);
        return total + record.quantity * (product ? productUnitCost(product) : 0);
      }, 0);
      return {
        ...site,
        inventoryValue: siteInventory.reduce((total, row) => total + row.value, 0),
        lowStock: siteInventory.filter((row) => ["Low Stock", "Reorder", "Out of Stock"].includes(row.status)).length,
        orderSpend: siteOrders.reduce((total, order) => total + (order.invoiceTotal ?? order.total), 0),
        openOrders: siteOrders.filter((order) => order.status === "Sent").length,
        wasteRecords: siteWaste.length,
        wasteValue,
        transfers: siteTransfers.length,
        completedStocktakes: siteStocktakes.filter((stocktake) => stocktake.status === "Completed").length,
      };
    });

  if (tab === "sites") {
    const csv = siteRows.map((row) => ({ Site: row.name, "Inventory Value": row.inventoryValue, "Low Stock Products": row.lowStock, "Order Spend": row.orderSpend, "Open Orders": row.openOrders, "Waste Records": row.wasteRecords, "Estimated Waste Value": row.wasteValue, Transfers: row.transfers, "Completed Stocktakes": row.completedStocktakes }));
    return <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard title="Sites" value={siteRows.length} icon={Building2} tone="slate" />
        <ReportKpiCard title="Combined Inventory" value={money(siteRows.reduce((total, row) => total + row.inventoryValue, 0))} icon={CircleDollarSign} tone="green" />
        <ReportKpiCard title="Low Stock Products" value={siteRows.reduce((total, row) => total + row.lowStock, 0)} icon={AlertTriangle} tone="orange" />
        <ReportKpiCard title="Open Orders" value={siteRows.reduce((total, row) => total + row.openOrders, 0)} icon={ShoppingCart} tone="blue" />
      </div>
      <ReportSection title="Site Performance Report" description="Operational summary by site." actions={actions("site-report.csv", csv)}>
        <ReportTable rows={siteRows} rowKey={(row) => row.id} columns={[
          { key: "site", label: "Site", render: (row) => <strong>{row.name}</strong> },
          { key: "inventory", label: "Inventory Value", align: "right", render: (row) => money(row.inventoryValue) },
          { key: "low", label: "Low Stock", align: "center", render: (row) => row.lowStock },
          { key: "spend", label: "Order Spend", align: "right", render: (row) => money(row.orderSpend) },
          { key: "orders", label: "Open Orders", align: "center", render: (row) => row.openOrders },
          { key: "waste", label: "Waste", align: "right", render: (row) => `${row.wasteRecords} • ${money(row.wasteValue)}` },
          { key: "transfers", label: "Transfers", align: "center", render: (row) => row.transfers },
          { key: "stocktakes", label: "Stocktakes", align: "center", render: (row) => row.completedStocktakes },
        ]} />
      </ReportSection>
    </>;
  }

  // Operations overview
  const totalInventory = siteRows.reduce((total, row) => total + row.inventoryValue, 0);
  const totalSpend = filteredOrders.reduce((total, order) => total + (order.invoiceTotal ?? order.total), 0);
  const totalWaste = filteredWaste.reduce((total, record) => {
    const product = productMap.get(record.productId);
    return total + record.quantity * (product ? productUnitCost(product) : 0);
  }, 0);
  const openOrders = filteredOrders.filter((order) => order.status === "Sent").length;
  const completedStocktakes = filteredStocktakes.filter((item) => item.status === "Completed").length;
  const recentActivity = [
    ...filteredMovements.map((movement) => ({ id: `movement-${movement.id}`, date: movement.createdAt, site: siteName(movement.siteId), type: movement.movementType, detail: `${movement.productName} ${movement.quantity >= 0 ? "+" : ""}${number(movement.quantity)}` })),
    ...filteredOrders.map((order) => ({ id: `order-${order.id}`, date: order.createdAt, site: order.siteName, type: `Order ${order.status}`, detail: `${order.orderNumber} • ${order.supplierName} • ${money(order.invoiceTotal ?? order.total)}` })),
    ...filteredWaste.map((record) => ({ id: `waste-${record.id}`, date: record.createdAt, site: record.siteName, type: "Waste", detail: `${record.productName} • ${number(record.quantity)} ${record.inventoryUnit} • ${record.reason}` })),
    ...filteredTransfers.map((transfer) => ({ id: `transfer-${transfer.id}`, date: transfer.createdAt, site: transfer.fromSiteName, type: "Transfer", detail: `${transfer.productName} • ${transfer.fromSiteName} → ${transfer.toSiteName}` })),
    ...filteredStocktakes.map((stocktake) => ({ id: `stocktake-${stocktake.id}`, date: stocktake.completedAt ?? stocktake.startedAt, site: stocktake.siteName, type: `Stocktake ${stocktake.status}`, detail: `${stocktake.stocktakeNumber} • ${stocktake.periodLabel}` })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);

  const csv = siteRows.map((row) => ({ Site: row.name, "Inventory Value": row.inventoryValue, "Order Spend": row.orderSpend, "Waste Value": row.wasteValue, "Open Orders": row.openOrders, "Low Stock": row.lowStock, Transfers: row.transfers, Stocktakes: row.completedStocktakes }));
  return <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <ReportKpiCard title="Inventory Value" value={money(totalInventory)} icon={CircleDollarSign} tone="green" />
      <ReportKpiCard title="Order Spend" value={money(totalSpend)} icon={ShoppingCart} tone="blue" />
      <ReportKpiCard title="Estimated Waste" value={money(totalWaste)} icon={Trash2} tone="red" />
      <ReportKpiCard title="Open Orders" value={openOrders} icon={Clock3} tone="orange" />
      <ReportKpiCard title="Transfers" value={filteredTransfers.length} icon={Repeat2} tone="purple" />
      <ReportKpiCard title="Completed Stocktakes" value={completedStocktakes} icon={ClipboardCheck} tone="green" />
      <ReportKpiCard title="Low Stock Products" value={siteRows.reduce((total, row) => total + row.lowStock, 0)} icon={AlertTriangle} tone="orange" />
      <ReportKpiCard title="Waste Records" value={filteredWaste.length} icon={TrendingDown} tone="slate" />
    </div>
    <ReportSection title="Operations Summary by Site" description="A complete multi-site snapshot for the selected period." actions={actions("operations-report.csv", csv)}>
      <ReportTable rows={siteRows} rowKey={(row) => row.id} columns={[
        { key: "site", label: "Site", render: (row) => <strong>{row.name}</strong> },
        { key: "inventory", label: "Inventory", align: "right", render: (row) => money(row.inventoryValue) },
        { key: "spend", label: "Order Spend", align: "right", render: (row) => money(row.orderSpend) },
        { key: "waste", label: "Waste", align: "right", render: (row) => money(row.wasteValue) },
        { key: "orders", label: "Open Orders", align: "center", render: (row) => row.openOrders },
        { key: "low", label: "Low Stock", align: "center", render: (row) => row.lowStock },
        { key: "transfers", label: "Transfers", align: "center", render: (row) => row.transfers },
        { key: "stocktakes", label: "Stocktakes", align: "center", render: (row) => row.completedStocktakes },
      ]} />
    </ReportSection>
    <ReportSection title="Recent Operational Activity" description="Latest activity matching the selected filters.">
      <ReportTable rows={recentActivity} rowKey={(row) => row.id} columns={[
        { key: "date", label: "Date", render: (row) => formatDateTime(row.date) },
        { key: "site", label: "Site", render: (row) => row.site },
        { key: "type", label: "Activity", render: (row) => <strong>{row.type}</strong> },
        { key: "detail", label: "Details", render: (row) => row.detail },
      ]} />
    </ReportSection>
  </>;
}
