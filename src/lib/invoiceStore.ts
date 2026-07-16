export type InvoiceLine = {
  productId: number; productName: string; purchaseUnits: number; unitPrice: number; lineTotal: number;
};
export type ReceivedInvoice = {
  id: string; siteId: string; siteName: string; supplierId: number; supplierName: string; invoiceNumber: string; invoiceDate: string; lines: InvoiceLine[]; total: number; receivedBy: string; createdAt: string;
};
const KEY = "kitchenops-received-invoices";
const EVENT = "kitchenops-invoices-changed";
export function getReceivedInvoices(): ReceivedInvoice[] {
  if (typeof window === "undefined") return [];
  try { const value=JSON.parse(localStorage.getItem(KEY) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
}
export function saveReceivedInvoice(invoice: ReceivedInvoice): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify([invoice, ...getReceivedInvoices()]));
  window.dispatchEvent(new CustomEvent(EVENT));
}
export function subscribeToInvoiceChanges(callback:()=>void):()=>void {
  if (typeof window === "undefined") return () => undefined;
  const local=()=>callback(); const storage=(e:StorageEvent)=>{ if(e.key===KEY) callback(); };
  window.addEventListener(EVENT,local); window.addEventListener("storage",storage);
  return ()=>{ window.removeEventListener(EVENT,local); window.removeEventListener("storage",storage); };
}
