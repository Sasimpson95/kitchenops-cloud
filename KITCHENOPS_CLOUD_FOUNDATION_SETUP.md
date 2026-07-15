# KitchenOps Cloud Foundation

This build includes:
- Operations email/password login
- New-business onboarding
- Cloud-protected pages
- Cloud logout
- Operations Sites page
- Operations Users page
- Manager/Chef Business Code + Name + PIN login
- Signed HTTP-only staff sessions
- Multi-business RLS foundation

## 1. Environment
Copy `.env.example` to `.env.local` and add the real Supabase values.
Never share or commit `.env.local`.

## 2. Database
Run these files in Supabase SQL Editor in order if they have not already been run:
1. `001_core_tables.sql`
2. `002_security_functions.sql`
3. `003_rls_policies.sql`
4. `004_staff_pin_login.sql`

Migration 004 is new and is required for Manager/Chef PIN login.

## 3. Install and check
```powershell
npm install
npm run typecheck
npm run build
npm run dev
```

## 4. Test
1. Open `/cloud-onboarding` and create a new business.
2. Open `/sites` and create the remaining sites.
3. Open `/users` and create Manager/Chef accounts with temporary four-digit PINs.
4. Log out.
5. Select Manager / Chef on `/login`, enter the Business Code, choose Site and Name, then enter PIN.

## Current data status
Authentication, businesses, sites and users are cloud-backed.
The existing operational modules still use their current browser stores until they are migrated one at a time.
