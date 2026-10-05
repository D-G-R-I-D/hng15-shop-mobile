# Oja — mobile app

Expo (React Native) app for the Oja shop. It uses the **same API and the same
accounts** as the website (`../shop-app`, live at
https://hng15-shop-app.vercel.app).

## Features

- **Shop:** product grid and product pages.
- **Same login as the website:** "Continue with Google" opens the website's own
  sign-in in the system browser. The site hands the app a one-time code, and the
  app exchanges it (with PKCE) for a session token, kept in the phone's secure
  storage. The token is a row in the same `session` table as the website, so it
  is literally the same account.
- **Live cart sync:** when the cart changes on any device, the server sends a
  "cart changed" ping over Supabase Realtime on a private per-user channel. The
  app and website both refetch at once, so an item added on the website shows up
  in the app within about a second, and the other way round. The cart tab shows
  a green "Live" dot while connected. The app also refetches when it returns to
  the foreground.
- **Cart:** change quantities and remove items. The tab badge shows the item count.
- **Checkout:** pay on delivery. The confirmation email comes from the website's
  Mailgun setup.
- **Orders:** history and order detail.

## Run it on your phone (Expo Go)

1. Install **Expo Go** from the App Store (iPhone) or Play Store (Android).
2. On your PC:
   ```bash
   npm install
   npx expo start
   ```
3. Scan the QR code. On **iPhone** use the Camera app; on **Android** use the
   scanner inside Expo Go. Your phone and PC must be on the same Wi-Fi. If they
   can't be, run `npx expo start --tunnel`.

The app talks to the live site by default. To use a local dev server instead,
create `.env` with `EXPO_PUBLIC_API_URL=http://<your-PC's-LAN-IP>:3000`.

## Test login and cart sync

1. In the app, open **Account**, tap **Continue with Google** and sign in.
2. On a computer, sign in to https://hng15-shop-app.vercel.app with the **same
   Google account**.
3. Open the app's **Cart** tab, and check the dot says **Live**.
4. On the website, add a product. It appears in the app within about a second,
   and the Cart tab badge updates.
5. In the app, change a quantity. The website's header count and cart page
   update too.

## Building the Android APK

The APK talks to the live site and signs in with the `oja://` link scheme, so
it needs no PC or Expo Go.

Built locally with the Android SDK and JDK 17 (Android Studio installs both):

```bash
npx expo prebuild --platform android      # generates ./android (git-ignored)
cd android
./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a
# → android/app/build/outputs/apk/release/app-release.apk
```

The release build is signed with the default debug key. That's fine for
sideloading and review, but not for the Play Store, which needs an upload key or
`eas build`.

Or build it in the cloud: `npx eas-cli@latest build -p android --profile preview`
(needs a free Expo account and an `eas.json` with `"buildType": "apk"`).

## Project layout

```
src/app/_layout.tsx          Providers + root stack
src/app/(tabs)/              Shop, Cart, Account (native tabs)
src/app/product/[slug].tsx   Product detail
src/app/checkout.tsx         Checkout form
src/app/orders/[id].tsx      Order detail / confirmation
src/lib/api.ts               fetch wrapper (API_URL, bearer token)
src/lib/auth.tsx             Google sign-in via the website, token storage
src/lib/cart.tsx             Cart state + Supabase Realtime subscription
```

## Checks

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```
