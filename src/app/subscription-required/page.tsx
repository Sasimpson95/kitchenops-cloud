export default function SubscriptionRequiredPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-sm sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
          KitchenOps trial
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
          Your trial has ended.
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Your KitchenOps business and everything you entered are still safe. Choose a plan to continue using the workspace.
        </p>

        <div className="mt-7 rounded-2xl bg-violet-50 p-5 text-sm leading-6 text-violet-950">
          We are finishing the in-app subscription checkout. If you reach this screen during the launch period, contact KitchenOps and we can help you continue access.
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <a
            href="https://kitchenops.co.uk/pricing"
            className="rounded-xl bg-violet-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-violet-800"
          >
            View plans
          </a>
          <a
            href="mailto:hello@kitchenops.co.uk?subject=KitchenOps%20subscription"
            className="rounded-xl border border-violet-200 px-5 py-3 text-center font-semibold text-violet-800 transition hover:bg-violet-50"
          >
            Contact KitchenOps
          </a>
        </div>

      </section>
    </main>
  );
}
