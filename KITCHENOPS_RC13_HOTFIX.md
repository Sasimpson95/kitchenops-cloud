# KitchenOps 1.0.0 RC13 Hotfix

## KOPS-RC-031 — Chef Notification Centre crash

RC12 correctly refreshed Chef notifications and allowed the Notification Centre route, but the page conditionally called `useMemo` after the initial loading return. When the Chef session loaded, React saw more hooks than on the previous render and threw production error #310.

RC13 removes the conditional hook and calculates the notification list without changing hook order. RC12 notification refresh, role-safe links, and site-scoped notification behaviour are preserved.

No Supabase migration is required.
