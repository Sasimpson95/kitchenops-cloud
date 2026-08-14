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
