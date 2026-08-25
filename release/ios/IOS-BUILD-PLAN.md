KitchenOps — Final iOS Technical Build Plan

App

KitchenOps

Bundle ID

com.kitchenops.app

Version

1.0.6

Build

1 for the first uploaded iOS build, then increment for each subsequent upload.

1. Current Technical Position

KitchenOps is built with:

Next.js

Capacitor

Supabase

production web application hosted at https://app.kitchenops.co.uk

Current native platforms:

Android — existing and in active closed testing

iOS — native Capacitor project already generated

Current iOS project:
ios/App/App.xcodeproj

Current iOS identity:

App name: KitchenOps

Bundle ID: com.kitchenops.app

Marketing version: 1.0.6

Build number: 1

Target devices: iPhone + iPad

Deployment target: iOS 15.0

Current development computer:
Windows

Mac available:
No

Apple Developer account:
Not yet created

This means the remaining Windows-side preparation can continue now, but Xcode build/sign/archive/TestFlight work requires macOS.

2. What Has Already Been Completed On Windows

Completed:

App Store metadata prepared

App Privacy worksheet prepared

App Store review checklist prepared

Screenshot plan prepared

TestFlight test plan prepared

Apple reviewer/demo account plan prepared

native iOS platform generated

@capacitor/ios installed

iOS bundle ID configured

iOS display name configured

marketing version set to 1.0.6

initial build number set to 1

iPhone + iPad target confirmed

app icon replaced

splash screen replaced

iOS readiness script added

production URL configured

generated Info.plist checked for unexpected sensitive permissions

Windows-side preparation is now close to complete.

3. Capacitor Configuration

Current expected Capacitor identity:

appId: com.kitchenops.app
appName: KitchenOps

Current production shell URL:

https://app.kitchenops.co.uk/login

Before each native release candidate, verify:

appId

appName

server.url

HTTPS/cleartext settings

splash configuration

status bar configuration

installed Capacitor plugin versions

no development/preview URL has replaced production

Never upload an App Store build pointing to:

localhost

a Vercel preview URL

temporary staging

a developer machine IP

4. Capacitor Package Versions

The iOS package is already installed and the native project exists.

Before Mac build, run:

npm list @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

Confirm the packages remain on compatible versions.

Do not randomly upgrade Capacitor immediately before App Store submission.

Any major Capacitor upgrade should be treated as a release change and fully regression-tested on Android and iOS.

5. Native iOS Project

The native project has already been created.

Do not run npx cap add ios again.

For normal future updates use:

npx cap sync ios

Then open:

ios/App/App.xcodeproj

or, from a Mac:

npx cap open ios

The generated project uses Swift Package Manager for Capacitor dependencies.

6. Apple Build Requirement

For uploads made now, Apple requires App Store submissions to be built using Xcode 26 or later and the iOS 26/iPadOS 26 SDK or later.

This is a build SDK requirement.

It does not mean KitchenOps must require iOS 26 on users' devices.

KitchenOps can currently retain its deployment target of iOS 15.0 if the app and dependencies continue to build and function correctly with the required current Xcode/SDK.

At the Mac stage:

install Xcode 26 or newer

verify the selected iOS SDK satisfies Apple's current upload requirement

re-check Apple's requirements again immediately before the first upload

7. Mac Strategy

When ready for the first real build, choose one of these.

Option A — Temporary / Borrowed Mac

Best low-cost first route if a suitable Mac is available.

Requirements:

supported macOS

Xcode 26+

Git

Node.js

KitchenOps repository

Apple Developer login

Advantages:

low initial cost

full Xcode access

suitable for first TestFlight build

Disadvantage:

future releases require access again

Option B — Mac mini

Best long-term option once regular iOS releases justify it.

Advantages:

permanent build machine

straightforward Xcode/TestFlight workflow

reusable for future Simpson Software apps

Disadvantage:

upfront cost

Do not buy one merely to prove that the project can compile.

Option C — Hosted Mac

A reputable hosted macOS service can be used.

Before choosing a provider verify:

current macOS support

Xcode 26+ available

secure Apple account/signing support

Git access

archive/upload capability

pricing

data/privacy approach

ability to use Simulator

A separate physical iPhone should still be used for release testing.

Option D — CI / Cloud Build

Later, a macOS CI pipeline may automate:

pull repository

install dependencies

run checks

sync Capacitor

build/archive

sign

upload to App Store Connect/TestFlight

This is useful after the manual process works reliably.

Do not make CI signing the first iOS milestone unless there is a strong reason.

8. Recommended KitchenOps Route

Recommended sequence:

Complete remaining Windows-side release documentation.

Keep production stable.

Resolve the Apple subscription/payment approach.

Create Apple Developer account when ready for build/signing.

Obtain temporary Mac/hosted Mac access.

Clone KitchenOps from GitHub.

install dependencies.

run release checks.

sync iOS.

open Xcode.

configure signing.

build in Simulator.

