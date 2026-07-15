import DashboardPreview from "./DashboardPreview";

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-8 py-20 lg:grid-cols-2 lg:items-center">
      <div>
        <div className="mb-6 inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-800">
          All-in-one operations platform for hospitality
        </div>

        <h1 className="text-6xl font-extrabold leading-tight text-gray-950">
          Run a smarter kitchen.
          <span className="block text-green-800">Every day.</span>
        </h1>

        <p className="mt-6 text-xl leading-8 text-gray-600">
          Inventory, recipes, purchasing, invoices and reporting. All your
          sites. One platform. Total control.
        </p>

        <div className="mt-10 flex gap-4">
          <button className="rounded-xl bg-green-800 px-7 py-4 font-semibold text-white hover:bg-green-900">
            Start free trial
          </button>

          <button className="rounded-xl border border-green-800 px-7 py-4 font-semibold text-green-800 hover:bg-green-50">
            Book a demo
          </button>
        </div>
      </div>

      <DashboardPreview />

    </section>
  );
}