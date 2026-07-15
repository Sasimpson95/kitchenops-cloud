import ProtectedPage from "@/components/ProtectedPage";

export default function DeliveriesPage() {
  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-8">
        <h1 className="text-4xl font-bold text-gray-950">Deliveries</h1>
        <p className="mt-2 text-gray-600">Receive orders coming soon.</p>
      </main>
    </ProtectedPage>
  );
}