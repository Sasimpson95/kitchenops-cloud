KitchenOps — Apple App Privacy Submission Worksheet

App

KitchenOps

Bundle ID

com.kitchenops.app

Version

1.0.6

Privacy Policy URL

https://kitchenops.co.uk/privacy

Current submission position

Yes — KitchenOps collects data.

KitchenOps is a cloud-based business application. Account information and operational business content are transmitted to and stored by KitchenOps to provide the service.

This worksheet reflects the current KitchenOps 1.0.6 production implementation. Re-check it immediately before App Store submission if analytics, Stripe billing, advertising/conversion tracking, crash reporting, camera/photo features, or other third-party services are added.

App Store Connect — Data Types to Select

1. Contact Info

Name

Collected: Yes
Linked to User: Yes
Used for Tracking: No
Purpose: App Functionality

Why:

Operations accounts include a display name.

Operations invitations contain the invitee's name.

Kitchen staff accounts also use names as part of normal app functionality.

Email Address

Collected: Yes
Linked to User: Yes
Used for Tracking: No
Purpose: App Functionality

Why:

Operations users authenticate with an email address.

Operations invitations are sent to an email address.

Transactional account/invitation email is required to provide the service.

Phone Number

Collected: No

Physical Address

Collected: No

Other User Contact Info

Collected: No, based on the current production implementation.

2. Identifiers

User ID

Collected: Yes
Linked to User: Yes
Used for Tracking: No
Purpose: App Functionality

Why:

Supabase Auth assigns an account/user identifier.

KitchenOps links Operations memberships and permissions to the authenticated user.

Device ID

Collected: No, based on the current KitchenOps application implementation.

3. User Content

Other User Content

Collected: Yes
Linked to User / Business Account: Yes
Used for Tracking: No
Purpose: App Functionality

KitchenOps stores user-created and business operational content including, where used:

prep records

handovers

waste records

stock and inventory information

stocktake information

supplier information

product information

recipe information

purchasing and receiving records

site and business configuration

staff/user configuration

This information is required to provide KitchenOps functionality.

Photos or Videos

Collected: No in the current 1.0.6 implementation.

No camera/photo permission is currently declared by the native iOS project and no photo-upload feature has been identified for the current release.

Audio Data

Collected: No

Customer Support

Do not select as a core app data type unless support/feedback submitted from the app is stored in a way that requires disclosure under Apple's rules.

Re-check the production feedback/support flow immediately before submission.

4. Purchases / Financial Information

Payment Info

Collected by KitchenOps app: No for the current 1.0.6 release.

Stripe subscriptions are not currently implemented.

When Stripe is added:

re-audit this section before the next App Store submission;

if card/payment information is entered directly with Stripe and KitchenOps never receives it, confirm Apple's current payment-info disclosure rules before changing this answer.

Purchase History

Collected: No for the current 1.0.6 release.

5. Usage Data / Analytics

Product Interaction

Collected for analytics: No, based on the current 1.0.6 application dependencies and implementation reviewed.

Advertising Data

Collected: No

Other Usage Data

Collected: No, based on the current implementation.

Current production code does not include a dedicated Google Analytics, PostHog, Sentry, Microsoft Clarity, Meta/Facebook, or advertising SDK dependency.

If analytics or conversion tracking is introduced, this section must be re-audited before submission.

6. Diagnostics

Crash Data

Collected by KitchenOps through a dedicated crash-reporting SDK: No

Performance Data

Collected by KitchenOps through a dedicated performance SDK: No

Other Diagnostic Data

Collected by KitchenOps through a dedicated diagnostics SDK: No

There is currently no dedicated crash/diagnostics SDK in the app dependencies.

Hosting/platform operational logs should still be checked immediately before submission to ensure this answer remains accurate under Apple's definition of collection.

7. Location

Precise Location

Collected: No

Coarse Location

Collected: No

KitchenOps does not request iOS location permission in the current native project.

8. Contacts

Collected: No

KitchenOps does not request access to the user's device contacts.

9. Sensitive Information

Collected: No, based on the intended and current KitchenOps feature set.

KitchenOps is not designed to collect:

