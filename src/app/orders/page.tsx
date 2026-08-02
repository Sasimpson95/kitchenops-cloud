"use client";

import ProtectedPage from "@/components/ProtectedPage";
import PageHeader from "@/components/ui/PageHeader";
import OrdersTable from "@/components/orders/OrdersTable";

export default function OrdersPage() {
  return (
    <ProtectedPage>
      <main className="ko-page ko-enter">
        <div className="w-full">

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