# KitchenOps Android — Closed Testing Build 1

This project adds a native Android shell to KitchenOps v0.9.8.1 using Capacitor.

## Android identity

- App name: `KitchenOps`
- Android application ID: `com.kitchenops.app`
- Android version code: `1`
- Android version name: `0.9.8.1`
- Minimum Android SDK: 24
- Compile SDK: 36
- Target SDK: 36

> Important: Google Play permanently associates the first uploaded artifact with its package/application ID. Confirm that `com.kitchenops.app` is the ID you want before uploading the first AAB to Play Console.

## What is included

- Native Android project in `/android`
- Capacitor Android integration
- KitchenOps approved purple analytics launcher icon
- KitchenOps branded splash screen
- HTTPS-only remote KitchenOps production connection
- Capacitor App plugin
- Capacitor Splash Screen plugin
- Capacitor Status Bar plugin
- Android Internet permission
- Release-signing files excluded from Git

## Why the Android shell uses the live KitchenOps URL

KitchenOps uses Next.js server API routes for cloud features such as authentication, staff login, handovers, invoices and catalogue data. Those routes run on the deployed KitchenOps server. The Android app therefore opens the live HTTPS KitchenOps deployment inside the native Capacitor container rather than trying to package the Next.js server inside the phone.

This also means the Android app and website use the same Supabase/business data.

## ONE REQUIRED EDIT BEFORE ANDROID SYNC

Open:

`capacitor.config.ts`

Find:

`https://REPLACE-WITH-YOUR-LIVE-KITCHENOPS-URL`

Replace it with your real live KitchenOps URL, for example:

`https://kitchenops-your-project.vercel.app`

or your future custom domain.

Do not use localhost and do not remove HTTPS.

## Commands

After entering the live URL:

```powershell
npm install
npm run typecheck
npm run android:sync
npm run android:open
```

`android:open` opens the generated project in Android Studio.

## Build on an Android phone first

In Android Studio:

1. Allow Gradle Sync to finish.
2. Connect an Android phone with USB debugging enabled, or create an Android emulator.
3. Select the phone/emulator in the device selector.
4. Press Run.
5. Confirm KitchenOps opens with the new icon and splash screen.
6. Test Operations login, new-business creation and Manager/Chef login.

## Google Play AAB

When the phone test passes:

1. In Android Studio choose **Build > Generate Signed App Bundle or APK**.
2. Select **Android App Bundle**.
3. Create a new upload key/keystore if this is the first release.
4. Store the keystore and passwords somewhere safe and backed up.
5. Select the `release` build variant.
6. Generate the signed bundle.
7. The resulting `.aab` is the file uploaded to Google Play Console.

Never commit the `.jks`/`.keystore` file or its passwords to GitHub.

## Every future Android release

Before a new Play upload:

1. Increase `versionCode` in `android/app/build.gradle`.
2. Update `versionName` as desired.
3. Run `npm run android:sync`.
4. Build and test on Android.
5. Generate a signed release AAB using the SAME upload key.

Google Play will reject an update if its version code is not higher than the previous uploaded version.
