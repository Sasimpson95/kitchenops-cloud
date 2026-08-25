KitchenOps — Final TestFlight Test Plan

App

KitchenOps

Version

1.0.6

Goal

Verify that the final iOS build behaves correctly on real Apple hardware before App Store submission.

The first objective is not public release.

The first objective is:

Install KitchenOps through TestFlight on a real iPhone and iPad, then confirm every release-critical workflow works correctly.

This plan is the release gate for iOS.

1. Test Environment

Use:

Production KitchenOps backend

Dedicated fictional demo business

Dedicated Apple reviewer/test account

TestFlight build matching the intended App Store candidate

Recommended demo environment:

Business:
KitchenOps Demo

Sites:

Site One

Site Two

Site Three

Reviewer/test access:
Operations

Do not use real customer or employee data during final release testing.

2. Installation & First Launch

Confirm:

TestFlight installation completes

App icon displays correctly

App name displays as KitchenOps

App launches without crashing

Splash screen displays correctly

Production KitchenOps app loads

No localhost/dev URL appears

No debug banner appears

Status bar looks correct

Safe areas are respected

Test:

fresh install

reinstall

install over a previous TestFlight build if applicable

3. Authentication

Test:

valid login

invalid login

logout

login again

session persistence after force-closing app

session persistence after restarting iPhone

session persistence after restarting iPad

expired session behaviour

login redirect after authentication

no login loop

Expected:
The user should remain signed in during normal use unless the session genuinely expires or they explicitly sign out.

4. Trial Signup

Test a brand-new trial account separately from the reviewer account.

start new business trial

complete signup

business is created

initial site is created

trial starts correctly

welcome/signup email is received

KitchenOps opens after signup

30-day trial is applied correctly

no payment card is required

expiry date is correct

entitlement cannot be bypassed

refresh/relaunch does not change entitlement incorrectly

Do not use the Apple reviewer account for this test.

5. Dashboard

Test:

Dashboard loads

correct site data appears

site selector works

All Sites works

cards navigate correctly

Prep summary is correct

Handover summary is correct

Waste summary is correct

stocktake information is correct where shown

Needs Your Attention updates without requiring manual refresh

switching sites updates the screen correctly

Repeat on:

iPhone

iPad

6. Prep Planner

Test:

Today loads

Tomorrow loads

planned items display

quantity changes save correctly

prep can be started

prep can be completed

Awaiting Approval state appears

manager approval works

recipe button works

incomplete prep can be carried forward

tomorrow's prep becomes today's correctly when applicable

manager restrictions behave correctly

All Sites restrictions behave correctly

Check:

tap targets

card spacing

scrolling

text clipping

no accidental horizontal scrolling

7. Recipes

Test:

recipe library loads

search works

recipe opens

ingredients display

quantities display

yield displays

method displays where present

cost information displays where present

long recipes scroll correctly

back navigation works

8. Products

Test:

product list loads

search works

product details load

category displays

supplier displays

order unit displays

inventory unit displays

current stock displays

min/max values display

price displays

storage location displays

manager/view-only permissions behave correctly

9. Inventory

Test:

inventory page loads

current stock displays correctly

movement history loads

Delivery movement appears

Production movement appears

Waste movement appears

Stocktake movement appears

Adjustment appears

movement values are correct

site attribution is correct

switching site changes inventory correctly

10. Purchasing

Test:

Purchasing loads

create order

add products

change quantities

save order

send order

status changes correctly

view order history

outstanding orders are visible for receiving

receive order

enter delivered quantities

enter prices

complete receiving

inventory updates correctly

completed order no longer behaves as outstanding

cancelled order behaves correctly if supported

accidental duplicate submissions do not occur

Verify order status behaviour:

Draft only when appropriate

Sent

Completed

Cancelled

11. Waste

Test:

Waste opens

add waste entry

select product

enter quantity

save waste

recent waste appears

correct site is recorded

inventory reduces correctly

duplicate submission does not occur

page remains usable with multiple records

12. Stocktakes

Test:

Stocktakes page loads

start stocktake

enter quantities

save progress if supported

complete stocktake

totals are correct

