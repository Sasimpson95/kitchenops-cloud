# KitchenOps Shared Device Mode

This release adds:

- Remembered business, site and staff member on each kitchen device
- Fast PIN re-entry without retyping the business code
- Switch User button for Managers and Chefs
- Staff identity card in the desktop and mobile navigation
- Clear remembered-device option on the login screen
- Existing Operations login unchanged

No new Supabase migration is required.

## Test

1. Log in as a Chef or Manager using Business Code, Site, Name and PIN.
2. Open the mobile or desktop menu.
3. Press Switch User.
4. KitchenOps should return to staff login with the business, site and previous name remembered.
5. Select another member of staff and enter their PIN.
6. Use "Use a different business" to clear the remembered device details.

The PIN is never stored in localStorage. Only business code, site and staff selection are remembered.
