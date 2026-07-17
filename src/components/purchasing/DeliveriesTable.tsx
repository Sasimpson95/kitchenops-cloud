import Card from "@/components/ui/Card";

const deliveries: Array<{ supplier: string; eta: string; status: string }> = [];

export default function DeliveriesTable() {
  return (
    <Card>
      <h2 className="text-xl font-bold text-gray-950">Today&apos;s Deliveries</h2>

      <div className="mt-5 overflow-hidden rounded-2xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-gray-500">
            <tr>
              <th className="p-4">Supplier</th>
              <th className="p-4">ETA</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {deliveries.map((delivery) => (
              <tr key={delivery.supplier}>
                <td className="p-4 font-semibold">{delivery.supplier}</td>
                <td className="p-4">{delivery.eta}</td>
                <td className="p-4">{delivery.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}