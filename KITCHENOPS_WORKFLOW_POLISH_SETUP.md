# KitchenOps Workflow & Performance Polish

## Included
- Purple brand colour (success/warning/error colours remain available).
- Faster sidebar navigation using a cached session and prefetched links.
- Receive an invoice without a KitchenOps purchase order. The currently selected site is used automatically.
- Handover history: every Save creates a dated cloud snapshot.

## Required SQL
Run `supabase/migrations/008_workflow_polish.sql` in Supabase SQL Editor.

## Test
1. Open several sidebar pages: the full-screen session loader should no longer appear after the initial load.
2. Purchasing: select a site, click Receive Invoice, enter supplier/invoice/product lines and confirm stock increases.
3. Handover: save notes, then check Handover History.
4. Check desktop and mobile purple styling.
