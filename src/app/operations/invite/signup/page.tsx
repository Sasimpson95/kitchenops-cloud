"use client";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type InviteDetailsResponse = {
  ok?: boolean;
  error?: string;
  invitation?: {
    email: string;
    name: string;
    businessName: string;
    expiresAt: string;
  };
};

export default function OperationsInviteSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(
    () => searchParams.get("token")?.trim() ?? "",
    [searchParams]
  );

  const [loadingInvite, setLoadingInvite] = useState(true);
  const [creating, setCreating] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadInvite(): Promise<void> {
      if (!token) {
        if (!active) return;

        setError("This invitation link is invalid.");
        setLoadingInvite(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/operations/invite/details?token=${encodeURIComponent(token)}`
        );

        const result =
          (await response.json()) as InviteDetailsResponse;

        if (!response.ok || !result.ok || !result.invitation) {
          if (!active) return;

          setError(
            result.error ??
              "KitchenOps could not load this invitation."
          );
          setLoadingInvite(false);
          return;
        }

        if (!active) return;

        setEmail(result.invitation.email);
        setName(result.invitation.name);
        setBusinessName(result.invitation.businessName);
        setLoadingInvite(false);
      } catch {
        if (!active) return;

        setError(
          "KitchenOps could not load this invitation."
        );
        setLoadingInvite(false);
      }
    }

    void loadInvite();

    return () => {
      active = false;
    };
  }, [token]);

  async function createAccount(): Promise<void> {
    if (creating) return;

    setError("");

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setCreating(true);

    try {
      const supabase = createClient();

      const { data, error: signupError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name,
            },
          },
        });

      if (signupError) {
        throw signupError;
      }

      if (!data.user) {
        throw new Error(
          "KitchenOps could not create your account."
        );
      }

      if (!data.session) {
        setCreated(true);
        setCreating(false);
        return;
      }

      router.replace(
        `/operations/invite/accept?token=${encodeURIComponent(token)}`
      );
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "KitchenOps could not create your account."
      );
      setCreating(false);
    }
  }

  const loginHref = `/login?next=${encodeURIComponent(
    `/operations/invite/accept?token=${token}`
  )}`;

  if (loadingInvite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-6 shadow-sm">
          <Loader2
            size={21}
            className="animate-spin text-violet-800"
          />
          <span className="font-semibold text-gray-700">
            Checking your invitation...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-xl rounded-2xl bg-white p-7 shadow-sm sm:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
          <ShieldCheck size={24} />
        </div>

        <p className="mt-6 font-semibold text-violet-800">
          KitchenOps
        </p>

        <h1 className="mt-1 text-3xl font-bold text-gray-950">
          Create your Operations account
        </h1>

        {error && !email ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-5 text-sm font-semibold leading-6 text-red-700">
            {error}
          </div>
        ) : created ? (
          <div className="mt-7">
            <div className="rounded-2xl bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={22}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />

                <div>
                  <p className="font-bold text-emerald-950">
                    Account created
                  </p>

                  <p className="mt-2 text-sm leading-6 text-emerald-900">
                    Check your email and confirm your account.
                    Then return to the invitation and sign in
                    using {email}.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href={loginHref}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900"
            >
              Continue to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-3 leading-7 text-gray-600">
              You&apos;ve been invited to join{" "}
              <strong>{businessName}</strong> as an Operations
              user.
            </p>

            <div className="mt-7 space-y-5">
              <div>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">
                    Name
                  </span>

                  <div className="relative mt-2">
                    <UserRound
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      value={name}
                      readOnly
                      className="w-full rounded-xl border border-gray-300 bg-slate-50 py-3 pl-11 pr-4 text-gray-700"
                    />
                  </div>
                </label>
              </div>

              <div>
                <label className="block">
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
                      value={email}
                      readOnly
                      className="w-full rounded-xl border border-gray-300 bg-slate-50 py-3 pl-11 pr-4 text-gray-700"
                    />
                  </div>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                  Password
                </span>

                <div className="relative mt-2">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-12 outline-none focus:border-violet-800"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 hover:bg-slate-100"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                  Confirm password
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setError("");
                  }}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                />
              </label>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={creating}
              onClick={createAccount}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900 disabled:opacity-60"
            >
              {creating && (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              )}

              {creating
                ? "Creating account..."
                : "Create Operations account"}
            </button>

            <div className="mt-6 border-t pt-5 text-center">
              <p className="text-sm text-gray-500">
                Already have a KitchenOps account?
              </p>

              <Link
                href={loginHref}
                className="mt-2 inline-block font-semibold text-violet-800 hover:underline"
              >
                Sign in instead
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}