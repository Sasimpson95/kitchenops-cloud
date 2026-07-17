import Card from "@/components/ui/Card";

const activity = [
  "Booker order created",
];

export default function RecentActivity() {
  return (
    <Card>
      <h2 className="text-xl font-bold text-gray-950">Recent Activity</h2>

      <div className="mt-5 space-y-3">
        {activity.map((item) => (
          <p key={item} className="rounded-2xl bg-slate-50 p-4 font-semibold">
            ✅ {item}
          </p>
        ))}
      </div>
    </Card>
  );
}