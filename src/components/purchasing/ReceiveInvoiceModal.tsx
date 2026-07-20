"use client";

import { getActiveBusinessId } from "@/lib/businessWorkspace";
import { useMemo, useState } from "react";
import { Plus, ReceiptText, Trash2, X } from "lucide-react";
import { getActiveProducts } from "@/lib/productStore";
import { getActiveSuppliers } from "@/lib/supplierStore";
import { receiveProductStock } from "@/lib/inventoryStore";
import { saveReceivedInvoice, type InvoiceLine } from "@/lib/invoiceStore";

type Props={siteId:string;siteName:string;receivedBy:string;onClose:()=>void;onSaved:()=>void};
type DraftLine={key:string;productId:number;purchaseUnits:string;unitPrice:string};
const id=()=>typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`;
export default function ReceiveInvoiceModal({siteId,siteName,receivedBy,onClose,onSaved}:Props){
 const suppliers=getActiveSuppliers(); const products=getActiveProducts();
 const [supplierId,setSupplierId]=useState(suppliers[0]?.id??0); const [invoiceNumber,setInvoiceNumber]=useState(""); const [invoiceDate,setInvoiceDate]=useState(new Date().toISOString().slice(0,10)); const [lines,setLines]=useState<DraftLine[]>([{key:id(),productId:products[0]?.id??0,purchaseUnits:"1",unitPrice:""}]); const [saving,setSaving]=useState(false); const [error,setError]=useState("");
 const total=useMemo(()=>lines.reduce((sum,l)=>sum+(Number(l.purchaseUnits)||0)*(Number(l.unitPrice)||0),0),[lines]);
 function update(key:string,patch:Partial<DraftLine>){setLines(current=>current.map(line=>line.key===key?{...line,...patch}:line));}
 async function save(){
  if(saving)return; const supplier=suppliers.find(s=>s.id===supplierId); if(!supplier||!invoiceNumber.trim()){setError("Choose a supplier and enter the invoice number.");return;}
  const valid=lines.filter(l=>l.productId>0&&Number(l.purchaseUnits)>0&&Number(l.unitPrice)>=0); if(!valid.length){setError("Add at least one received product.");return;} setSaving(true);setError("");
  const invoiceLines:InvoiceLine[]=valid.map(l=>{const p=products.find(x=>x.id===l.productId)!;const q=Number(l.purchaseUnits);const price=Number(l.unitPrice);return{productId:p.id,productName:p.name,purchaseUnits:q,unitPrice:price,lineTotal:q*price};});
  try{ const response=await fetch("/api/cloud/invoices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({siteId,siteName,supplierId:supplier.id,supplierName:supplier.name,invoiceNumber:invoiceNumber.trim(),invoiceDate,total,receivedBy,lines:invoiceLines})}); const data=await response.json() as {id?:string;error?:string}; if(!response.ok||!data.id)throw new Error(data.error??"Invoice could not be received.");
   invoiceLines.forEach(line=>receiveProductStock({businessId:getActiveBusinessId(),siteId,productId:line.productId,productName:line.productName,quantity:line.purchaseUnits,referenceId:data.id!,referenceNumber:`Invoice ${invoiceNumber.trim()}`}));
   saveReceivedInvoice({id:data.id,siteId,siteName,supplierId:supplier.id,supplierName:supplier.name,invoiceNumber:invoiceNumber.trim(),invoiceDate,lines:invoiceLines,total,receivedBy,createdAt:new Date().toISOString()}); onSaved(); onClose();
  }catch(e){setError(e instanceof Error?e.message:"Invoice could not be received.");setSaving(false);}
 }
 return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3"><section className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7" onClick={e=>e.stopPropagation()}>
  <div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-violet-800">Purchasing • {siteName}</p><h2 className="mt-1 text-3xl font-bold">Receive invoice</h2><p className="mt-2 text-gray-500">For deliveries that were not ordered through KitchenOps.</p></div><button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100"><X/></button></div>
  <div className="mt-6 grid gap-4 sm:grid-cols-3"><label className="sm:col-span-1"><span className="text-sm font-semibold">Supplier</span><select value={supplierId} onChange={e=>setSupplierId(Number(e.target.value))} className="mt-2 w-full rounded-xl border px-4 py-3">{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label><span className="text-sm font-semibold">Invoice number</span><input value={invoiceNumber} onChange={e=>setInvoiceNumber(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"/></label><label><span className="text-sm font-semibold">Invoice date</span><input type="date" value={invoiceDate} onChange={e=>setInvoiceDate(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"/></label></div>
  <div className="mt-7 space-y-3"><div className="flex items-center justify-between"><h3 className="text-xl font-bold">Products received</h3><button onClick={()=>setLines(c=>[...c,{key:id(),productId:products[0]?.id??0,purchaseUnits:"1",unitPrice:""}])} className="inline-flex items-center gap-2 rounded-xl border border-violet-800 px-4 py-2 font-semibold text-violet-800"><Plus size={18}/>Add product</button></div>{lines.map(line=><div key={line.key} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_150px_150px_44px]"><select value={line.productId} onChange={e=>update(line.key,{productId:Number(e.target.value)})} className="rounded-xl border bg-white px-3 py-3">{products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.orderUnit})</option>)}</select><input type="number" min="0" step="0.01" value={line.purchaseUnits} onChange={e=>update(line.key,{purchaseUnits:e.target.value})} placeholder="Purchase units" className="rounded-xl border px-3 py-3"/><input type="number" min="0" step="0.01" value={line.unitPrice} onChange={e=>update(line.key,{unitPrice:e.target.value})} placeholder="Price per unit" className="rounded-xl border px-3 py-3"/><button onClick={()=>setLines(c=>c.filter(x=>x.key!==line.key))} className="flex h-11 w-11 items-center justify-center rounded-xl text-red-700 hover:bg-red-50"><Trash2 size={18}/></button></div>)}</div>
  {error&&<p className="mt-5 rounded-xl bg-red-50 p-4 font-semibold text-red-700">{error}</p>}<div className="mt-7 flex flex-col items-stretch justify-between gap-4 border-t pt-5 sm:flex-row sm:items-center"><div><p className="text-sm text-gray-500">Invoice total</p><p className="text-3xl font-bold">£{total.toFixed(2)}</p></div><button disabled={saving} onClick={save} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900 disabled:opacity-50"><ReceiptText size={19}/>{saving?"Receiving…":"Receive invoice"}</button></div>
 </section></div>;
}
