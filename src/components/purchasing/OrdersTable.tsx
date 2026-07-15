import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";

const orders = [
  { supplier: "Brakes", status: "Draft", delivery: "Today" },
  { supplier: "Pudding Pantry Bakery", status: "Sent", delivery: "Tomorrow" },
  { supplier: "Booker", status: "Sent", delivery: "Friday" },
];

export default function OrdersTable() {
  return (
    <Card>
      <h2 className="text-xl font-bold text-gray-950">Orders Awaiting Action</h2>

      <div className="mt-5 overflow-hidden rounded-2xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-gray-500">
            <tr>
              <th className="p-4">Supplier</th>
              <th className="p-4">Status</th>
              <th className="p-4">Delivery</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order.supplier}>
                <td className="p-4 font-semibold">{order.supplier}</td>
                <td className="p-4">
                  <StatusBadge status={order.status as "Draft" | "Sent"} />
                </td>
                <td className="p-4">{order.delivery}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}