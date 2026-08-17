# KitchenOps 1.0.4 RC2 — Order Site Clarity

## KOPS-1.0.4-002
Supplier purchase-order emails did not make the delivery destination prominent enough for multi-site customers.

## Changes
- Email subject: `Purchase Order <number> — <site> — <business>`
- Purple purchase-order header now shows:
  - Business
  - Delivery site
  - Requested delivery
- Plain-text fallback mirrors the same information.
- Existing supplier-email sending, validation, idempotency and status transitions are unchanged.

No database migration required.
