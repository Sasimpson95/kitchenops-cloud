# KitchenOps 1.0.6 RC1 — Trial Entitlement Foundation

Fixes **KOPS-1.0.6-001**: a new business could previously be created from `/login` without any commercial trial entitlement.

## What changes

- Every newly created business now starts a **30-day trial server-side**.
- The onboarding screen clearly states **30-day free trial / no card required**.
- Existing businesses are grandfathered as `legacy` and are not locked by this migration.
- Session responses include authoritative subscription/trial state.
- Expired/cancelled/past-due workspaces are redirected to `/subscription-required`.
- Core cloud API context rejects an expired workspace, so hiding the UI is not the only protection.
- The user's business data is retained after trial expiry.

## Database migration

Apply:

`supabase/migrations/015_trial_entitlement_foundation.sql`

The migration adds:

- `businesses.subscription_status`
- `businesses.trial_started_at`
- `businesses.trial_ends_at`

and replaces `create_kitchenops_business` so clients cannot create an unrestricted new business by calling the existing RPC directly.

## Follow-up

Stripe Billing will map paid subscriptions to `subscription_status = 'active'` in the next commercial step.