run on a real iPhone.

test on iPad Simulator.

create App Store Connect record.

archive first build.

validate archive.

upload to TestFlight.

run the full TestFlight plan.

fix release blockers.

capture final screenshots.

complete App Store Connect metadata/privacy/age rating.

submit to App Review.

9. Apple Developer Account

The Apple Developer account can remain deferred until the Mac/signing stage.

Create it when:

KitchenOps production is stable

iOS preparation docs are complete

payment/subscription approach is understood

a Mac route is chosen

first TestFlight work is imminent

Required for:

App IDs

signing

certificates/provisioning

App Store Connect

TestFlight

App Store submission

Do not commit Apple credentials, certificates, private keys or reviewer passwords to Git.

10. First Mac Setup

On the Mac:

Install

Xcode 26+

Xcode command line tools

Git

Node.js compatible with the project

npm

Then:

git clone <KitchenOps repository URL>
cd kitchenops-cloud
npm install

If using the existing repository checkout instead of cloning, pull the latest main.

Verify:

git status
git log -1 --oneline
node --version
npm --version

The working tree should be clean before native build work begins.

11. First Mac Engineering Checks

Before opening Xcode:

npm run typecheck
npm run build
npm audit --omit=dev
npm run ios:check
git diff --check

Also run shared Android regression checks:

npm run android:sync
npm run android:check

Only proceed if the release-critical checks pass.

Do not assume a previous Windows result proves the Mac checkout is valid.

12. Sync iOS

From the project root:

npx cap sync ios

Confirm:

web assets copy successfully

Capacitor configuration copies successfully

plugins update successfully

no plugin install error

no package-resolution error

Then:

git status

Review any native file changes before committing them.

A routine Capacitor sync should not be treated as an excuse to commit unexplained generated changes.

13. Open Xcode

Run:

npx cap open ios

Or open:

ios/App/App.xcodeproj

Allow Xcode to resolve Swift Package Manager dependencies.

Then select the App target.

14. Xcode Identity Check

In the App target, confirm:

App name:
KitchenOps

Bundle Identifier:
com.kitchenops.app

Version:
1.0.6

Build:
1 for the first upload

Supported devices:

iPhone

iPad

Deployment target:
iOS 15.0 unless a dependency/build issue requires a deliberate change

Do not change identifiers just to resolve a signing problem.

15. Signing & Capabilities

Sign into the Apple Developer account in Xcode.

Recommended for the first release:
Automatically manage signing

Select the correct Apple Developer Team.

Verify:

Team selected

bundle ID is registered/accepted

provisioning succeeds

no red signing error remains

no unnecessary capability is enabled

Do not add:

Push Notifications

Background Modes

Associated Domains

Sign in with Apple

iCloud

Camera/Location/etc.

unless KitchenOps actually requires the capability.

16. Info.plist / Permissions Audit

Before first device build, inspect the final generated native project.

Expected for KitchenOps 1.0.6:
No Camera, Photos, Location, Microphone or Contacts permission prompts are intentionally required.

Verify:

no unexpected NS...UsageDescription keys

no accidental background modes

no unnecessary URL schemes

privacy-sensitive keys match real features

Any new permission must be reflected in:

App Privacy answers

privacy policy where relevant

TestFlight tests

App Review documentation

17. Export Compliance

Before App Store Connect submission, review Apple's export-compliance questions.

KitchenOps uses HTTPS/network encryption through normal platform/web services.

Do not guess the App Store Connect answer.

At the Mac/App Store Connect stage:

determine whether the app qualifies for Apple's encryption exemption

if appropriate, configure ITSAppUsesNonExemptEncryption deliberately

ensure the App Store Connect answers match the app

Do not add the Info.plist key solely to silence a prompt without understanding the declaration.

18. Simulator Build

Before physical-device testing:

Select an iPhone Simulator.

Recommended:

current large iPhone

current iOS simulator runtime

Build/run.

Verify:

compile succeeds

app launches

splash shows

login page loads

production backend is reachable

safe areas correct

keyboard works

navigation works

no white screen

no native crash

Then repeat representative testing on:

smaller iPhone Simulator

13-inch iPad Simulator

Simulator success is not sufficient for release.

19. Physical iPhone Build

Connect a real iPhone.

Select it as the run destination.

Build and run.

Test at minimum:

launch

login

logout

session persistence

dashboard

prep

purchasing

inventory

waste

handover

users

settings

Account & Privacy

background/resume

mobile data

external links

Physical-device success is required before treating the build as release-ready.

20. iPad Testing

KitchenOps 1.0.6 supports iPad.

Test:

13-inch iPad Simulator

physical iPad if available

Check:

navigation

cards

forms

tables

modals

portrait

landscape if allowed

keyboard

multi-site views

whitespace/layout

Do not submit merely because an iPhone layout technically scales onto iPad.

21. App Store Connect Record

Once Apple Developer/App Store Connect access is active, create KitchenOps.

