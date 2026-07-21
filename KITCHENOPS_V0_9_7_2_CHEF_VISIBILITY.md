# KitchenOps v0.9.7.2 — Manager-controlled chef handover visibility

## What changed
- Tomorrow's Handover now has a **Visible to chefs** checkbox.
- The checkbox defaults to **off**.
- When tomorrow rolls into today, the visibility choice rolls over with the notes.
- Managers and Operations always see handovers.
- Chefs only see the Handover navigation item, dashboard card, and handover notes when the manager enabled **Visible to chefs**.
- Handover History shows a **Shared with chefs** badge when applicable.

## Supabase migration
Run `supabase/migrations/010_handover_chef_visibility.sql` once before using this version live.
