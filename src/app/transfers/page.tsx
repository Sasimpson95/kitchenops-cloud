"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Search, X } from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import TransferHistory from "@/components/transfers/TransferHistory";
import TransferModal from "@/components/transfers/TransferModal";

import type { User } from "@/config/roles";
import type { Product } from "@/data/products";
import type { StockTransfer } from "@/lib/transferStore";

import { getCurrentUser } from "@/lib/currentUser";
import { getActiveProducts, subscribeToProductChanges } from "@/lib/productStore";
import { getTransfers, subscribeToTransferChanges } from "@/lib/transferStore";

export default function TransfersPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [search, setSearch] = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);

  const refreshProducts = useCallback(() => {
    setProducts(getActiveProducts());
  }, []);

  const refreshTransfers = useCallback(() => {
    setTransfers(getTransfers());
  }, []);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "chef") {
      router.replace("/home");
      return;
    }

    setCurrentUser(user);
    setLoadingUser(false);
  }, [router]);

  useEffect(() => {
    refreshProducts();
    refreshTransfers();

    const unsubscribeProducts = subscribeToProductChanges(refreshProducts);
    const unsubscribeTransfers = subscribeToTransferChanges(refreshTransfers);

    return () => {
      unsubscribeProducts();
      unsubscribeTransfers();
    };
  }, [refreshProducts, refreshTransfers]);

  const visibleTransfers = useMemo(() => {
    if (!currentUser) return [];

    const normalisedSearch = search.trim().toLowerCase();
    const managerSite = currentUser.site.trim().toLowerCase();

    return transfers
      .filter((transfer) => {
        if (currentUser.role === "operations") return true;

        return (
          transfer.fromSiteName.toLowerCase() === managerSite ||
          transfer.toSiteName.toLowerCase() === managerSite
        );
      })
      .filter(
        (transfer) =>
          !normalisedSearch ||
          transfer.transferNumber.toLowerCase().includes(normalisedSearch) ||
          transfer.productName.toLowerCase().includes(normalisedSearch) ||
          transfer.fromSiteName.toLowerCase().includes(normalisedSearch) ||
          transfer.toSiteName.toLowerCase().includes(normalisedSearch) ||
          transfer.transferredBy.toLowerCase().includes(normalisedSearch) ||
          transfer.reason?.toLowerCase().includes(normalisedSearch)
      )
      .sort(
        (firstTransfer, secondTransfer) =>
          new Date(secondTransfer.createdAt).getTime() -
          new Date(firstTransfer.createdAt).getTime()
      );
  }, [currentUser, search, transfers]);

  if (loadingUser || !currentUser) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="font-semibold text-gray-600">Loading Transfers...</p>
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <ArrowLeftRight size={32} className="text-violet-800" />
                <h1 className="text-4xl font-bold text-gray-950">Transfers</h1>
              </div>

              <p className="mt-2 text-gray-600">
                Request, dispatch and receive stock between KitchenOps sites with a full audit trail.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowTransferModal(true)}
              className="rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white transition hover:bg-violet-900"
            >
              + New Transfer
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Transfers Recorded</p>
              <p className="mt-1 text-3xl font-bold text-gray-950">
                {visibleTransfers.length}
              </p>
            </div>

            <div className="rounded-3xl bg-violet-50 p-5 shadow-sm">
              <p className="text-sm text-violet-700">In Transit</p>
              <p className="mt-1 text-3xl font-bold text-violet-900">
                {visibleTransfers.filter((transfer) => transfer.status === "Dispatched").length}
              </p>
            </div>

            <div className="rounded-3xl bg-blue-50 p-5 shadow-sm">
              <p className="text-sm text-blue-700">Viewing</p>
              <p className="mt-1 text-xl font-bold text-blue-900">
                {currentUser.role === "operations" ? "All Sites" : currentUser.site}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-3xl bg-white p-5 shadow-sm">
            <div className="relative">
              <Search
                size={21}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search transfer number, product, site or user..."
                className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-12 outline-none transition focus:border-violet-800"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 hover:bg-slate-100"
                  aria-label="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="mt-8">
            <TransferHistory transfers={visibleTransfers} currentUser={currentUser} onChanged={refreshTransfers} />
          </div>
        </div>

        {showTransferModal && (
          <TransferModal
            currentUser={currentUser}
            products={products}
            onClose={() => setShowTransferModal(false)}
            onCompleted={refreshTransfers}
          />
        )}
      </main>
    </ProtectedPage>
  );
}