Expected details:

Name:
KitchenOps

Bundle ID:
com.kitchenops.app

Primary language:
English (UK)

SKU:
Choose a stable internal identifier, for example:
KitchenOps-iOS

Primary category:
Business

Secondary category:
Productivity

Version:
1.0.6

Use the finalized files under:

release/ios/

for:

metadata

privacy

review checklist

screenshot plan

reviewer/demo plan

22. Versioning

Current first iOS release candidate:

Marketing version:
1.0.6

Initial build:
1

The App Store-visible version must match the version configured for the App Store version record.

For another upload of KitchenOps 1.0.6, increment the build number:

1
2
3
4
...

Do not reuse a build number that has already been uploaded for that version.

For a later public release, such as 1.0.7:

marketing version becomes 1.0.7

build numbering can be managed according to the release workflow

update the App Store version record accordingly

23. Archive Build

When Simulator/device tests are acceptable:

In Xcode:

Select a generic iOS device / appropriate archive destination.

Choose Product > Archive.

Wait for Organizer.

Select the new archive.

Before upload check:

version

build

bundle ID

signing team

app icon

archive creation date

Do not upload an archive whose identity does not match the intended App Store record.

24. Archive Validation

From Xcode Organizer:

Validate App

select App Store Connect distribution

use appropriate signing options

resolve validation errors

review warnings

Pay particular attention to:

signing

SDK version

privacy manifests

required-reason API declarations

app icon

bundle identifiers

embedded frameworks

export compliance

minimum OS version

Do not ignore an unfamiliar validation warning without checking it.

25. Privacy Manifests & SDK Checks

During the final Xcode/archive stage:

inspect Xcode privacy report where available

verify Capacitor dependencies are acceptable

verify third-party SDK privacy manifests

check required-reason APIs

verify App Privacy answers still match actual SDK/data behaviour

This should be rechecked against the exact dependency versions in the candidate build.

26. First Upload

Once validation passes:

Use Xcode Organizer to upload the archive to App Store Connect.

After upload:

wait for Apple processing

verify build appears under TestFlight

confirm version is 1.0.6

confirm correct build number

review any processing warnings

answer export-compliance questions if requested

The first milestone is a processed TestFlight build, not App Review submission.

27. TestFlight

Install the processed build through TestFlight.

Run:

release/ios/TESTFLIGHT-TEST-PLAN.md

Test on:

real iPhone

iPad Simulator

physical iPad if available

Do not submit to App Review until release blockers are resolved.

If a fix is needed:

make the code change

rerun checks

increment build number

sync iOS

archive again

upload new build

retest

28. Demo Account

Before App Review:

Follow:

release/ios/APPLE-REVIEW-DEMO-PLAN.md

Create:

KitchenOps Demo

Site One

Site Two

Site Three

dedicated Operations reviewer account

non-expiring review entitlement

polished fictional data

Enter credentials only in App Store Connect.

29. Screenshots

After the candidate TestFlight build is stable:

Follow:

release/ios/SCREENSHOT-PLAN.md

Capture:

iPhone screenshot set

iPad screenshot set

Do not capture final screenshots from:

a browser

local development

an unstable build

real customer data

30. Payment / Subscription Policy Gate

Before App Review submission, resolve the KitchenOps subscription approach against Apple's current App Review rules.

Do not add external payment/signup links to the native iOS experience until that decision is confirmed.

The final implementation and App Review notes must accurately describe how business customers obtain access.

This is a release gate.

31. App Review Gate

Do not submit until:

production release is stable

required Apple Developer membership active

correct App Store Connect record exists

Xcode 26+ / current required SDK used

Simulator build passes

physical iPhone test passes

iPad test passes

TestFlight plan passes

reviewer account passes

payment/subscription approach resolved

privacy answers complete

age rating complete

support/privacy URLs verified

account deletion tested on iOS

screenshots complete

metadata complete

App Review notes complete

correct build selected

32. Current Status

Windows Preparation

NEARLY COMPLETE

Native iOS Project

CREATED

@capacitor/ios

INSTALLED

Bundle ID

CONFIGURED — com.kitchenops.app

Version

CONFIGURED — 1.0.6

Initial Build Number

CONFIGURED — 1

iPhone Support

CONFIGURED

iPad Support

CONFIGURED

App Icon

CONFIGURED

Splash Screen

CONFIGURED

iOS Readiness Check

PASSING at last confirmed run

Apple Developer Account

WAITING

Mac / Xcode

WAITING

App Store Connect Record

NOT CREATED

TestFlight

NOT STARTED

App Store Submission

NOT STARTED

Final Technical Milestone

The next major iOS technical milestone is:

Open the existing KitchenOps iOS project in Xcode 26+ on a Mac, configure Apple signing, and successfully run KitchenOps 1.0.6 on an iPhone Simulator and then a physical iPhone.

Do not regenerate the iOS project. Continue from the native project already committed to the repository.