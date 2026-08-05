# KitchenOps RC-003 — Login First Impression

## Changes

- Reworked desktop login into a polished split-screen product experience.
- Added a framed KitchenOps dashboard preview using the supplied example.
- Replaced the generic headline with “Run your kitchen with confidence.”
- Added provider trust points: multi-site ready, cloud synchronised, and built for hospitality.
- Added “by Simpson Software” branding.
- Added a branded session-loading screen.
- Added a compact mobile login header and an expandable “See KitchenOps in action” preview.
- Preserved all Operations and Manager/Chef login behaviour.

## Validation

Run:

```powershell
npm install
npm run typecheck
npm run build
npm run dev -- -p 3001
```

Test the login at desktop and mobile widths, including Operations and Manager/Chef modes.
