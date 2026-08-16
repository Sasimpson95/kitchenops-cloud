# KitchenOps 1.0.4 RC1 — Supplier Order Email

## KOPS-1.0.4-001
Purchase Order "Send Order" previously only changed the local/cloud order status to Sent. No email provider or supplier-email API call existed.

## RC1 behaviour
- Supplier order emails are sent from a protected server route.
- The supplier recipient is taken from the authoritative supplier record for the signed-in business.
- Site and business ownership are validated server-side.
- Chef accounts cannot send purchasing emails.
- A new order is first stored as Draft.
- It becomes Sent only after the email provider confirms the message.
- If the email fails, the order remains Draft and KitchenOps clearly says it was not sent.
- Sending an existing Draft uses the same email workflow.
- Email requests use an idempotency key based on the order ID to reduce duplicate sends on retries.

## Required server environment
- `RESEND_API_KEY`
- `KITCHENOPS_ORDER_FROM_EMAIL`

Example sender after verifying your sending domain:
`KitchenOps Orders <orders@yourdomain.co.uk>`

## Test
1. Configure the two server environment variables.
2. Ensure the supplier has a valid email address.
3. Create and Send an order.
4. Confirm the supplier mailbox receives the order.
5. Confirm KitchenOps changes the order to Sent only after successful email.
6. Force an invalid/missing email and confirm the order stays Draft.
