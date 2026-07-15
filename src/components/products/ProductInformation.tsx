import {
  CalendarDays,
  MapPin,
  Package,
  StickyNote,
  Truck,
} from "lucide-react";

import type { Product } from "@/data/products";
import type { Supplier } from "@/data/suppliers";

type ProductInformationProps = {
  product: Product;
  alternativeSuppliers: Supplier[];
};

function money(
  value: number,
  digits = 2
): string {
  return new Intl.NumberFormat(
    "en-GB",
    {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits:
        digits,
    }
  ).format(value);
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <div className="mt-1 font-semibold text-gray-950">
        {value}
      </div>
    </div>
  );
}

function InformationCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-800">
          {icon}
        </div>

        <h2 className="text-xl font-bold text-gray-950">
          {title}
        </h2>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

export default function ProductInformation({
  product,
  alternativeSuppliers,
}: ProductInformationProps) {
  const unitCost =
    product.purchaseQuantity > 0
      ? product.price /
        product.purchaseQuantity
      : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <InformationCard
        title="General & Purchasing"
        icon={<Package size={22} />}
      >
        <Detail
          label="Category"
          value={product.category}
        />

        <Detail
          label="Count Method"
          value={product.countMethod}
        />

        <Detail
          label="Purchase Unit"
          value={product.orderUnit}
        />

        <Detail
          label="Purchase Quantity"
          value={`${product.purchaseQuantity} ${product.inventoryUnit}`}
        />

        <Detail
          label="Purchase Price"
          value={money(
            product.price
          )}
        />

        <Detail
          label={`Cost Per ${product.inventoryUnit}`}
          value={
            <span className="text-green-800">
              {money(unitCost, 4)}
            </span>
          }
        />

        <Detail
          label="Inventory Unit"
          value={
            product.inventoryUnit
          }
        />

        <Detail
          label="Lead Time"
          value={`${product.leadTimeDays} ${
            product.leadTimeDays === 1
              ? "day"
              : "days"
          }`}
        />
      </InformationCard>

      <InformationCard
        title="Suppliers"
        icon={<Truck size={22} />}
      >
        <Detail
          label="Preferred Supplier"
          value={
            product.supplierName
          }
        />

        <Detail
          label="Supplier Code"
          value={
            product.supplierCode ||
            "Not set"
          }
        />

        <Detail
          label="Alternative Suppliers"
          value={
            alternativeSuppliers.length >
            0
              ? alternativeSuppliers
                  .map(
                    (supplier) =>
                      supplier.name
                  )
                  .join(", ")
              : "None"
          }
        />

        <Detail
          label="Delivery Days"
          value={
            product.deliveryDays
              .length > 0
              ? product.deliveryDays.join(
                  ", "
                )
              : "Not set"
          }
        />
      </InformationCard>

      <InformationCard
        title="Storage"
        icon={<MapPin size={22} />}
      >
        <Detail
          label="Storage Area"
          value={
            product.storageArea ||
            "Not assigned"
          }
        />

        <Detail
          label="Shelf"
          value={
            product.shelf ||
            "Not set"
          }
        />

        <Detail
          label="Bin / Position"
          value={
            product.binLocation ||
            "Not set"
          }
        />

        <Detail
          label="Full Location"
          value={[
            product.storageArea,
            product.shelf,
            product.binLocation,
          ]
            .filter(Boolean)
            .join(" • ")}
        />
      </InformationCard>

      <InformationCard
        title="Stock Levels"
        icon={
          <CalendarDays size={22} />
        }
      >
        <Detail
          label="Minimum"
          value={`${product.minimumStock} ${product.inventoryUnit}`}
        />

        <Detail
          label="Reorder Point"
          value={`${product.reorderPoint} ${product.inventoryUnit}`}
        />

        <Detail
          label="Maximum"
          value={`${product.maximumStock} ${product.inventoryUnit}`}
        />

        <Detail
          label="Status"
          value={
            product.active
              ? "Active"
              : "Archived"
          }
        />
      </InformationCard>

      <section className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-800">
            <StickyNote size={22} />
          </div>

          <h2 className="text-xl font-bold text-gray-950">
            Notes
          </h2>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-gray-700">
              Storage Instructions
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
              {product.storageNotes ||
                "No storage instructions have been added."}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-gray-700">
              Internal Notes
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
              {product.internalNotes ||
                "No internal notes have been added."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
