KitchenOps — Final App Store Review & Submission Checklist

App

KitchenOps

Bundle ID

com.kitchenops.app

Version

1.0.6

Current readiness

KitchenOps has completed the main Windows-side iOS preparation work. The native Capacitor iOS project exists, the app identity and branding are configured, account deletion is implemented and tested, and App Store metadata/privacy planning has been prepared.

Items marked MAC / APPLE ACCOUNT REQUIRED cannot be completed fully until Apple Developer/App Store Connect access and a Mac with the required Xcode version are available.

1. App Identity — DONE

App name: KitchenOps

Bundle ID: com.kitchenops.app

iOS marketing version: 1.0.6

Initial iOS build number: 1

Display name: KitchenOps

Minimum iOS deployment target currently: iOS 15.0

Native Capacitor iOS project generated

App icon replaced with KitchenOps branding

Splash screen replaced with KitchenOps branding

Production app URL configured

Before upload:

Confirm Xcode still shows the correct bundle ID, version and build number.

Increment the build number for every subsequent App Store Connect upload.

2. Age Rating — APP STORE CONNECT REQUIRED

Expected outcome:
4+ / lowest general-content rating, subject to Apple's questionnaire result.

KitchenOps itself contains:

no violence

no sexual content

no gambling

no drug content

no horror/fear content

no profanity supplied by KitchenOps

no public social network

no public messaging/chat

no unrestricted general-purpose web browser

no advertising in the app

Important:
Apple determines the final rating from the current App Store Connect age-rating questionnaire. Do not manually assume the displayed rating before completing that questionnaire.

Complete Apple's current age-rating questionnaire.

Confirm the generated rating is appropriate.

Re-check if new user-generated/social features are introduced.

3. App Purpose — READY

KitchenOps is cloud-based business operations software for restaurants, cafés and hospitality groups.

Core functions include:

Prep planning

Stock and inventory

Purchasing and receiving

Stocktakes

Waste tracking

Recipes and costing

Kitchen handovers

Multi-site management

Team roles and permissions

The App Review notes should make the business/SaaS purpose clear.

4. Reviewer Login — TODO BEFORE SUBMISSION

Authentication is required.

Create a dedicated Apple review account shortly before submission.

Suggested demo setup:

Business:
KitchenOps Demo

Site:
Site One

Reviewer email:
CREATE BEFORE SUBMISSION — DO NOT COMMIT TO GIT

Reviewer password:
CREATE BEFORE SUBMISSION — DO NOT COMMIT TO GIT

Requirements:

Reviewer login works from a clean device/session.

Account is not protected by unavailable MFA or other manual intervention.

Trial/subscription state will remain valid throughout review.

Credentials are entered only in App Store Connect review information.

No real customer or employee data is used.

5. Reviewer Demo Data — TODO

Do not give Apple an empty KitchenOps account.

Suggested demo data:

Products:

Bacon

Mushrooms

Pancake Mix

Brownies

Tomato Relish

BBQ Sauce

Include examples of:

planned prep

prep in progress

completed prep

supplier

supplier order

received order / delivery

inventory movement

waste entry

stocktake

recipe

handover

Manager/Chef PIN user

Operations user

Reviewer should be able to access:

Dashboard

Prep Planner

Recipes

Products

Inventory

Purchasing

Waste

Stocktakes

Handover

Suppliers

Users

Settings

Account & Privacy

6. App Review Notes — READY, FINAL CREDENTIALS TODO

Suggested notes:

KitchenOps is a cloud-based hospitality operations platform for restaurants, cafés and hospitality teams.

Authentication is required. A dedicated reviewer account with representative demo data is provided in the App Review information.

KitchenOps requires an internet connection because operational data is stored in the KitchenOps cloud service.

The app provides business operations functionality including prep planning, inventory, purchasing, waste, stocktakes, recipes and handovers.

KitchenOps does not sell physical goods through the app.

Account deletion can be initiated from Settings > Account & Privacy.

Before submission:

Add any information Apple needs to understand the subscription/business model.

Add working reviewer credentials.

Explain any feature that could otherwise appear inaccessible.

7. Payments & Subscriptions — COMMERCIAL DECISION REQUIRED

This remains the main App Store policy decision.

KitchenOps is intended to be a paid SaaS service sold to hospitality businesses.

