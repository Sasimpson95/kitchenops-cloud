export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-800 text-lg font-bold text-white">
            K
          </div>

          <span className="text-2xl font-bold text-gray-900">
            KitchenOps
          </span>
        </div>

        <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 lg:flex">
          <button className="hover:text-violet-800">Platform</button>
          <button className="hover:text-violet-800">Pricing</button>
          <button className="hover:text-violet-800">Resources</button>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-sm font-medium text-gray-700 hover:text-violet-800">
            Login
          </button>

          <button className="rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white transition hover:bg-violet-900">
            Start Free Trial
          </button>
        </div>

      </div>
    </nav>
  );
}