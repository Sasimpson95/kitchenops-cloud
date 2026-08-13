# KitchenOps 1.0.0 RC14

## KOPS-RC-032 — First-login and reset-PIN security

- New Manager/Chef accounts already receive `must_change_pin = true`; RC14 now enforces it at login.
- Temporary-PIN sign-in redirects to `/set-pin` before any protected KitchenOps workflow is available.
- Staff must enter and confirm a new four-digit PIN.
- The permanent PIN cannot be the same as the temporary PIN.
- Manager Reset PIN now generates a temporary PIN, copies/displays it once, and sets the account back to first-login mode.
- Resetting a PIN invalidates any older staff session so the temporary PIN must actually be used.
- No unrelated workflow changes.

## Database

Apply migration `014_staff_pin_first_login.sql` before testing RC14.
