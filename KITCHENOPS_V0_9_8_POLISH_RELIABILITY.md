# KitchenOps v0.9.8 — Polish & Reliability

This pre-v1.0 quality release focuses on day-to-day reliability rather than adding another large module.

## Included
- Remembers the Operations user's last selected site on Inventory, Waste, Stocktakes, Purchasing and Reports.
- Site preferences are scoped by KitchenOps business so one company does not inherit another company's selected site.
- Invalid or deleted remembered sites safely fall back to All Sites.
- Improved mobile page padding on high-use operational screens.
- 16px mobile form controls to reduce mobile browser zoom issues.
- Consistent keyboard focus treatment for interactive controls.
- KitchenOps v0.9.8 version shown in Settings and the desktop app shell.
- Stronger business-code validation during onboarding.
- Onboarding can recover from a previous failed setup that created the Supabase Auth user but not the business: if the account already exists and the password is correct, KitchenOps signs into it and retries business creation.
- Existing double-submit protection remains in onboarding.

## No database migration
No new SQL migration is required for v0.9.8.
