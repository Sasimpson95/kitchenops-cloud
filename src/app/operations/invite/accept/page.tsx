"use client";

import {
  CheckCircle2,
  Loader2,
  LogIn,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type AcceptResponse = {
  ok?: boolean;
  code?: string;
  error?: string;
  message?: string;
  alreadyMember?: boolean;
};

type PageState =
  | "checking"
  | "signed-out"
  | "ready"
  | "accepting"
  | "accepted"
  | "error";

export default function AcceptOperationsInvitePage() {
  const searchParams = useSearchParams();

  const token = useMemo(
    () => searchParams.get("token")?.trim() ?? "",
    [searchParams]
  );

  const [state, setState] = useState<PageState>("checking");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkAuth(): Promise<void> {
      setError("");
      setMessage("");

      if (!token) {
        if (!active) return;

        setError("This invitation link is invalid.");
        setState("error");
        return;
      }

      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;

        if (!user) {
          setState("signed-out");
          return;
        }

        setEmail(user.email ?? "");
        setState("ready");
      } catch {
        if (!active) return;

        setError(
          "KitchenOps could not check your account. Please try again."
        );
        setState("error");
      }
    }

    void checkAuth();

    return () => {
      active = false;
    };
  }, [token]);

  async function acceptInvitation(): Promise<void> {
    if (!token || state === "accepting") return;

    setState("accepting");
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/operations/invite/accept",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
          }),
        }
      );

      const result =
        (await response.json()) as AcceptResponse;

      if (!response.ok || !result.ok) {
        if (result.code === "AUTH_REQUIRED") {
          setState("signed-out");
          return;
        }

        setError(
          result.error ??
            "This Operations invitation could not be accepted."
        );
        setState("error");
        return;
      }

      setMessage(
        result.message ??
          "Your Operations access is ready."
      );
      setState("accepted");
    } catch {
      setError(
        "KitchenOps could not accept this invitation. Please try again."
      );
      setState("error");
    }
  }

  const loginHref = `/login?next=${encodeURIComponent(
    `/operations/invite/accept?token=${token}`
  )}`;

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
          Operations invitation
        </h1>

        <p className="mt-3 leading-7 text-gray-600">
          You&apos;ve been invited to join a KitchenOps
          business as an Operations user.
        </p>

        {state === "checking" && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-slate-50 p-5 text-gray-600">
            <Loader2
              size={20}
              className="animate-spin"
            />
            Checking your KitchenOps account...
          </div>
        )}

        {state === "signed-out" && (
          <div className="mt-8">
            <div className="rounded-2xl bg-violet-50 p-5">
              <div className="flex items-start gap-3">
                <LogIn
                  size={21}
                  className="mt-0.5 shrink-0 text-violet-800"
                />

                <div>
                  <p className="font-bold text-violet-950">
                    Sign in first
                  </p>

                  <p className="mt-2 text-sm leading-6 text-violet-900">
                    Sign in using the email address that
                    received this invitation. If you do not
                    yet have a KitchenOps account, you will
                    need to create one using that same email
                    address.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href={loginHref}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900"
            >
              <LogIn size={18} />
              Sign in to continue
            </Link>
          </div>
        )}

        {state === "ready" && (
          <div className="mt-8">
            <div className="rounded-2xl border border-gray-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-gray-500">
                Signed in as
              </p>

              <p className="mt-1 font-bold text-gray-950">
                {email || "KitchenOps account"}
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-amber-50 p-5">
              <p className="font-bold text-amber-950">
                Before you continue
              </p>

              <p className="mt-2 text-sm leading-6 text-amber-900">
                This will add your account as an Operations
                user for the business that invited you.
              </p>
            </div>

            <button
              type="button"
              onClick={acceptInvitation}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900"
            >
              <UserPlus size={18} />
              Accept Operations invitation
            </button>
          </div>
        )}

        {state === "accepting" && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-violet-50 p-5 text-violet-900">
            <Loader2
              size={20}
              className="animate-spin"
            />
            Adding your Operations access...
          </div>
        )}

        {state === "accepted" && (
          <div className="mt-8">
            <div className="rounded-2xl bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={22}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />

                <div>
                  <p className="font-bold text-emerald-950">
                    Invitation accepted
                  </p>

                  <p className="mt-2 text-sm leading-6 text-emerald-900">
                    {message}
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/home"
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900"
            >
              Continue to KitchenOps
            </Link>
          </div>
        )}

        {state === "error" && (
          <div className="mt-8">
            <div className="rounded-2xl bg-red-50 p-5 text-sm font-semibold leading-6 text-red-700">
              {error}
            </div>

            <Link
              href="/login"
              className="mt-6 flex w-full items-center justify-center rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-800"
            >
              Go to sign in
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}