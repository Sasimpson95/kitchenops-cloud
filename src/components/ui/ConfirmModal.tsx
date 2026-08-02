"use client";

import { AlertTriangle, X } from "lucide-react";
import Button from "./Button";

type ConfirmModalProps = {
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warning" | "neutral";
  loading?: boolean;
};

export default function ConfirmModal({
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
}: ConfirmModalProps) {
  return (
    <div className="mobile-native-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation">
      <div className="mobile-native-sheet w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <div className="flex items-start justify-between gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone === "danger" ? "bg-red-50 text-red-700" : tone === "warning" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <button type="button" onClick={onCancel} aria-label="Close" className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <h2 id="confirm-dialog-title" className="mt-5 text-xl font-bold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{message}</p>
        <div className="mobile-sticky-actions mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
