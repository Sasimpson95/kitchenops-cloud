"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { TOAST_EVENT, type ToastPayload, type ToastTone } from "@/lib/toast";

type ToastItem = ToastPayload & { id: number };

const toneStyles: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-white text-emerald-700",
  error: "border-red-200 bg-white text-red-700",
  warning: "border-amber-200 bg-white text-amber-700",
  info: "border-violet-200 bg-white text-violet-700",
};

function ToneIcon({ tone }: { tone: ToastTone }) {
  if (tone === "success") return <CheckCircle2 className="h-5 w-5" />;
  if (tone === "error") return <AlertCircle className="h-5 w-5" />;
  if (tone === "warning") return <TriangleAlert className="h-5 w-5" />;
  return <Info className="h-5 w-5" />;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<ToastPayload>).detail;
      if (!detail?.title) return;
      const id = nextId.current++;
      const item: ToastItem = { ...detail, id, tone: detail.tone ?? "info" };
      setItems((current) => [...current.slice(-3), item]);
      window.setTimeout(() => {
        setItems((current) => current.filter((toast) => toast.id !== id));
      }, detail.duration ?? 4200);
    }

    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  return (
    <>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[100] flex flex-col items-end gap-3 sm:left-auto sm:right-5 sm:top-5 sm:w-[380px]"
      >
        {items.map((item) => {
          const tone = item.tone ?? "info";
          return (
            <div
              key={item.id}
              role={tone === "error" ? "alert" : "status"}
              className={`pointer-events-auto w-full animate-[toast-in_180ms_ease-out] rounded-2xl border p-4 shadow-xl shadow-slate-950/10 ${toneStyles[tone]}`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0"><ToneIcon tone={tone} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-950">{item.title}</p>
                  {item.description ? <p className="mt-1 text-sm leading-5 text-slate-600">{item.description}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => setItems((current) => current.filter((toast) => toast.id !== item.id))}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
