# KitchenOps Cloud — Sprint 1 Business Foundation

This update adds:

- Cloud Business Settings page
- Editable business name
- Visible/copyable Business Code
- Active site, staff and Operations counts
- Operations user list
- Business creation date
- Business Code card on the Users page
- Last login, created date and PIN status on staff cards
- Safer staff-login API error handling

## Install

1. Extract this ZIP into a new folder.
2. Copy your working `.env.local` into the new folder.
3. Ensure every environment variable is on its own line.
4. Run:

```powershell
npm install
npm run typecheck
npm run build
npm run dev
```

## Test

1. Log in as Operations.
2. Open Settings.
3. Confirm the Business Code is visible and copies.
4. Rename the business and save it.
5. Open Users.
6. Confirm the Business Code card appears.
7. Create, disable and reset the PIN for a test staff user.
8. Log out and verify the staff PIN login still works.

No additional SQL migration is required for this sprint.