inventory updates correctly

previous stocktakes remain accessible

comparison/history works where applicable

site attribution is correct

13. Handover

Test:

today's handover displays

tomorrow's handover can be created

handover saves

reload app

saved handover remains

correct site attribution

switching sites shows the correct handover

long text wraps correctly

keyboard does not cover save controls

14. Suppliers

Test:

supplier list loads

supplier details load

contact information displays

lead time displays

delivery days display

status displays correctly

linked products display correctly where applicable

external supplier link behaviour is safe if present

15. Users — Manager/Chef PIN Users

Test:

Users page loads

Manager/Chef PIN users display correctly

roles display correctly

shared login behaviour works

remembered team member behaviour works

quick switching works

actions are attributed to the selected team member

site access behaves correctly

16. Users — Operations Accounts

Test:

Operations Users section loads

active Operations users display

pending invitations display

invitation can be sent

invitation email is received

invited user can open invitation

invited user can sign up if required

invitation can be accepted

pending invitation disappears after acceptance

accepted user becomes active

wrong-account detection works

sign-out-and-continue works

invitation can be revoked if supported

Also test:

pending invitation does not count as active Operations membership

active invited user does count as active Operations membership

17. Settings

Test:

Settings loads

business settings

sites

users

integrations

product options

release notes

About

Help

Feedback

Account & Privacy

Logout

Check:

layout

scrolling

links

iPad spacing

18. Trial Expiry

Using a controlled test account:

expire trial

relaunch app

operational access is blocked

correct subscription/access message appears

existing business data remains preserved

restore entitlement

access returns

no data is lost

no stale locked state remains after restoration

Important:

verify Account & Privacy is still reachable when entitlement is expired if required for account deletion compliance

19. Subscription Behaviour

Stripe is not yet implemented in the current release.

For KitchenOps 1.0.6:

confirm no broken subscription purchase UI appears

confirm no unresolved payment link appears

confirm reviewer access does not depend on payment

confirm any subscription-required messaging is accurate

Once Stripe/subscriptions are implemented, add tests for:

active subscription

cancelled subscription

expired subscription

failed payment

restored subscription

billing portal

iOS payment-policy compliance

20. Account Deletion

Test the complete deletion flow on TestFlight.

Scenario A — Sole active Operations user:

open Settings > Account & Privacy

attempt deletion

deletion is blocked

message explains another active Operations user is required

pending invitation alone does not satisfy the safeguard

Scenario B — Another active Operations user exists:

open Account & Privacy

type DELETE

deletion succeeds

deleted account is signed out

deleted credentials can no longer sign in

business data remains available to the remaining Operations user

remaining Operations user can still access business

invitation records do not break deletion

Run with fictional test users only.

21. External Links

Test:

Privacy Policy

Support/contact

KitchenOps website

account deletion information

supplier URLs if surfaced

subscription/billing links if later added

Confirm:

links open correctly on iOS

links do not trap the user

back navigation is understandable

no localhost/dev URLs appear

no prohibited unresolved payment path appears

22. Mobile UI — iPhone

Check every major screen for:

safe area / notch / Dynamic Island spacing

bottom navigation spacing

keyboard overlap

modal height

scroll behaviour

button size

text clipping

horizontal scrolling

dropdown behaviour

input focus

date pickers

number inputs

long lists

tables

loading states

error states

Test at minimum:

one smaller supported iPhone

one current standard/large iPhone

one physical iPhone through TestFlight

23. iPad UI

KitchenOps 1.0.6 supports iPad.

Test on at least one representative iPad Simulator and, if possible, a physical iPad.

Check:

Dashboard uses width well

navigation looks intentional

cards are not excessively stretched

tables use available width

forms are not awkwardly narrow

modals are appropriately sized

no excessive blank space

landscape behaviour if enabled

portrait behaviour

keyboard behaviour

site selector

multi-site views

long lists/tables

Do not proceed to App Review if the app merely technically launches on iPad but feels broken or unfinished.

24. Background / Resume

Test:

Open KitchenOps

Navigate into a workflow

Background app

Wait

Resume

Repeat after:

30 seconds

5 minutes

