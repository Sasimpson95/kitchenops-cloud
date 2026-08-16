import type { PurchaseOrder } from "@/data/orders";

type OrderEmailResponse = {
  sent?: boolean;
  emailId?: string;
  recipient?: string;
  error?: string;
};

export async function sendPurchaseOrderEmail(
  order: PurchaseOrder
): Promise<OrderEmailResponse> {
  const response = await fetch("/api/orders/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(order),
  });

  const raw = await response.text();

  let payload: OrderEmailResponse = {};

  try {
    payload = raw
      ? (JSON.parse(raw) as OrderEmailResponse)
      : {};
  } catch {
    payload = {};
  }

  if (!response.ok || !payload.sent) {
    throw new Error(
      payload.error ||
        "The supplier email could not be sent."
    );
  }

  return payload;
}
