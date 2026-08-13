# KitchenOps 1.0.0 RC12 — Chef Notification Reliability

Fixes:
- KOPS-RC-029: Chef can open Notification Centre instead of being redirected to Dashboard.
- KOPS-RC-030: Notification badge/list refreshes from live cloud operational and inventory state.
- Uses the authenticated staff site UUID for stock/order/waste/stocktake notification filtering.
- Adds a lightweight inventory-stock GET refresh and 3-second polling on Dashboard/Notification Centre.
- Notification links that target manager-only workflows fall back safely to Home for Chef accounts.

No Supabase migration is required.
