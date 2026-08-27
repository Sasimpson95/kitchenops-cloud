# KitchenOps Dark Mode — Phase 2 Dashboard Polish

This phase completes the first dashboard-specific dark-mode pass.

## Changes
- Added a dashboard scope class (`ko-dashboard-page`) so dashboard colour tuning stays isolated from the rest of the app.
- Converted blue dashboard cards to dark-compatible blue-tinted surfaces.
- Converted orange warning/attention cards to dark-compatible amber-tinted surfaces.
- Improved coloured text, borders and metric rings for dark mode.
- Preserved the existing light theme unchanged.
- Kept the existing Light / Dark / System preference behaviour from Phase 1.

## Test
1. Run `npm run typecheck`.
2. Run `npm run build`.
3. Run locally and choose Settings > Appearance > Dark.
4. Check Dashboard: Today's Snapshot, Needs Your Attention, Quick Actions, Prep, Handover, Recent Activity, Sites at a Glance and Edit Dashboard.
5. Switch back to Light and confirm the dashboard remains visually unchanged.
