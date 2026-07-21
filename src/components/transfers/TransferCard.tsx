"use client";

import { ArrowRight, CheckCircle2, Clock3, PackageCheck, Truck, XCircle } from "lucide-react";
import type { User } from "@/config/roles";
import type { StockTransfer } from "@/lib/transferStore";
import { cancelTransfer, dispatchTransfer, receiveTransfer } from "@/lib/transferStore";

type TransferCardProps = {
  transfer: StockTransfer;
  currentUser?: User;
  onChanged?: () => void;
};

function formatDateTime(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value);
}

function statusStyle(status: StockTransfer["status"]) {
  if (status === "Requested") return { cls: "bg-amber-100 text-amber-800", icon: <Clock3 size={14} /> };
  if (status === "Dispatched") return { cls: "bg-blue-100 text-blue-800", icon: <Truck size={14} /> };
  if (status === "Received") return { cls: "bg-violet-100 text-violet-800", icon: <CheckCircle2 size={14} /> };
  return { cls: "bg-gray-200 text-gray-700", icon: <XCircle size={14} /> };
}

export default function TransferCard({ transfer, currentUser, onChanged }: TransferCardProps) {
  const style = statusStyle(transfer.status);
  const isOperations = currentUser?.role === "operations";
  const userSite = currentUser?.site?.trim().toLowerCase();
  const canDispatch = transfer.status === "Requested" && (isOperations || transfer.fromSiteName.toLowerCase() === userSite);
  const canReceive = transfer.status === "Dispatched" && (isOperations || transfer.toSiteName.toLowerCase() === userSite);
  const canCancel = transfer.status === "Requested" && (isOperations || transfer.fromSiteName.toLowerCase() === userSite);

  function run(action: () => void) {
    try {
      action();
      onChanged?.();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "The transfer could not be updated.");
    }
  }

  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-gray-950">{transfer.transferNumber}</h2>
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${style.cls}`}>{style.icon}{transfer.status}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">Requested {formatDateTime(transfer.requestedAt)} • {transfer.requestedBy}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
          <p className="text-2xl font-bold text-gray-950">{formatQuantity(transfer.quantity)}</p>
          <p className="text-sm text-gray-500">{transfer.inventoryUnit}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-5">
        <p className="text-lg font-bold text-gray-950">{transfer.productName}</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1 rounded-xl bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">From</p><p className="mt-1 font-bold text-gray-950">{transfer.fromSiteName}</p></div>
          <ArrowRight className="mx-auto shrink-0 text-violet-800" size={24} />
          <div className="flex-1 rounded-xl bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">To</p><p className="mt-1 font-bold text-gray-950">{transfer.toSiteName}</p></div>
        </div>
      </div>

      {(transfer.dispatchedAt || transfer.receivedAt) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-3 text-sm"><span className="font-semibold">Dispatched:</span> {transfer.dispatchedBy || "—"}<br/><span className="text-gray-500">{formatDateTime(transfer.dispatchedAt)}</span></div>
          <div className="rounded-xl border border-gray-200 p-3 text-sm"><span className="font-semibold">Received:</span> {transfer.receivedBy || "—"}<br/><span className="text-gray-500">{formatDateTime(transfer.receivedAt)}</span></div>
        </div>
      )}

      {transfer.reason && <div className="mt-4 rounded-2xl border border-gray-200 p-4"><p className="text-sm text-gray-500">Reason</p><p className="mt-1 text-sm font-semibold text-gray-900">{transfer.reason}</p></div>}

      {(canDispatch || canReceive || canCancel) && (
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t pt-5">
          {canCancel && <button type="button" onClick={() => run(() => cancelTransfer(transfer.id, currentUser?.name))} className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-slate-50">Cancel</button>}
          {canDispatch && <button type="button" onClick={() => run(() => dispatchTransfer(transfer.id, currentUser?.name))} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"><Truck size={17}/> Dispatch</button>}
          {canReceive && <button type="button" onClick={() => run(() => receiveTransfer(transfer.id, currentUser?.name))} className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-4 py-2 font-semibold text-white hover:bg-violet-900"><PackageCheck size={17}/> Receive</button>}
        </div>
      )}
    </article>
  );
}
