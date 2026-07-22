# KitchenOps Android Preview 2

This release is a mobile polish build based on KitchenOps v0.9.8.1.

## Included

- Full-screen recipe creation and editing on phones.
- Android back-button support for closing supported dialogs and navigating back.
- Offline connection screen once KitchenOps has loaded.
- Safe-area support for Android status/navigation areas.
- Overscroll/pull-to-refresh suppression.
- Larger mobile touch targets.
- Native status-bar and splash-screen handling.
- Android version name `1.0.0-preview2`, version code `1`.
- Live URL set to `https://kitchenops-cloud.vercel.app/login`.

## Required workflow

The web changes must be copied into the GitHub-connected KitchenOps project and deployed to Vercel. Then run `npm run android:sync` in this Android project so the native configuration is refreshed.

No Supabase migration is required.
