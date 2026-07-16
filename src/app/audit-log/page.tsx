"use client";

import {
  ClipboardList,
  Search,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ProtectedPage from "@/components/ProtectedPage";
import type { User } from "@/config/roles";
import { getCurrentUser } from "@/lib/currentUser";

import {
  getAuditRecords,
  subscribeToAuditChanges,
  type AuditRecord,
} from "@/lib/auditStore";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AuditLogPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "operations") {
      router.replace("/home");
      return;
    }

    setCurrentUser(user);

    function refresh(): void {
      setRecords(getAuditRecords());
    }

    refresh();
    return subscribeToAuditChanges(refresh);
  }, [router]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter(
      (record) =>
        !query ||
        `${record.title} ${record.description} ${record.area} ${record.performedBy}`
          .toLowerCase()
          .includes(query)
    );
  }, [records, search]);

  if (!currentUser) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          Loading Audit Log...
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <div>
            <h1 className="text-4xl font-bold text-gray-950">Audit Log</h1>
            <p className="mt-2 text-gray-600">
              Permanent system events recorded by KitchenOps.
            </p>
          </div>

          <div className="relative mt-8 max-w-xl">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search audit records..."
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 outline-none focus:border-violet-800"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="mt-8 rounded-3xl bg-white p-12 text-center shadow-sm">
              <ClipboardList size={40} className="mx-auto text-gray-400" />
              <h2 className="mt-4 text-2xl font-bold text-gray-950">
                No audit records yet
              </h2>
              <p className="mt-2 text-gray-500">
                New audited actions will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {filtered.map((record) => (
                <article
                  key={record.id}
                  className="rounded-3xl bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
                          {record.area}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          {record.action}
                        </span>
                      </div>

                      <h2 className="mt-3 text-xl font-bold text-gray-950">
                        {record.title}
                      </h2>
                      <p className="mt-2 text-gray-600">{record.description}</p>
                    </div>

                    <div className="text-sm text-gray-500 sm:text-right">
                      <p className="font-semibold text-gray-800">
                        {record.performedBy}
                      </p>
                      <p className="mt-1">{formatDateTime(record.createdAt)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </ProtectedPage>
  );
}
