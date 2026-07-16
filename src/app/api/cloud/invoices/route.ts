import { NextRequest, NextResponse } from "next/server";
import { getCloudRequestContext } from "@/lib/cloud/serverContext";
import { createAdminClient } from "@/lib/supabase/admin";

function error(message:string,status:number){ return NextResponse.json({error:message},{status}); }
export async function GET(request:NextRequest){
  try {
    const context=await getCloudRequestContext(); if(!context) return error("Authentication required.",401);
    const siteId=request.nextUrl.searchParams.get("siteId");
    const admin=createAdminClient(); let query=admin.from("received_invoices").select("id, site_id, site_name, supplier_id, supplier_name, invoice_number, invoice_date, total, received_by, created_at, received_invoice_lines(*)").eq("business_id",context.businessId).order("created_at",{ascending:false}).limit(100);
    if(context.role!=="operations" && context.siteId) query=query.eq("site_id",context.siteId); else if(siteId && siteId!=="all-sites") query=query.eq("site_id",siteId);
    const {data,error:dbError}=await query; if(dbError) return error(dbError.message,500); return NextResponse.json({invoices:data??[]});
  } catch(e){ return error(e instanceof Error?e.message:"Invoices could not be loaded.",500); }
}
export async function POST(request:NextRequest){
  try {
    const context=await getCloudRequestContext(); if(!context) return error("Authentication required.",401);
    const body=await request.json() as {siteId?:string;siteName?:string;supplierId?:number;supplierName?:string;invoiceNumber?:string;invoiceDate?:string;total?:number;receivedBy?:string;lines?:Array<{productId:number;productName:string;purchaseUnits:number;unitPrice:number;lineTotal:number}>};
    const siteId=context.role==="operations"?body.siteId:context.siteId;
    if(!siteId || siteId==="all-sites") return error("Select a site before receiving an invoice.",400);
    if(!body.supplierName || !body.invoiceNumber || !body.invoiceDate || !body.lines?.length) return error("Complete the supplier, invoice details and product lines.",400);
    const admin=createAdminClient();
    const {data:invoice,error:invoiceError}=await admin.from("received_invoices").insert({business_id:context.businessId,site_id:siteId,site_name:body.siteName??siteId,supplier_id:body.supplierId??null,supplier_name:body.supplierName,invoice_number:body.invoiceNumber.trim(),invoice_date:body.invoiceDate,total:Number(body.total)||0,received_by:body.receivedBy??"KitchenOps"}).select("id").single();
    if(invoiceError||!invoice) return error(invoiceError?.message??"Invoice could not be created.",400);
    const rows=body.lines.map(line=>({invoice_id:invoice.id,product_legacy_id:line.productId,product_name:line.productName,purchase_units:line.purchaseUnits,unit_price:line.unitPrice,line_total:line.lineTotal}));
    const {error:lineError}=await admin.from("received_invoice_lines").insert(rows); if(lineError) return error(lineError.message,400);
    return NextResponse.json({success:true,id:invoice.id});
  } catch(e){ return error(e instanceof Error?e.message:"Invoice could not be received.",500); }
}