30 minutes

several hours

Check:

app resumes safely

session remains valid where expected

stale modal state does not break

data refreshes appropriately

unsaved work behaves predictably

no blank white screen

25. Network Testing

Test:

good Wi-Fi

mobile data

slow connection

temporary connection loss

reconnect after connection loss

launch while offline

lose connection during save

reconnect and retry

Confirm:

app does not crash

useful loading/error state appears

user data is not duplicated

failed saves are clear

app recovers after reconnect

26. Native Appearance

Check:

app icon

splash screen

display name

status bar

launch transition

safe areas

no browser UI

no unexpected zooming

external keyboard behaviour on iPad if available

orientation behaviour matches intended configuration

27. Privacy / Permissions

Before release:

no unexpected iOS permission prompts

Info.plist contains only required usage descriptions

no Camera permission unless feature requires it

no Photos permission unless feature requires it

no Location permission unless feature requires it

no Microphone permission unless feature requires it

no Contacts permission unless feature requires it

App Privacy answers still match production

privacy policy still matches production

third-party services/dependencies rechecked

28. Upgrade Test

If more than one TestFlight build is produced:

install Build 1

sign in

use several workflows

install Build 2 as an update

app launches

session remains intact where expected

data remains intact

no stale native assets

icon/splash still correct

29. App Store Reviewer Account Test

Using the final Apple review credentials:

clean install

login succeeds

KitchenOps Demo opens

Site One available

Site Two available

Site Three available

All Sites available

Dashboard populated

Prep populated

Recipes populated

Products populated

Inventory populated

Purchasing populated

Waste populated

Stocktakes populated

Handover populated

Suppliers populated

Users loads

Settings loads

Account & Privacy loads

no setup wizard blocks reviewer

no payment prompt blocks reviewer

no entitlement expiry blocks reviewer

30. Screenshot Candidate Check

Before capturing final App Store screenshots:

all screenshot-target screens look polished on iPhone

all screenshot-target screens look polished on iPad

demo data matches screenshot plan

no personal information visible

no test/debug records visible

no loading/error state visible

status bar is acceptable

final screenshot set can be captured from this exact TestFlight/demo environment

Screenshot plan:
release/ios/SCREENSHOT-PLAN.md

31. Engineering Gate Before Upload

Run before the candidate build:

npm run typecheck

npm run build

npm audit --omit=dev

npm run ios:check

git diff --check

working tree clean

npx cap sync ios

Xcode build succeeds

Release archive validates

Shared-code regression checks:

npm run android:sync

npm run android:check

Do not mark any command as passed unless its actual output has been checked.

32. Bug Severity During TestFlight

Release blocker

Do not submit until fixed:

crash

cannot login

cannot access main business

data loss

duplicate destructive writes

purchasing/receiving corrupts inventory

account deletion fails

trial entitlement bypass

broken iPad layout

broken reviewer credentials

privacy/permission mismatch

app opens wrong environment

High priority

Usually fix before submission:

broken workflow

major visual clipping

confusing navigation trap

stale data requiring app restart

keyboard blocks critical action

incorrect site attribution

broken external support/privacy links

Minor

Can be assessed case by case:

small spacing inconsistency

cosmetic alignment issue

minor copy issue

non-blocking animation issue

Record every issue rather than relying on memory.

33. TestFlight Release Gate

Do not move to App Store Review until:

installation works

icon/splash correct

login works

logout works

session persistence works

trial signup works

trial expiry works

Dashboard works

Prep Planner works

Recipes work

Products work

Inventory works

Purchasing works

Waste works

Stocktakes work

Handover works

Suppliers work

Manager/Chef users work

Operations users/invitations work

Settings work

Account & Privacy works

account deletion works

site switching works

All Sites works

iPhone layout tested

iPad layout tested

background/resume tested

network loss/recovery tested

no crashes

no release-blocking UI issues

privacy declarations verified

external links verified

reviewer account tested

reviewer entitlement will remain active

screenshot environment ready

final engineering gate passed

Xcode archive validates

correct TestFlight build selected

Only after every release-critical item is complete should KitchenOps 1.0.6 move to App Store Review.