# KitchenOps 1.0.6 RC2 — Trial Signup Emails

When a new business successfully starts its 30-day trial, KitchenOps now sends two server-side emails through Resend:

1. Internal notification to `hello@kitchenops.co.uk` by default.
2. Welcome/trial confirmation to the Operations signup email.

The signup itself is never failed if Resend is temporarily unavailable; email delivery is best-effort after the business RPC succeeds.

## Existing Vercel variables reused
- `RESEND_API_KEY`
- `KITCHENOPS_ORDER_FROM_EMAIL`

No new environment variables are required if those already exist.

## Optional variables
- `KITCHENOPS_SIGNUP_FROM_EMAIL` — separate sender for signup/welcome emails.
- `KITCHENOPS_SIGNUP_NOTIFY_EMAIL` — internal notification recipient. Defaults to `hello@kitchenops.co.uk`.

## Test
1. Start the app locally or deploy RC2.
2. Create a brand-new trial business from `/cloud-onboarding`.
3. Confirm the new workspace opens normally.
4. Confirm `hello@kitchenops.co.uk` receives `New KitchenOps trial signup — <business>`.
5. Confirm the signup email receives `Welcome to KitchenOps — your 30-day trial has started`.
6. Retry/refreshing must not create duplicate emails for the same business because Resend idempotency keys are business-specific.
