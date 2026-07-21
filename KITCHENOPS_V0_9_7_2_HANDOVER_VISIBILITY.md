# KitchenOps v0.9.7.2 - Manager-controlled Chef Handover Visibility

## Behaviour

- Managers and Operations always see handovers for their sites.
- Tomorrow's Handover includes a `Visible to chefs` checkbox.
- The checkbox is off by default.
- When tomorrow rolls into today, the visibility choice rolls over with the notes.
- Chefs only see the Handover navigation item and dashboard card when today's handover has notes and was explicitly shared with chefs.
- Chefs cannot edit handovers and cannot see handover history.
- Existing handovers default to manager-only unless they were saved with chef visibility enabled.

## Database migration

Run `supabase/migrations/010_handover_chef_visibility.sql` in Supabase SQL Editor before deploying this version.
