"use client";

import { toast } from "@/lib/toast";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Check,
  Copy,
  Loader2,
  Mail,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserRound,
  UserRoundPlus,
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

type OperationsUser = {
  id: string;
  authUserId: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  currentUser: boolean;
};

type PendingInvite = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  expiresAt: string;
};

type OperationsUsersResponse = {
  ok?: boolean;
  error?: string;
  operationsUsers?: OperationsUser[];
  pendingInvites?: PendingInvite[];
};

type ApiResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
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

  const [operationsUsers, setOperationsUsers] = useState<OperationsUser[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [operationsName, setOperationsName] = useState("");
  const [operationsEmail, setOperationsEmail] = useState("");
  const [operationsLoading, setOperationsLoading] = useState(true);
  const [operationsSaving, setOperationsSaving] = useState(false);
  const [revokingInviteId, setRevokingInviteId] = useState("");

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
  const [operationsError, setOperationsError] = useState("");

  const loadOperationsUsers = useCallback(async () => {
    setOperationsLoading(true);
    setOperationsError("");

    try {
      const response = await fetch("/api/operations/users", {
        method: "GET",
        cache: "no-store",
      });

      const data =
        (await response.json()) as OperationsUsersResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ??
            "Operations users could not be loaded."
        );
      }

      setOperationsUsers(data.operationsUsers ?? []);
      setPendingInvites(data.pendingInvites ?? []);
    } catch (caughtError) {
      setOperationsError(
        caughtError instanceof Error
          ? caughtError.message
          : "Operations users could not be loaded."
      );
    } finally {
      setOperationsLoading(false);
    }
  }, []);

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
          .select(
            "id,name,role,active,must_change_pin,last_login_at,created_at,site_id,sites(name)"
          )
          .eq("business_id", nextBusinessId)
          .order("name"),
      ]);

      if (siteResult.error) throw siteResult.error;
      if (staffResult.error) throw staffResult.error;

      const nextSites = siteResult.data ?? [];
      setSites(nextSites);
      setSiteId(
        (current) =>
          current || nextSites[0]?.id || ""
      );
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
    void Promise.all([
      load(),
      loadOperationsUsers(),
    ]);
  }, [load, loadOperationsUsers]);

  async function copyCode(): Promise<void> {
    if (!businessCode) return;

    await navigator.clipboard.writeText(businessCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function inviteOperationsUser(): Promise<void> {
    if (operationsSaving) return;

    const nextName = operationsName.trim();
    const nextEmail = operationsEmail.trim();

    if (nextName.length < 2) {
      setOperationsError("Enter the person's name.");
      return;
    }

    if (!nextEmail || !nextEmail.includes("@")) {
      setOperationsError("Enter a valid email address.");
      return;
    }

    setOperationsSaving(true);
    setOperationsError("");

    try {
      const response = await fetch(
        "/api/operations/invite",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: nextName,
            email: nextEmail,
          }),
        }
      );

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ??
            "The Operations invitation could not be sent."
        );
      }

      setOperationsName("");
      setOperationsEmail("");

      toast.success(
        "Invitation sent",
        data.message ??
          `Operations invitation sent to ${nextEmail}.`
      );

      await loadOperationsUsers();
    } catch (caughtError) {
      setOperationsError(
        caughtError instanceof Error
          ? caughtError.message
          : "The Operations invitation could not be sent."
      );
    } finally {
      setOperationsSaving(false);
    }
  }

  async function revokeOperationsInvite(
    invite: PendingInvite
  ): Promise<void> {
    if (revokingInviteId) return;

    const confirmed = window.confirm(
      `Revoke the Operations invitation for ${invite.email}?`
    );

    if (!confirmed) return;

    setRevokingInviteId(invite.id);
    setOperationsError("");

    try {
      const response = await fetch(
        "/api/operations/invite/revoke",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invitationId: invite.id,
          }),
        }
      );

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ??
            "The invitation could not be revoked."
        );
      }

      toast.success(
        "Invitation revoked",
        `${invite.email} can no longer use that invitation.`
      );

      await loadOperationsUsers();
    } catch (caughtError) {
      setOperationsError(
        caughtError instanceof Error
          ? caughtError.message
          : "The invitation could not be revoked."
      );
    } finally {
      setRevokingInviteId("");
    }
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
    const random = new Uint32Array(1);
    window.crypto.getRandomValues(random);
    const next = String(random[0] % 10000).padStart(
      4,
      "0"
    );

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
      await navigator.clipboard
        .writeText(next)
        .catch(() => undefined);

      window.alert(
        `Temporary PIN for ${item.name}: ${next}\n\nThe PIN has been copied to your clipboard. ${item.name} must use it once, then choose a new PIN at sign-in.`
      );

      toast.success(
        "Temporary PIN reset",
        "The user must choose a new PIN at their next sign-in."
      );

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
      <main className="ko-page ko-enter">
        <div className="w-full max-w-6xl">
          <p className="font-semibold text-violet-800">
            Operations
          </p>

          <h1 className="mt-1 text-4xl font-bold">
            Users
          </h1>

          <p className="mt-2 max-w-3xl text-gray-600">
            Manage business-wide Operations accounts and
            Manager or Chef PIN accounts for shared kitchen
            devices.
          </p>

          <section className="mt-8 rounded-2xl border border-violet-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
                <ShieldCheck size={22} />
              </div>

              <div>
                <p className="text-sm font-semibold text-violet-800">
                  Business-wide access
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-950">
                  Operations Users
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                  Operations users sign in with their own
                  email and password and can manage the
                  KitchenOps business. Invitations do not
                  count as active Operations users until
                  they have been accepted.
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-2xl bg-slate-50 p-5">
              <h3 className="font-bold text-gray-950">
                Invite Operations User
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                The person will receive an email with a
                secure invitation link.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1.4fr_auto]">
                <label>
                  <span className="text-sm font-semibold text-gray-700">
                    Name
                  </span>

                  <input
                    value={operationsName}
                    onChange={(event) => {
                      setOperationsName(event.target.value);
                      setOperationsError("");
                    }}
                    placeholder="Alex Smith"
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-gray-700">
                    Email
                  </span>

                  <div className="relative mt-2">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="email"
                      value={operationsEmail}
                      onChange={(event) => {
                        setOperationsEmail(
                          event.target.value
                        );
                        setOperationsError("");
                      }}
                      placeholder="alex@example.com"
                      className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none focus:border-violet-800"
                    />
                  </div>
                </label>

                <button
                  type="button"
                  onClick={inviteOperationsUser}
                  disabled={operationsSaving}
                  className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900 disabled:opacity-60"
                >
                  {operationsSaving ? (
                    <Loader2
                      className="animate-spin"
                      size={18}
                    />
                  ) : (
                    <UserRoundPlus size={18} />
                  )}

                  {operationsSaving
                    ? "Sending..."
                    : "Send Invite"}
                </button>
              </div>

              {operationsError && (
                <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
                  {operationsError}
                </p>
              )}
            </div>

            <div className="mt-7">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-950">
                  Active Operations Users
                </h3>

                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
                  {
                    operationsUsers.filter(
                      (item) => item.active
                    ).length
                  }{" "}
                  active
                </span>
              </div>

              {operationsLoading ? (
                <p className="mt-4 text-sm text-gray-500">
                  Loading Operations users...
                </p>
              ) : operationsUsers.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-slate-50 p-6 text-center text-sm text-gray-500">
                  No Operations users found.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {operationsUsers.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-gray-200 p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
                            <UserRound size={20} />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-gray-950">
                                {item.name}
                              </p>

                              {item.currentUser && (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                  You
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-gray-500">
                              {item.email}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`w-fit rounded-full px-3 py-2 text-xs font-semibold ${
                            item.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {item.active
                            ? "Active"
                            : "Disabled"}
                        </span>
                      </div>

                      <div className="mt-4 border-t border-gray-200 pt-4 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Added
                        </p>

                        <p className="mt-1 font-semibold text-gray-700">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-7 border-t border-gray-200 pt-7">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-950">
                  Pending Invitations
                </h3>

                {pendingInvites.length > 0 && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    {pendingInvites.length} pending
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Pending invitations do not count as active
                Operations users.
              </p>

              {operationsLoading ? (
                <p className="mt-4 text-sm text-gray-500">
                  Loading invitations...
                </p>
              ) : pendingInvites.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-slate-50 p-6 text-center text-sm text-gray-500">
                  No pending Operations invitations.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {pendingInvites.map((invite) => (
                    <article
                      key={invite.id}
                      className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <p className="font-bold text-gray-950">
                            {invite.name}
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            {invite.email}
                          </p>

                          <p className="mt-2 text-xs font-semibold text-amber-800">
                            Expires{" "}
                            {formatDate(
                              invite.expiresAt
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800">
                            Pending
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              revokeOperationsInvite(
                                invite
                              )
                            }
                            disabled={
                              Boolean(
                                revokingInviteId
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            {revokingInviteId ===
                            invite.id ? (
                              <Loader2
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={15} />
                            )}

                            Revoke
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="mt-10">
            <div>
              <p className="text-sm font-semibold text-violet-800">
                Shared kitchen access
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-950">
                Manager & Chef Users
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                These are site-based PIN accounts for shared
                kitchen devices. They are separate from
                Operations email accounts.
              </p>
            </div>
          </div>

          <section className="mt-6 flex flex-col justify-between gap-4 rounded-2xl bg-violet-950 p-6 text-white shadow-sm sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-violet-200">
                {businessName}
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Business Code
              </h2>

              <p className="mt-2 text-sm text-violet-100">
                Staff enter this before choosing their site
                and name.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-white/10 px-5 py-3 font-mono text-xl font-bold tracking-[0.18em]">
                {businessCode || "—"}
              </span>

              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-violet-950"
              >
                {copied ? (
                  <Check size={18} />
                ) : (
                  <Copy size={18} />
                )}

                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </section>

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              New Kitchen User
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Name"
                className="rounded-xl border border-gray-300 px-4 py-3"
              />

              <select
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value as
                      | "manager"
                      | "chef"
                  )
                }
                className="rounded-xl border border-gray-300 px-4 py-3"
              >
                <option value="chef">Chef</option>
                <option value="manager">
                  Manager
                </option>
              </select>

              <select
                value={siteId}
                onChange={(event) =>
                  setSiteId(event.target.value)
                }
                className="rounded-xl border border-gray-300 px-4 py-3"
              >
                {sites.map((site) => (
                  <option
                    key={site.id}
                    value={site.id}
                  >
                    {site.name}
                  </option>
                ))}
              </select>

              <input
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(event) =>
                  setPin(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 4)
                  )
                }
                placeholder="Temporary PIN"
                className="rounded-xl border border-gray-300 px-4 py-3"
              />

              <button
                type="button"
                onClick={createStaff}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {saving ? (
                  <Loader2
                    className="animate-spin"
                    size={18}
                  />
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

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              Kitchen Team
            </h2>

            {loading ? (
              <p className="mt-5 text-gray-500">
                Loading users...
              </p>
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
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
                          <UserRound size={20} />
                        </div>

                        <div>
                          <p className="font-bold">
                            {item.name}
                          </p>

                          <p className="mt-1 text-sm capitalize text-gray-500">
                            {item.role} •{" "}
                            {siteName(item)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-2 text-xs font-semibold ${
                            item.active
                              ? "bg-violet-100 text-violet-800"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {item.active
                            ? "Active"
                            : "Disabled"}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            resetPin(item)
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold"
                        >
                          <RotateCcw size={15} />
                          Reset PIN
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggle(item)
                          }
                          className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold"
                        >
                          {item.active
                            ? "Disable"
                            : "Enable"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 border-t border-gray-200 pt-4 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Last Login
                        </p>

                        <p className="mt-1 font-semibold text-gray-700">
                          {formatDate(
                            item.last_login_at
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Created
                        </p>

                        <p className="mt-1 font-semibold text-gray-700">
                          {formatDate(
                            item.created_at
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          PIN Status
                        </p>

                        <p className="mt-1 font-semibold text-gray-700">
                          {item.must_change_pin
                            ? "Temporary PIN"
                            : "PIN set"}
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