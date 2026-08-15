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

