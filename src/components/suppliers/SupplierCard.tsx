import Link from "next/link";
import { Supplier } from "@/data/suppliers";
import Card from "@/components/ui/Card";

type SupplierCardProps = {
  supplier: Supplier;
};

export default function SupplierCard({ supplier }: SupplierCardProps) {
  return (
    <Link href={`/suppliers/${supplier.id}`} className="block">
      <Card className="transition hover:-translate-y-1 hover:shadow-md">
        <h2 className="text-2xl font-bold text-gray-950">
          {supplier.name}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {supplier.contactName}
        </p>

        <div className="mt-5 space-y-3 text-sm text-gray-600">
          <p>
            <strong>Email:</strong> {supplier.email}
          </p>

          <p>
            <strong>Phone:</strong> {supplier.phone}
          </p>

          <p>
            <strong>Delivery Days:</strong>{" "}
            {supplier.deliveryDays.join(", ")}
          </p>

          <p>
            <strong>Lead Time:</strong> {supplier.leadTime}
          </p>

          <p>
            <strong>Notes:</strong> {supplier.notes}
          </p>
        </div>

        <p className="mt-5 font-semibold text-violet-800">
          View Supplier →
        </p>
      </Card>
    </Link>
  );
}