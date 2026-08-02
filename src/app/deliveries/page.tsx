import ProtectedPage from "@/components/ProtectedPage";

export default function DeliveriesPage() {
  return (
    <ProtectedPage>
      <main className="ko-page ko-enter">
        <h1 className="text-4xl font-bold text-gray-950">Deliveries</h1>
        <p className="mt-2 text-gray-600">Receive orders coming soon.</p>
      </main>
    </ProtectedPage>
  );
}