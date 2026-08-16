## 1.0.4-rc1 — Supplier order email

- Purchase Order Send now actually emails the supplier.
- Orders remain Draft if the supplier email fails.
- Supplier/site/business recipients are validated server-side.
- Existing Draft orders use the same email send workflow.

# KitchenOps 1.0.3 RC1 — New Business Workspace Isolation

## KOPS-1.0.3-001
Fixed a new-business onboarding issue where stale browser operational records could be retried before the business had created its first site.

### Changes
- Zero-site businesses now start with a clean scoped browser workspace.
- Operational and inventory sync do not run until the first valid site exists.
- Stale operational pending writes for a zero-site business are cleared.
- The legacy browser-to-cloud operational migration is marked complete for new zero-site workspaces so creating the first site cannot import records from another account.
- Invalid-site operational records are treated as permanent stale local writes instead of being retried forever.
- Normal cloud records for existing businesses are not deleted.



## KitchenOps 1.0.2 RC2

- Fixed Today Prep deep links being rejected when they include `?day=today`.
- Prep navigation now opens Today by default for managers and operations users.
- Finished menu items no longer appear in the Add to Prep recipe picker; only active Preparation / Component recipes are eligible.

# KitchenOps 1.0.2 RC1

Focused workflow fixes discovered during post-release testing.

- Today's Prep can now be completed directly from the Prep page, matching the Dashboard workflow. Chefs submit for approval; managers can complete directly.
- Outstanding Prep notifications now open Today's Prep instead of defaulting managers to Tomorrow.
- Recipe editing now supports adding, removing and changing product ingredients.
- Finished Menu Items can add/remove Preparation / Component recipes, allowing dishes such as Four Fluffy Pancakes to consume a yielded preparation such as Pancake Wetmix.
- No database migration required.

# KitchenOps 1.0.1 RC2

Navigation smoothness follow-up for the 1.0.1 performance pass.

- Protected pages now reuse an already-authorised runtime on their very first render, removing the brief `Opening KitchenOps…` flash between normal in-app pages.
- Cold launch, identity changes, first-login PIN enforcement and role boundaries still require authoritative validation.
- Page entrance motion was simplified to a short opacity fade so route changes no longer visually jump downward before settling.
- No operational workflow or cloud data behaviour changed.

# KitchenOps 1.0.0 RC9

Multi-unit stocktake prototype for local UX testing.

- Converted products can be counted using both the purchase/count unit and the base inventory unit on the same screen.
- Example: Eggs can be entered as `1 Case` plus `24 Each`.
- Example: Milk can be entered as `1.5 Bottles` and KitchenOps shows the resulting litres.
- Count-unit arrow controls step by one while manually typed decimal quantities remain accepted.
- `Each` inventory quantities require whole numbers.
- All entered quantities are aggregated back to the inventory unit for stocktake maths and valuation.

RC9 deliberately uses the two unit levels already present in the KitchenOps product model. An additional outer/case level (for example Bottle + Case of 6 Bottles) needs a new product setup field and is not invented in this prototype.
