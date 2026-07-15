import Card from "@/components/ui/Card";

const stats = [
  { label: "Orders Waiting", value: 4 },
  { label: "Deliveries Today", value: 2 },
  { label: "Price Changes", value: 1 },
  { label: "Suppliers", value: 3 },
];

export default function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <p className="text-sm font-semibold text-gray-500">{stat.label}</p>
          <p className="mt-2 text-4xl font-bold text-gray-950">
            {stat.value}
          </p>
        </Card>
      ))}
    </div>
  );
}