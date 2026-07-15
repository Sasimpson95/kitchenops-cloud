"use client";

import ProtectedPage from "@/components/ProtectedPage";
import PageHeader from "@/components/ui/PageHeader";
import OrdersTable from "@/components/orders/OrdersTable";

export default function OrdersPage() {
  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-7xl">

          <PageHeader
            title="Purchase Orders"
            description="View and manage all supplier orders."
          />

          <OrdersTable />

        </div>
      </main>
    </ProtectedPage>
  );
}