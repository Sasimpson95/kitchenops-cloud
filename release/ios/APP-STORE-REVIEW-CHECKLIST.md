# KitchenOps — App Store Review & Compliance Checklist

## App
KitchenOps

## Bundle ID
com.kitchenops.app

---

# 1. Age Rating

Expected rating:
4+

Reason:
KitchenOps is a business operations app for hospitality teams.

Expected content:
- No violence
- No sexual content
- No gambling
- No drugs
- No horror/fear content
- No profanity as part of the app itself
- No user-to-user social network
- No unrestricted web browsing

Final rating must be completed using Apple's current App Store Connect age rating questionnaire.

---

# 2. App Purpose

KitchenOps is business software for restaurants, cafés and hospitality groups.

Core functions include:

- Prep planning
- Stock and inventory
- Purchasing and receiving
- Stocktakes
- Waste tracking
- Recipes and costing
- Kitchen handovers
- Multi-site management
- Team roles and permissions

---

# 3. Login Requirement

Login required:
YES

Apple App Review must be given a working reviewer account.

Before submission create:

Email:
TO CREATE

Password:
TO CREATE

Business:
Demo KitchenOps business

Site:
Site One

The review account must contain enough demo data to show the main app functionality.

---

# 4. Reviewer Access

Reviewer should be able to access:

- Dashboard
- Prep Planner
- Recipes
- Products
- Inventory
- Purchasing
- Waste
- Stocktakes
- Handover
- Suppliers
- Users
- Settings

Do not give Apple an empty account.

---

# 5. Review Notes

Suggested review notes:

KitchenOps is a cloud-based hospitality operations platform.

A reviewer account is provided because authentication is required to access the application.

The review account contains representative demo data so the core workflows can be tested.

KitchenOps requires an internet connection because operational data is securely stored in the cloud.

No physical goods are purchased through the app.

---

# 6. Payments and Subscriptions

IMPORTANT — FINAL DECISION REQUIRED BEFORE SUBMISSION

KitchenOps plans to operate as a paid SaaS product.

Before App Store submission confirm how subscriptions are purchased.

Potential structure:

- Customers create/manage their subscription on the KitchenOps website
- iOS app is used to access an existing KitchenOps business account

Apple's current App Store rules must be reviewed before submission to determine whether the implementation requires:
- Apple In-App Purchase
- an external purchase entitlement
- no purchase functionality inside the app
- other permitted SaaS/business-app treatment

Do not add subscription purchase links to the iOS app until this has been confirmed.

---

# 7. Trial

KitchenOps currently offers:

30-day free trial
No card required

Before submission confirm:

- Trial signup works on iOS
- Trial expiry behaviour works
- Expired users are shown an appropriate access message
- No prohibited payment-link behaviour appears in the native iOS app

---

# 8. Account Deletion

REQUIRED CHECK BEFORE SUBMISSION

Because users can create accounts, verify Apple's current account-deletion requirement.

Confirm users can initiate deletion from within the app if required.

Deletion must clearly explain:

- what will be deleted
- whether deletion is immediate or scheduled
- what business/customer records must be legally retained
- how cancellation works

Website information:
https://kitchenops.co.uk/delete-account

---

# 9. Privacy Policy

Required URL:

https://kitchenops.co.uk/privacy

Before submission verify:

- URL loads publicly
- page works on mobile
- policy reflects actual production data processing
- third-party processors are accurate
- deletion/contact information is accurate

---

# 10. Support

Support URL:

https://kitchenops.co.uk/contact

Support email should be visible and working.

Confirm before submission.

---

# 11. Native App Behaviour

Before review test:

- Launch
- Splash screen
- Login
- Logout
- Session persistence
- Back navigation
- External links
- Keyboard behaviour
- Status bar
- Safe areas / notch
- Rotation behaviour
- Network failure behaviour
- Loading states
- Authentication expiry
- Trial expiry
- Subscription expiry
- Account deletion
- App resume after backgrounding

---

# 12. iPhone Testing

Test on at least:

- Current supported iPhone size
- Smaller iPhone screen
- Large iPhone screen

Check:

- No clipped text
- No horizontal scrolling
- Buttons are tappable
- Forms work
- Modals fit the screen
- Navigation remains usable
- Tables/lists work on mobile

---

# 13. iPad

Decision required before submission:

- Support iPad
OR
- iPhone only

If KitchenOps supports iPad, test layouts properly before submission.

Do not claim iPad support purely because the app technically launches.

---

# 14. Permissions

Expected permissions:
Minimal

Before submission inspect the generated iOS project for:

- Camera
- Photos
- Location
- Microphone
- Contacts
- Notifications

Only request permissions actually required by KitchenOps.

Any permission request must include a clear usage description.

---

# 15. External Links

Audit all links inside KitchenOps.

Check:

- Privacy
- Contact/support
- Website
- Subscription/billing
- Supplier URLs
- Any user-entered links

External links must not create an App Review problem.

---

# 16. Demo Data

Create clean demo data for Apple review.

Suggested business:
KitchenOps Demo

Suggested site:
Site One

Suggested products:
- Bacon
- Mushrooms
- Pancake Mix
- Brownies
- Tomato Relish
- BBQ Sauce

Include examples of:

- Planned prep
- Prep in progress
- Completed prep
- Supplier order
- Inventory movement
- Waste entry
- Stocktake
- Recipe
- Handover

Do not use real customer or employee information.

---

# 17. App Stability

Before submission run:

- npm run typecheck
- npm run build
- npm audit --omit=dev
- npm run android:check
- git diff --check

When the iOS platform exists also run:

- Capacitor iOS sync
- Xcode build
- physical iPhone test
- TestFlight build test

---

# 18. Final App Review Checklist

Before pressing Submit for Review:

- [ ] Production build stable
- [ ] Reviewer login works
- [ ] Demo data present
- [ ] Privacy policy accurate
- [ ] Support URL works
- [ ] Account deletion compliant
- [ ] Subscription/payment approach confirmed
- [ ] App privacy questionnaire complete
- [ ] Age rating complete
- [ ] Screenshots uploaded
- [ ] App description final
- [ ] Keywords final
- [ ] App icon final
- [ ] No placeholder text
- [ ] No test credentials visible publicly
- [ ] iPhone testing complete
- [ ] TestFlight testing complete
- [ ] Apple review notes complete