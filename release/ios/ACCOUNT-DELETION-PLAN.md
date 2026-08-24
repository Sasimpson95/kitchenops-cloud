# KitchenOps — Account Deletion Plan

## Apple Requirement

KitchenOps supports account creation.

Apple therefore requires users to be able to initiate deletion of their account from within the app.

The option must be easy to find.

Temporary deactivation alone is not sufficient.

If deletion is completed on the KitchenOps website, the app must provide a direct link to the actual deletion page/process.

---

# Current KitchenOps Status

Account creation:
YES

Authentication:
YES

In-app account deletion:
NOT CURRENTLY IMPLEMENTED

Website deletion information:
https://kitchenops.co.uk/delete-account

The current implementation must be checked to confirm whether this page actually initiates account deletion or only provides instructions.

---

# Recommended KitchenOps Design

Add:

Settings
→ Account & Privacy
→ Delete Account

The Delete Account page should clearly explain:

- the account will be permanently deleted
- personal account information will be deleted where legally possible
- some business records may need to be retained where legally required
- deletion may affect access to the KitchenOps business
- subscription cancellation is separate if applicable

---

# Important Business Account Distinction

KitchenOps contains:

1. Individual user accounts
2. Business accounts
3. Sites
4. Operational business data

Deleting an individual user account must NOT automatically delete an entire business and its operational data.

We need separate concepts:

## Delete My Account

Deletes/removes the individual user's KitchenOps account.

For ordinary Managers/Chefs:
- remove user access
- delete personal account data where appropriate
- retain business operational records where required
- anonymise historical audit attribution where appropriate

## Delete Business

This should be a separate owner/admin-only process.

It must not happen accidentally when an individual user deletes their login.

---

# Proposed User Flow

Settings
→ Account & Privacy
→ Delete Account

Page displays warning.

User presses:

Delete my account

Then require confirmation.

Suggested confirmation:

Type:

DELETE

Then press:

Permanently delete my account

---

# Security

Before accepting deletion:

- confirm user is authenticated
- confirm user identity
- consider reauthentication for owner/admin accounts
- prevent one user deleting another user's account
- perform deletion server-side
- never expose Supabase service-role credentials to the client

---

# Business Owner Behaviour

If the user is the sole owner/admin of a KitchenOps business:

Do not immediately delete the business automatically.

Instead explain that they must:

- transfer ownership
OR
- separately request deletion of the business

Exact owner logic must be decided before implementation.

---

# Supabase

Before implementation audit:

- Supabase Auth user record
- KitchenOps user/profile tables
- business membership tables
- audit logs
- user-created operational records
- foreign keys
- retention requirements

Deletion must not break historical business records or database relationships.

---

# Subscription

Once Stripe is implemented:

Deleting a KitchenOps login must not silently leave the customer paying without explanation.

The deletion screen should explain what happens to:

- active subscription
- billing
- business access
- retained data

Exact behaviour must be finalised alongside Stripe.

---

# Apple Review Requirement

Before submission verify:

- [ ] Delete Account is visible inside KitchenOps
- [ ] User does not need to email support
- [ ] User does not need to phone Simpson Software
- [ ] Flow genuinely initiates deletion
- [ ] Confirmation protects against accidental deletion
- [ ] Individual deletion does not accidentally destroy business data
- [ ] Owner/business deletion behaviour is defined
- [ ] Subscription implications are explained
- [ ] Deleted user can no longer log in
- [ ] Relevant personal data is removed/anonymised
- [ ] Privacy Policy describes account deletion accurately
- [ ] Website deletion page matches the implemented process