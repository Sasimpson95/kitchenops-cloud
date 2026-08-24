# KitchenOps — iOS Technical Build Plan

## App
KitchenOps

## Bundle ID
com.kitchenops.app

## Current Setup
KitchenOps is built with Next.js and Capacitor.

Current Android package:
com.kitchenops.app

Current Capacitor app name:
KitchenOps

The iOS app should use the same bundle identifier and product name unless there is a specific reason to change them before submission.

---

# 1. Current Limitation

Development computer:
Windows

Mac available:
NO

Apple Developer account:
NOT YET CREATED

This means we can prepare the project on Windows, but we cannot complete the final iOS build/sign/upload process locally because Xcode requires macOS.

---

# 2. What We Can Do Now On Windows

Before paying for Apple Developer or accessing a Mac we can prepare:

- App Store metadata
- Privacy questionnaire
- Review checklist
- Screenshot plan
- Branding assets
- App icon master
- iOS configuration plan
- Production build checks
- Capacitor dependency plan
- TestFlight test plan
- Apple reviewer demo account plan

We should avoid adding or changing native iOS files until we have a reliable macOS build environment.

---

# 3. iOS Capacitor Package

The project currently has Capacitor Android installed.

Before the first iOS build we will add:

@capacitor/ios

The version should match the Capacitor core/CLI version in the project.

Do not install a random iOS version.

At the time of setup, check:

npm list @capacitor/core @capacitor/cli @capacitor/android

Then install the matching iOS package.

Example only:

npm install @capacitor/ios@<matching-version>

---

# 4. First iOS Platform Creation

Once macOS access is available:

npx cap add ios

Then:

npx cap sync ios

Then:

npx cap open ios

This creates and opens the native Xcode project.

Do not run these commands until we are ready for the macOS stage.

---

# 5. Production URL

The native shell should load the production KitchenOps HTTPS application.

Before iOS submission confirm the Capacitor server URL is the intended production URL.

Expected production app:

https://app.kitchenops.co.uk

Do not submit an App Store build pointing to:
- localhost
- preview deployments
- temporary Vercel URLs
- staging environments

---

# 6. Capacitor Configuration Audit

Before generating the iOS project verify:

- appId
- appName
- server.url
- cleartext setting
- splash screen
- status bar
- external navigation behaviour
- any plugins requiring iOS permissions

Expected:

appId:
com.kitchenops.app

appName:
KitchenOps

---

# 7. Mac Options

When KitchenOps is ready for iOS, choose ONE of the following.

## Option A — Borrow / Use A Mac

Good if we can access one temporarily.

Requirements:

- Recent supported macOS
- Xcode
- Node.js
- Git
- KitchenOps repository
- Apple Developer login

Advantages:

- Lowest cost if Mac is available
- Full Xcode control

Disadvantages:

- Need continued Mac access for later releases

---

## Option B — Buy A Mac mini

Good if KitchenOps becomes a long-term commercial product.

Advantages:

- Permanent build machine
- Full Xcode/TestFlight control
- Useful for all future Simpson Software iOS apps

Disadvantages:

- Higher upfront cost

Do not buy one solely to experiment with iOS.

---

## Option C — Hosted Mac

Possible providers may offer remote macOS machines.

Before choosing one confirm:

- Xcode version available
- Apple signing works
- Secure access
- Git access
- Build/upload capability
- Cost
- Data/privacy implications

Use only a reputable provider.

---

## Option D — CI / Cloud Build

Potentially use a service such as GitHub Actions or another macOS CI platform.

Possible workflow:

1. Push KitchenOps code to GitHub
2. CI runs on macOS
3. Install dependencies
4. Sync Capacitor iOS
5. Build/archive using Xcode
6. Sign build
7. Upload to TestFlight

This may reduce the need to own a Mac, but Apple certificates/signing still have to be configured properly.

A physical iPhone test is still recommended before App Store release.

---

# 8. Recommended KitchenOps Route

Recommended initial route:

1. Finish Android testing
2. Finish iOS preparation files
3. Stabilise KitchenOps production release
4. Create Apple Developer account only when ready
5. Use temporary Mac or hosted macOS access for first build
6. Produce first TestFlight build
7. Test on real iPhone
8. Decide whether buying a Mac mini is justified after successful TestFlight

This avoids spending money too early.

---

# 9. Apple Developer Account

Do not create yet.

Create when:

- KitchenOps is stable
- App Store metadata is ready
- App icon is ready
- Privacy answers are mostly confirmed
- macOS build route is chosen
- we are ready to create the App Store Connect record

The Apple Developer membership will be required for:

- App Store Connect
- signing
- provisioning
- TestFlight
- App Store submission

---

# 10. Certificates And Signing

When the Apple account exists we will configure:

- Apple Distribution certificate
- App Store provisioning
- Team ID
- Bundle ID
- Signing capabilities

Prefer automatic signing in Xcode for the first KitchenOps build unless there is a specific reason to manage certificates manually.

Do not create certificates early without a build environment.

---

# 11. App Store Connect Record

Once the Apple Developer account is active:

Create a new app with:

Name:
KitchenOps

Bundle ID:
com.kitchenops.app

Primary language:
English (UK)

SKU:
KitchenOps-iOS

Primary category:
Business

Secondary category:
Productivity

Exact availability/country settings will be decided before submission.

---

# 12. First TestFlight Build

First objective is NOT public App Store release.

First objective:

Install KitchenOps on a real iPhone through TestFlight.

Test:

- App launch
- Login
- Trial signup
- Session persistence
- Site selection
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
- Logout
- Trial expiry
- Subscription expiry
- Background/resume
- Poor network
- External links

---

# 13. Build Versioning

Before creating the first iOS build confirm:

Marketing version:
1.0.0

Build number:
1

Future uploads increment build number:

1
2
3
4

The marketing version only changes for real releases.

Do not reuse an uploaded build number.

---

# 14. Release Checks Before iOS Sync

Before generating/syncing iOS:

npm run typecheck
npm run build
npm audit --omit=dev
git diff --check
git status

Also run the existing Android checks so one platform change does not accidentally break Android:

npm run android:sync
npm run android:check

Only continue if checks pass.

---

# 15. iOS Native Checks

Once the iOS project exists:

- Capacitor sync succeeds
- Xcode project opens
- No signing errors
- No missing usage descriptions
- No unsupported plugin errors
- App builds in Release configuration
- App launches on physical iPhone
- Production server loads securely
- Safe areas work
- Keyboard behaviour works
- External links work
- Login/session persistence works

---

# 16. TestFlight Gate

Do not submit to App Review until:

- First TestFlight build installs successfully
- Core workflows have been tested on a real iPhone
- No obvious crashes
- No clipped layouts
- No login issues
- Trial behaviour works
- Account deletion path is compliant
- Payment/subscription approach is confirmed
- Privacy questionnaire matches reality
- Reviewer demo account is ready

---

# 17. Current Status

Windows preparation:
IN PROGRESS

Apple Developer account:
WAITING

Mac/Xcode:
WAITING

@capacitor/ios:
NOT INSTALLED

Native iOS project:
NOT CREATED

App Store Connect record:
NOT CREATED

TestFlight:
NOT STARTED

App Store submission:
NOT STARTED