health or medical information

racial or ethnic information

religious or philosophical beliefs

political opinions

trade union membership

sexual orientation or sex-life information

biometric information

10. Tracking

Does KitchenOps use data for tracking?

No

KitchenOps does not currently use data to track users across apps or websites owned by other companies for advertising or advertising measurement.

App Tracking Transparency permission required?

No, based on the current 1.0.6 implementation.

There is no advertising SDK or cross-app tracking functionality in the current app.

11. Advertising

Third-party advertising displayed in KitchenOps

No

Advertising SDK in the iOS app

No

Advertising used externally to market KitchenOps does not by itself mean the KitchenOps app performs tracking. Re-check this if advertising/conversion SDKs are later added to the app or web application loaded by the native shell.

12. Account Creation

Yes

Operations users can create KitchenOps accounts using email/password authentication.

Kitchen Manager and Chef users can also use site-based staff/PIN access managed within the KitchenOps business.

Authentication provider:
Supabase Auth

13. Account Deletion

Implemented and tested

Users can initiate account deletion inside KitchenOps from:

Settings > Account & Privacy

Current safety rule:

if the signed-in account is the only active Operations user for the business, deletion is blocked;

another Operations user must first be invited and accept the invitation;

pending invitations do not count;

after another active Operations user exists, the original user can delete their account.

The end-to-end flow has been tested against the production database structure.

Public privacy/deletion information should remain available at:
https://kitchenops.co.uk/delete-account

14. Third-Party Services — Current Release

Supabase

Used for:

authentication

database/storage of KitchenOps cloud data

business memberships and permissions

Relevant data:

email

user/account identifier

display name

business/site membership

operational KitchenOps data

Purpose:
App Functionality

Tracking:
No

Resend

Used server-side for transactional KitchenOps email, including Operations invitations.

Relevant invitation data can include:

recipient name

recipient email

business name

secure invitation URL

Purpose:
App Functionality / transactional communication

Tracking:
No

Vercel

Used to host and run the KitchenOps web/cloud application.

No dedicated Vercel Analytics package is present in the current application dependency list.

Before submission, confirm the production hosting/logging configuration remains consistent with the App Store privacy answers.

Stripe

Not currently implemented in KitchenOps 1.0.6.

Re-audit App Privacy when Stripe subscriptions are introduced.

App Store Connect — Recommended Current Selections

When creating the KitchenOps 1.0.6 App Privacy entry, the current implementation supports the following core declarations:

Apple data type

Collect?

Linked to user?

Tracking?

Purpose

Name

Yes

Yes

No

App Functionality

Email Address

Yes

Yes

No

App Functionality

User ID

Yes

Yes

No

App Functionality

Other User Content

Yes

Yes

No

App Functionality

Do not currently select:

Payment Info

Purchase History

Precise Location

Coarse Location

Contacts

Photos or Videos

Audio Data

Advertising Data

Device ID

Product Interaction for analytics

Crash Data

Performance Data

unless the production implementation changes before submission.

Final Pre-Submission Recheck

Immediately before completing App Store Connect:

Confirm package.json and native iOS dependencies have not gained analytics, advertising, crash-reporting, location, camera, contacts, or payment SDKs.

Confirm Info.plist still has no unnecessary privacy-sensitive permission declarations.

Confirm Stripe has not yet been added, or update the worksheet if it has.

Confirm no advertising/conversion tracker has been added to the production web application.

Confirm the production privacy policy accurately describes Supabase, Resend, hosting, account data, operational content and account deletion.

Re-test Settings > Account & Privacy on the App Store candidate build.

Confirm Apple review/demo credentials do not contain real customer data.

Complete App Store Connect from this worksheet and keep the answers updated if KitchenOps data practices change.

Evidence / Audit Notes

Current production package.json includes Capacitor, Supabase, Next.js, React and UI dependencies. It does not currently list a dedicated analytics, advertising, crash-reporting or Stripe SDK.

The Operations invitation API sends transactional email through Resend's server-side email API.

Apple requires App Store privacy responses to include data collected by the app and relevant third-party partners, and requires the responses to remain accurate as data practices change.