Apple's current rules distinguish between several models, including:

digital functionality/subscriptions normally requiring In-App Purchase;

multiplatform services;

enterprise services sold directly to organizations/groups for their employees or users.

KitchenOps currently has no in-app subscription purchase flow.

Before App Store submission:

Decide the final KitchenOps subscription purchase flow.

Confirm whether KitchenOps qualifies for Apple's Enterprise Services treatment under the current App Review Guidelines.

If it does not qualify, determine whether Apple In-App Purchase is required.

Do not add an external subscription/payment link to the iOS experience until this is resolved.

Clearly explain the business model to App Review.

Re-check Apple's current Guideline 3.1 immediately before submission.

Important:
Do not treat this checklist as a final Apple policy ruling. App Review rules can change and Apple makes the review decision.

8. 30-Day Trial — IMPLEMENTED, DEVICE TEST TODO

Current KitchenOps model:

30-day free trial

no card required

full product access during trial

expired entitlement pauses operational access while preserving data

Already tested at application level:

trial creation

trial expiry

access blocking after expiry

data preserved

entitlement restoration

Still required on iOS candidate build:

Create a new business from iPhone.

Confirm trial dates and access.

Confirm no unintended payment/purchase link appears.

Confirm expired-trial screen works correctly on iPhone.

Confirm Account & Privacy remains reachable as required.

9. Account Deletion — IMPLEMENTED & TESTED

Apple requires apps that support account creation to allow users to initiate deletion within the app.

KitchenOps location:
Settings > Account & Privacy

Implemented behaviour:

deletion can be initiated inside KitchenOps

explicit DELETE confirmation

sole active Operations user cannot orphan the business

pending Operations invitation does not count as another active user

accepted Operations user does count

original Operations user can delete their account after another active Operations user exists

database deletion issue caused by invited_by NOT NULL was fixed

permanent migration added for the database fix

Before App Store submission:

Test deletion again on the actual iOS/TestFlight build.

Confirm wording accurately explains what is deleted and what business records remain.

Confirm the public deletion/privacy information remains accurate.

Public information:
https://kitchenops.co.uk/delete-account

10. Privacy — PREPARED

Privacy Policy:
https://kitchenops.co.uk/privacy

Current App Privacy worksheet:
release/ios/APP-PRIVACY.md

Current expected core App Store privacy declarations:

Name — collected, linked, App Functionality, no tracking

Email Address — collected, linked, App Functionality, no tracking

User ID — collected, linked, App Functionality, no tracking

Other User Content — collected, linked, App Functionality, no tracking

Current release does not intentionally use:

location

contacts

camera/photos

microphone/audio

advertising SDKs

cross-app tracking

dedicated analytics SDKs

dedicated crash-reporting SDKs

Stripe/payment SDK

Before submission:

Re-audit production dependencies.

Re-audit Info.plist permissions.

Re-check Vercel/Supabase/Resend processing against Apple's current definitions.

Confirm website privacy policy matches actual production behaviour.

Complete App Store Connect App Privacy questionnaire.

11. Support — READY, FINAL TEST TODO

Support URL:
https://kitchenops.co.uk/contact

Privacy URL:
https://kitchenops.co.uk/privacy

Marketing URL:
https://kitchenops.co.uk

Before submission:

Open each URL from an iPhone.

Confirm pages load without authentication.

Confirm support email/contact route works.

Confirm pages are usable on mobile.

12. Native Permissions — CURRENTLY CLEAN

Current generated Info.plist contains no declarations for:

Camera

Photos

Location

Microphone

Contacts

Background modes

custom URL schemes

This is desirable because KitchenOps 1.0.6 does not currently require those native capabilities.

Before submission:

Re-check Info.plist after final Capacitor sync.

Only add permissions actually required by a released feature.

Provide a clear usage description for every privacy-sensitive permission added.

13. Native iOS Behaviour — MAC / DEVICE TEST REQUIRED

Test the final candidate build for:

cold launch

splash screen

app icon

login

logout

session persistence

Operations invitation flow

wrong-account invite switching

account creation

account deletion

navigation/back behaviour

status bar

safe areas/notch/Dynamic Island

keyboard opening/closing

form scrolling with keyboard visible

modals

external links

network failure

loading states

authentication expiry

