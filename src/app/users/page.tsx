"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Check,
  Copy,
  Loader2,
  Plus,
  RotateCcw,
  UserRound,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import {
  getCloudSession,
} from "@/lib/cloudSession";
import {
  createClient,
} from "@/lib/supabase/client";

type Site = {
  id: string;
  name: string;
};

type Staff = {
  id: string;
  name: string;
  role: "manager" | "chef";
  active: boolean;
  must_change_pin: boolean;
  last_login_at: string | null;
  created_at: string;
  site_id: string;
  sites:
    | { name: string }
    | { name: string }[]
    | null;
};

function formatDate(value: string | null): string {
  if (!value) return "Never";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function UsersPage() {
  const [businessId, setBusinessId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessCode, setBusinessCode] = useState("");
  const [sites, setSites] = useState<Site[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"manager" | "chef">("chef");
  const [siteId, setSiteId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const session = await getCloudSession();

      if (
        !session.authenticated ||
        !session.business ||
        session.user?.role !== "operations"
      ) {
        throw new Error("Operations permission required.");
      }

      const supabase = createClient();
      const nextBusinessId = session.business.id;

      setBusinessId(nextBusinessId);
      setBusinessName(session.business.name);
      setBusinessCode(session.business.code ?? "");

      const [siteResult, staffResult] = await Promise.all([
        supabase
          .from("sites")
          .select("id,name")
          .eq("business_id", nextBusinessId)
          .eq("active", true)
          .order("name"),
        supabase
          .from("staff_members")
          .select("id,name,role,active,must_change_pin,last_login_at,created_at,site_id,sites(name)")
          .eq("business_id", nextBusinessId)
          .order("name"),
      ]);

      if (siteResult.error) throw siteResult.error;
      if (staffResult.error) throw staffResult.error;

      const nextSites = siteResult.data ?? [];
      setSites(nextSites);
      setSiteId((current) => current || nextSites[0]?.id || "");
      setStaff((staffResult.data ?? []) as Staff[]);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Users could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyCode(): Promise<void> {
    if (!businessCode) return;

    await navigator.clipboard.writeText(businessCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function createStaff(): Promise<void> {
    if (
      !name.trim() ||
      !siteId ||
      !/^\d{4}$/.test(pin) ||
      !businessId
    ) {
      setError("Enter a name, site and four-digit PIN.");
      return;
    }

    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc(
      "create_staff_member",
      {
        requested_business_id: businessId,
        requested_site_id: siteId,
        staff_name: name.trim(),
        staff_role: role,
        temporary_pin: pin,
      }
    );

    if (rpcError) {
      setError(rpcError.message);
    } else {
      setName("");
      setPin("");
      await load();
    }

    setSaving(false);
  }

  async function toggle(item: Staff): Promise<void> {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("staff_members")
      .update({ active: !item.active })
      .eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      await load();
    }
  }

  async function resetPin(item: Staff): Promise<void> {
    const next = window.prompt(
      `Enter a new four-digit temporary PIN for ${item.name}`
    );

    if (!next) return;

    if (!/^\d{4}$/.test(next)) {
      window.alert("PIN must contain exactly four digits.");
      return;
    }

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc(
      "reset_staff_pin",
      {
        requested_staff_id: item.id,
        temporary_pin: next,
      }
    );

    if (rpcError) {
      setError(rpcError.message);
    } else {
      window.alert("Temporary PIN reset.");
      await load();
    }
  }

  function siteName(item: Staff): string {
    const relation = item.sites;
    return Array.isArray(relation)
      ? relation[0]?.name ?? "Unknown"
      : relation?.name ?? "Unknown";
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <p className="font-semibold text-green-800">Operations</p>
          <h1 className="mt-1 text-4xl font-bold">Users</h1>
          <p className="mt-2 text-gray-600">
            Create Manager and Chef PIN accounts for shared kitchen devices.
          </p>

          <section className="mt-8 flex flex-col justify-between gap-4 rounded-3xl bg-green-950 p-6 text-white shadow-sm sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-green-200">{businessName}</p>
              <h2 className="mt-1 text-2xl font-bold">Business Code</h2>
              <p className="mt-2 text-sm text-green-100">
                Staff enter this before choosing their site and name.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-white/10 px-5 py-3 font-mono text-xl font-bold tracking-[0.18em]">
                {businessCode || "—"}
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-green-950"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </section>

          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">New User</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name"
                className="rounded-xl border border-gray-300 px-4 py-3"
              />
              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as "manager" | "chef")
                }
                className="rounded-xl border border-gray-300 px-4 py-3"
              >
                <option value="chef">Chef</option>
                <option value="manager">Manager</option>
              </select>
              <select
                value={siteId}
                onChange={(event) => setSiteId(event.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-3"
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
              <input
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(event) =>
                  setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="Temporary PIN"
                className="rounded-xl border border-gray-300 px-4 py-3"
              />
              <button
                type="button"
                onClick={createStaff}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-800 px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Plus size={18} />
                )}
                Create
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}
          </section>

          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Team</h2>

            {loading ? (
              <p className="mt-5 text-gray-500">Loading users...</p>
            ) : staff.length === 0 ? (
              <p className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-gray-500">
                No Manager or Chef accounts yet.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {staff.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl bg-slate-50 p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-800">
                          <UserRound size={20} />
                        </div>
                        <div>
                          <p className="font-bold">{item.name}</p>
                          <p className="mt-1 text-sm capitalize text-gray-500">
                            {item.role} • {siteName(item)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-2 text-xs font-semibold ${
                          item.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-200 text-gray-700"
                        }`}>
                          {item.active ? "Active" : "Disabled"}
                        </span>
                        <button
                          type="button"
                          onClick={() => resetPin(item)}
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold"
                        >
                          <RotateCcw size={15} />
                          Reset PIN
                        </button>
                        <button
                          type="button"
                          onClick={() => toggle(item)}
                          className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold"
                        >
                          {item.active ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 border-t border-gray-200 pt-4 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Last Login</p>
                        <p className="mt-1 font-semibold text-gray-700">{formatDate(item.last_login_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Created</p>
                        <p className="mt-1 font-semibold text-gray-700">{formatDate(item.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">PIN Status</p>
                        <p className="mt-1 font-semibold text-gray-700">
                          {item.must_change_pin ? "Temporary PIN" : "PIN set"}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </ProtectedPage>
  );
}
