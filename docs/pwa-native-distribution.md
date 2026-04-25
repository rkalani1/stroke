# Native distribution (App Store / Play Store) via Capacitor

This document covers the optional native-wrapper distribution path for the
Stroke clinical decision-support app. The PWA at
`https://rkalani1.github.io/stroke/` remains the primary distribution
channel; native wrappers are an additive option when reach into the App
Store / Play Store is desired.

> **⚠️ Regulatory gate.** Native distribution of clinical decision-support
> software triggers FDA Software-as-a-Medical-Device (SaMD) considerations
> that the educational PWA disclaimer alone may not satisfy. Decide on
> regulatory posture (clinical-decision-support exemption per 21st Century
> Cures Act §3060, "transfer-of-information" carve-out, etc.) BEFORE
> submitting to either store. Reviewers will ask.

## What was scaffolded

```
capacitor.config.json     App ID, app name, web dir, platform-specific opts
ios/                      Xcode project (open with Xcode 15+)
android/                  Android Studio project (open with AS Hedgehog+)
dist/                     Web assets staged for cap copy (gitignored)
scripts/sync-dist.sh      Rebuild dist/ from current root assets
node_modules/@capacitor/* Capacitor 8.3.1 runtime, CLI, iOS, Android
```

App ID: `com.rkalani.stroke`
App name: `Stroke`
Web dir: `dist/` (synced from repo root via `scripts/sync-dist.sh`)

## Build + run workflow

Every release loop:

```bash
# 1. Build the web app from src/
npm run build

# 2. Sync deployable assets into dist/
bash scripts/sync-dist.sh

# 3. Copy dist/ into the native projects
npx cap copy ios
npx cap copy android

# 4. Open the native IDE
npx cap open ios       # opens Xcode
npx cap open android   # opens Android Studio
```

Or in one shot (after `npm run build`):

```bash
bash scripts/sync-dist.sh && npx cap copy
```

## iOS: App Store submission checklist

### Build prerequisites
- Xcode 15+ on macOS Sonoma or later
- Apple Developer Program membership ($99 / year)
- App Store Connect access for `com.rkalani.stroke`
- CocoaPods installed (`brew install cocoapods`); `npx cap update ios`
  installs pods on first run

### App Store Review concerns
- **Category**: Medical (1502) is the canonical fit; Education (6017) is
  a less-restrictive alternative if the disclaimer adequately positions
  the app as educational. Apple Review may push back either way — be
  prepared to argue.
- **App Review Guideline 1.4.1** (medical apps): "Apps that provide
  inaccurate data or information, or that could be used for diagnosing
  or treating patients may be reviewed with greater scrutiny."
- **Disclaimer placement**: Apple wants the educational-only / not
  medical-advice / no institutional endorsement language to be visible
  immediately on launch, NOT buried. The current PWA already shows it;
  verify it survives the WKWebView wrapping.
- **In-App Purchase**: none planned. The app is free and client-side.
- **Account creation**: none — the app is single-device, no accounts.
  Reviewers like this; it eliminates HIPAA concerns at the binary.
- **Network usage**: explain in App Privacy nutrition label that the app
  loads its own assets and a few external clinician resources (ChatGPT,
  OpenEvidence, UpToDate, Asta, Regional Hospitals); no PHI is
  transmitted.

### Asset prep (do once)
- App icon: 1024×1024 PNG (Apple requires this size for App Store).
  Generate from `icon-512.png` upscaled or commission a vector source.
- Screenshots: 6.5" iPhone (1284×2778), 5.5" iPhone (1242×2208),
  12.9" iPad Pro (2048×2732). Bundle Identifier requires at least
  three screenshots per size.
- Privacy policy URL: required for medical apps. The README's privacy
  section can serve as a baseline, but consider hosting a dedicated
  page.

## Android: Play Store submission checklist

### Build prerequisites
- Android Studio Hedgehog (2023.1.1)+ with Android SDK 34+
- Java 17 (Capacitor 8 requires it; `brew install --cask
  zulu@17`)
- Google Play Console account ($25 one-time)
- App signing key — let Play Console manage it (recommended) or
  generate locally with `keytool`

### Play Store Review concerns
- **Category**: Medical, or Health and Fitness if "decision support"
  doesn't fit the Medical category criteria.
- **Content rating**: Everyone (no graphic content; clinical
  diagrams are diagnostic aids).
- **Family policy**: not opted into Designed for Families — this is a
  professional clinician tool.
- **Permissions**: minimal. Capacitor adds INTERNET only by default.
  If using camera (e.g. for image upload of CT scans — currently NOT a
  feature), document the use case clearly.
- **Sensitive permissions**: none currently. If push notifications
  are added later (e.g. for trial enrollment alerts), Play requires a
  declaration.

### Asset prep (do once)
- Adaptive icon: foreground + background layers (108×108 dp). Capacitor
  generates a placeholder; replace with a properly designed pair.
- Feature graphic: 1024×500 (Play Store listing header)
- Screenshots: 1080×1920 phone, 1280×800 7-inch tablet, 1920×1200
  10-inch tablet — at least two per form factor.

## Lighter alternatives (consider before committing to Capacitor)

| Path | Effort | Best for |
|---|---|---|
| **PWABuilder.com** | hours | Generates store packages straight from `https://rkalani1.github.io/stroke/` with no Capacitor in your repo. Worth trying first — if it produces an acceptable iOS/Android binary, skip Capacitor entirely. |
| **TWA (Trusted Web Activity)** | day | Android-only. A Chrome custom tab pointed at the live URL, packaged as an APK. Web is the source of truth; no separate build pipeline. iOS has no equivalent — Apple only allows WebKit-based wrappers. |
| **Capacitor wrapper** (this scaffold) | days | Both platforms, full WebView shell, room for native plugins (push, biometric auth) later. |

## Don't-touch list (also applies to native builds)

The native wrapper hosts the same web app. Everything in the
[don't-touch list in `pwa-and-app.md`](./pwa-and-app.md) applies:

- 22+ calculators, IndexedDB ward census, hash routing, post-tPA timer,
  LKW countdown, quick-link bar, disclaimer language, note templates,
  EVT eligibility components, etc.

The Capacitor scaffold does NOT modify any of `src/`. It only adds
`capacitor.config.json` + `ios/` + `android/` + dist sync glue.

## Rollback

If you decide native distribution is not worth the regulatory overhead:

```bash
rm -rf ios/ android/ dist/ capacitor.config.json
npm uninstall @capacitor/cli @capacitor/core @capacitor/ios @capacitor/android
rm OPTIN_NATIVE_WRAPPER
git add -A && git commit -m "chore: remove Capacitor scaffold"
```

The PWA at `https://rkalani1.github.io/stroke/` continues to serve all
three install paths (web, iOS Add-to-Home-Screen, Chrome Install).
