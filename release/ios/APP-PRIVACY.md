# KitchenOps — Apple App Privacy Worksheet

## App
KitchenOps

## Bundle ID
com.kitchenops.app

## Privacy Policy
https://kitchenops.co.uk/privacy

---

# 1. Does KitchenOps collect data?

YES

KitchenOps is a cloud-based business application and user/business information is stored to provide the service.

Exact Apple privacy declarations must be confirmed before App Store submission.

---

# 2. Account Information

Potentially collected:

- Name
- Email address
- Account / user ID
- Business name
- Site information
- User role / permissions

Purpose:

- Account creation
- Authentication
- Providing KitchenOps functionality
- Managing businesses, sites and users

Tracking:
NO — unless this changes before release.

---

# 3. User Content

KitchenOps may contain user-created operational information including:

- Prep records
- Handovers
- Waste records
- Stocktake information
- Supplier information
- Product information
- Recipe information
- Purchasing / receiving records

Purpose:

- Core app functionality

Tracking:
NO

---

# 4. Purchases / Billing

To confirm when Stripe subscriptions are implemented.

Potentially:

- Subscription status
- Billing/customer identifiers

KitchenOps should not store full payment card details itself.

Payment processing provider:
Stripe — planned / to confirm before submission.

---

# 5. Usage Data / Analytics

CURRENT STATUS:
TO CONFIRM

Before submission check whether KitchenOps uses:

- Google Analytics
- Vercel Analytics
- Supabase telemetry exposed to the application
- Sentry
- PostHog
- Microsoft Clarity
- Meta Pixel
- Google Ads conversion tracking
- Any other analytics or advertising SDK

Do not declare analytics/tracking until the production implementation is confirmed.

---

# 6. Diagnostics

TO CONFIRM

Check whether the production app collects:

- Crash data
- Performance data
- Error logs
- Device information

---

# 7. Location

Expected:
NO precise location collection.

Confirm before submission.

---

# 8. Contacts

Expected:
NO access to the user's device contacts.

Confirm before submission.

---

# 9. Photos / Camera

TO CONFIRM

Check whether any KitchenOps feature allows:

- photo upload
- camera capture
- image attachments

If yes, determine exactly what Apple declaration is required.

---

# 10. Sensitive Information

KitchenOps should not intentionally collect:

- Health information
- Racial or ethnic information
- Religious beliefs
- Political opinions
- Sexual orientation
- Biometric information

Confirm before submission.

---

# 11. Tracking

Expected answer:

NO

KitchenOps should not track users across apps or websites owned by other companies for advertising purposes.

This must be checked again before App Store submission.

---

# 12. Advertising

Current expectation:

- No third-party advertising inside KitchenOps
- No advertising SDK inside the iOS app

External advertising used to promote KitchenOps does not automatically mean the app itself performs tracking.

Confirm once advertising/conversion tracking is configured.

---

# 13. Account Creation

YES

Users can create/use KitchenOps accounts.

---

# 14. Account Deletion

IMPORTANT APP STORE CHECK

Before submission confirm that users can initiate deletion of their KitchenOps account from within the app where Apple requires it.

Current website deletion information:
https://kitchenops.co.uk/delete-account

We must test the complete deletion workflow before App Store submission.

---

# 15. Login

Login required:
YES

Authentication provider:
TO CONFIRM / Supabase authentication implementation.

Reviewer credentials will be created specifically for Apple App Review.

---

# 16. Third-Party Services — Final Audit

Before submission inspect the production project and document every third-party service.

Known / expected services:

- Supabase
- Vercel
- Resend
- Stripe — planned

For each service confirm:

- What information is sent
- Why it is sent
- Whether it is linked to the user
- Whether it is used for tracking
- Retention / deletion behaviour

---

# FINAL PRIVACY CHECK BEFORE SUBMISSION

Do not complete Apple's App Privacy questionnaire from memory.

Before submission:

1. Audit the production source code.
2. Audit installed packages.
3. Check all third-party services.
4. Compare findings against the current Apple App Privacy questionnaire.
5. Update the KitchenOps privacy policy if required.
6. Confirm account deletion works.
7. Complete App Store Connect privacy declarations.