trial expiry

background/resume behaviour

orientation behaviour

app termination/relaunch

14. iPhone Coverage — MAC / DEVICE TEST REQUIRED

Test at minimum:

smaller supported iPhone screen

current standard iPhone screen

large/Max-size iPhone screen

at least one physical iPhone through TestFlight if possible

Verify:

no clipped text

no accidental horizontal page scrolling

tap targets are usable

forms fit

modals fit

navigation is usable

long lists/tables are usable

keyboard does not hide critical controls

15. iPad Support — DECISION REQUIRED

Do not claim good iPad support simply because the generated app launches on iPad.

Before creating the App Store record:

Decide whether KitchenOps 1.0.6 officially supports iPad.

If supporting iPad, perform proper iPad layout/device testing and prepare required screenshots if applicable.

If launching iPhone-only, configure the target appropriately during the Xcode stage.

16. External Links — FINAL AUDIT REQUIRED

Audit:

Privacy

Support/contact

KitchenOps website

account deletion information

subscription/billing links once implemented

supplier/user-entered URLs if surfaced

Special attention:
Subscription/payment links must be reviewed against Apple's current App Review payment rules before submission.

17. Native Build / Xcode — MAC REQUIRED

Current Windows-side preparation:

@capacitor/ios installed

native ios/ project generated

Swift Package Manager Capacitor plugins generated

bundle ID confirmed

display name confirmed

version/build configured

icon configured

splash configured

On Mac:

install required current Xcode

clone/pull KitchenOps repository

run npm install

run npm run build

run Capacitor iOS sync

open ios/App/App.xcodeproj

resolve Swift packages

select Apple Developer Team

configure signing

verify deployment target

build in Simulator

build on physical iPhone

fix any native warnings/errors

archive Release build

validate archive

upload to App Store Connect

18. Apple Developer / App Store Connect — ACCOUNT REQUIRED

Can be deferred until close to the Mac/TestFlight stage.

When ready:

enroll in Apple Developer Program

create/verify App ID for com.kitchenops.app

configure certificates/signing through Xcode

create KitchenOps App Store Connect app record

set version 1.0.6

complete categories

complete App Privacy

complete age rating

enter support/privacy/marketing URLs

enter description, subtitle, promotional text and keywords

enter review contact details

enter reviewer credentials

upload screenshots

select uploaded build

19. Screenshots — TODO AFTER iOS BUILD

Screenshot plan:
release/ios/SCREENSHOT-PLAN.md

Before capture:

final demo account created

polished demo data loaded

no real customer/employee information visible

status bar/device appearance acceptable

candidate UI tested on target sizes

Capture representative screens such as:

Dashboard

Prep Planner

Inventory

Purchasing

Waste / Stocktake

Handover / Recipes

Multi-site or management view

Do not use screenshots from an unfinished/debug state.

20. TestFlight — MAC / APPLE ACCOUNT REQUIRED

Test plan:
release/ios/TESTFLIGHT-TEST-PLAN.md

upload first build

install through TestFlight

run full test plan

test fresh install

test upgrade if another build is uploaded

test reviewer account

test trial signup

test account deletion

test invite acceptance

test expired entitlement

record/fix release-blocking issues

upload new build if fixes are required

21. Final Engineering Gate

Before the final App Store archive/upload:

npm run typecheck

npm run build

npm audit --omit=dev

npm run ios:check

git diff --check

working tree clean

Capacitor iOS sync completed

Xcode build succeeds without release-blocking errors

physical/TestFlight test succeeds

Android checks remain useful for shared code regression testing:

npm run android:sync

npm run android:check

22. FINAL GO / NO-GO

Do not submit until every release-critical item below is complete:

Apple Developer enrollment active

App Store Connect record created

payment/subscription approach confirmed against current Apple rules

production candidate stable

Xcode Release build succeeds

TestFlight testing complete

reviewer login works

demo data present

App Privacy questionnaire complete

privacy policy accurate

age rating complete

support URL tested

account deletion tested on iOS candidate

screenshots uploaded

metadata final

app icon final

splash/launch experience checked

no placeholder/test content

no secrets or reviewer passwords committed

App Review notes complete

correct build selected

Only when all release-critical boxes are complete should KitchenOps 1.0.6 be submitted to App Review.