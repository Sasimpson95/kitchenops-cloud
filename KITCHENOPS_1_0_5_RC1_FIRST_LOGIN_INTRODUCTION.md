# KitchenOps 1.0.5 RC1 — First-login introduction

## What changed

- New Operations users see a guided KitchenOps introduction after the first authenticated launch of a business on that device.
- The introduction explains the recommended setup order: Sites & Users → Products → Recipes & Prep → Purchasing & Stock → Daily Operations.
- Completing or closing the introduction records it for that business on the current device so normal logins are not interrupted.
- The Help Centre now includes **Replay introduction**, allowing Operations users to run the tour again at any time.
- The old pre-login, device-only welcome dialog has been removed from the root layout.

## Notes

- No database migration is required.
- Completion is stored locally per business and per device. A first login on a different device will show the introduction again, which is intentional for device onboarding.
- The guided introduction is restricted to the Operations role because it includes business setup, sites and user administration.

## Release metadata

- Web version: 1.0.5-rc1
- Android versionName: 1.0.5-rc1
- Android versionCode: 27
