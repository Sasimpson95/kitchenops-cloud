# KitchenOps v0.9.7 — Simple Handover

Handover is deliberately simple in this release:

- Managers/Operations write tomorrow's notes.
- Today's handover is read-only and is what the kitchen team sees.
- On a new calendar day, yesterday's Tomorrow notes automatically become Today's Handover.
- Tomorrow is then cleared ready for the next manager handover.
- Previous saved handovers remain available in Handover History.
- Chef users cannot edit tomorrow's handover.
- The dashboard/home screen shows Today's Handover only.
- Handover browser state and its rollover date remain separated by business.

No Supabase migration is required for this release.
