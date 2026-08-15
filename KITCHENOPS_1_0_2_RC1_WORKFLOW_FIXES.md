# KitchenOps 1.0.2 RC1 — Workflow Fixes

## KOPS-1.0.2-001
Today prep completion was available from Dashboard but not from the Prep page.

## KOPS-1.0.2-002
Outstanding prep notifications opened the Prep Planner on Tomorrow for manager accounts.

## KOPS-1.0.2-003
Existing recipes / finished menu items could change ingredient amounts but could not add or remove product ingredients or preparation components.

## RC1 behaviour
- Today planned prep shows Complete Prep in the Prep page.
- Chef completion submits for manager approval; manager completion approves directly, consistent with Dashboard.
- Prep outstanding links use `/production?day=today`, and the planner honours the requested day.
- Recipe edit supports add/remove/change product ingredients.
- Recipe edit supports add/remove preparation components and uses each preparation's configured yield unit for costing.

No database migration is required.
