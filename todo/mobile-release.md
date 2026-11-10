# Mobile release (iOS and Android)

What is left to ship GeoHearo 1.0 to the App Store and Google Play. Merges the
open items of the former `mobile-plan.md` and `app-store-ios.md`.

**Done** (details in `CHANGELOG.md` 2026-11-08/09; setup and build commands in
"Mobile app" in `frontend/README.md`): native build mode, Capacitor iOS and
Android projects, safe areas, lifecycle/persistence/haptics/share/daily
reminder, web parity, icons and splash, Xcode release settings and privacy
manifest, Android upload key and signed AAB, Play graphics and 7 Android
screenshots, draft store copy in [store-listing.md](store-listing.md).
Simulator/emulator smoke tests pass on iPhone 17 Pro (iOS 26.5) and Pixel 9
(Android 15).

---

## Decisions (reference)

| Decision         | Choice                                                                      | Reason                                                                                                               |
| ---------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Station data     | `index.json` + `stations_*.jsonl` fetched from `https://geohearo.com/data/` | 234 MB; byte offsets in `index.json` must match the remote chunks; keeps the daily country identical on web and app. |
| Bundled data     | `ne_countries.geojson`, `country_details_with_pics.json`, `country-pics/`   | Static, ~7 MB. Changing them needs a store release.                                                                  |
| Background audio | Not supported; audio pauses on app background                               | Avoids `UIBackgroundModes` justification and an Android foreground service.                                          |
| App ID           | `com.geohearo.app`                                                          | Permanent once the App Store Connect record exists.                                                                  |
| Devices          | iPhone only, portrait only                                                  | iPad can be added later; it can't be removed once shipped.                                                           |

---

## 1. Toolchain and accounts (do early)

- [x] iOS simulator runtime: iOS 27.2 installed (`xcodebuild -downloadPlatform iOS`).
- [x] `DEVELOPMENT_TEAM = LLM5F36KYW` set for target **App** (Debug and
      Release) in `project.pbxproj`; signing stays automatic.
- [ ] Xcode → Settings → Accounts: add the Apple ID (no signing identity on
      this Mac yet). Then open Signing & Capabilities once so Xcode creates the
      Apple Development certificate and provisioning profile.
- [ ] Register a physical iPhone (first run with automatic signing does it).
- [x] Apple Developer Program: **Individual** (legal name shown as seller),
      Team ID `LLM5F36KYW`. Still note the renewal date (§6).
- [ ] Accept pending agreements (developer account and App Store Connect →
      Business). Uploads fail while one is unaccepted.
- [ ] App Store Connect → Business → EU DSA: declare **non-trader** (decided).
- [x] Google Play Console account exists (personal, new): the **closed test
      with ≥12 testers for 14 days** applies before production access. Start
      it as soon as possible (§5) to overlap the wait; recruit testers now.
- Not needed: Paid Apps Agreement, tax/banking (free, no IAP), Push
  Notifications capability (reminders are local).

## 2. Production deploy of `dev`

Deployed: `main` fast-forwarded to `dev` (`b0bbae9`) on 2026-11-09. Live
bundle contains the new About "Contact" copy; `/about` and `/privacy` deep
links return 200.

- [x] Deploy `dev` to production.
- [x] Check `https://geohearo.com/about` shows the "Contact" section (Support
      URL) and `https://geohearo.com/privacy` the rewritten policy.
- [x] Deep link `/about` still loads (the `copy-404` Vite plugin was removed;
      `netlify.toml` rewrites `/*` to `/index.html`).
- [ ] Plausible → Site settings → **Custom properties**: add `platform`. The
      app sends it on every event (`ios` / `android`, `main.ts`
      `customProperties`); it is recorded either way but only shows once added.

## 3. Physical-device checks

Simulator and emulator can't cover these. Run on a physical iPhone and a
physical Android phone (TestFlight / Play internal testing builds work).

- [ ] A full daily challenge and a free-play round complete on both. Include a
      lose (never run).
- [ ] iPhone: Skip starts the next station after `await playStatic()` with no
      autoplay block. If blocked, set `mediaTypesRequiringUserActionForPlayback = []`
      (iOS) / `setMediaPlaybackRequiresUserGesture(false)` (Android).
- [ ] Static noise (`utils/audio.ts`) is audible on station change (follows
      the iOS mute switch; acceptable).
- [ ] Haptics felt on a guess and on win/lose.
- [ ] Daily reminder: set the device time past 09:00; the notification fires
      once and tapping it opens Home with the new daily. Also run the
      permission-denied path (toggle stays off with the Settings hint).
- [ ] Resume after Eastern midnight restarts on Home with the new daily.
- [ ] Plausible realtime shows an event from the app with `platform`.
- [ ] Android adaptive icon looks right on the launcher.

## 4. App Store

### App record (App Store Connect → Apps → +)

- [x] iOS, name `GeoHearo` (unique store-wide; creating the record reserves
      it), English (U.S.), bundle ID `com.geohearo.app`, SKU `geohearo-ios`.
      Explicit App ID registered in the developer portal.
- [ ] App Information: subtitle, category, content rights ("Yes",
      third-party live streams), age rating. Answers in
      [store-listing.md](store-listing.md).
- [ ] Pricing and Availability: Free, all countries (EU needs the DSA status).
- [ ] App Privacy: policy URL and data questionnaire per store-listing.md
      (must match `PrivacyInfo.xcprivacy`; re-check after adding a plugin).
- [ ] Version 1.0 page: promotional text, description, keywords, support and
      marketing URLs, copyright (store-listing.md).
- [ ] Screenshots, iPhone 6.9" (1320×2868): iPhone 17 Pro Max simulator, status
      bar at 9:41 / full battery (`xcrun simctl status_bar … override`), saved
      to `store/screenshots/ios-6.9/`. Shots: map + guess, results modal, daily
      stats. Optional 15–30 s preview video.

### Build, TestFlight, review

- [x] Build 1.0.0 (1) archived and uploaded from the CLI (2026-11-09;
      commands in "Mobile app" in `frontend/README.md`, `ios/ExportOptions.plist`).
      Next upload: bump `CURRENT_PROJECT_VERSION` to 2 first. Watch email for
      ITMS warnings.
- [ ] TestFlight internal testing: run §3 on the iPhone.
- [ ] Optional external TestFlight (Beta App Review, beta description,
      feedback email) to catch stream/region issues.
- [ ] Select the build; App Review Information (contact, sign-in **No**);
      review notes from store-listing.md; **Manually release this version**;
      Submit.
- [ ] On approval: Release This Version (live within ~24 h).

Likely rejections: **4.2** "repackaged website" (reply with the native
features; add e.g. a daily widget if it holds), **5.2.3** content rights
(directory model, remove stations on request), **2.1** dead stream / no audio
(skip works, first stations load fast on cold start), **5.1.1** privacy label,
policy and network calls must agree.

## 5. Google Play

- [ ] Create the app; store listing from store-listing.md (short and full
      description, `store/play-icon-512.png`, `store/feature-graphic.png`,
      `store/screenshots/android-phone/`).
- [ ] Data safety, App content declarations, IARC questionnaire, target
      audience 13+ (store-listing.md).
- [ ] Enrol in Play App Signing; upload `app-release.aab`
      (`./gradlew bundleRelease`, bump `versionCode`).
- [ ] Internal testing → closed testing (12 testers / 14 days) → production.
- [ ] Back up the upload key (`~/.config/geohearo/geohearo-upload.jks`,
      Keychain `geohearo-android-upload-key`) to a password manager. A lost key
      can only be reset after Play App Signing enrolment.

## 6. After launch

- [ ] App Store and Play badges in the web footer/About (Apple's official
      badge artwork); `usePwaInstall` stays for web users.
- [ ] Optional Smart App Banner: `<meta name="apple-itunes-app" content="app-id=<numeric id>">`.
- [ ] Retake the Android daily-stats screenshot (shows "2 players").
- [ ] Calendar reminder for the yearly $99 Apple renewal.

---

## Each release

`bun run test` → bump `package.json` `version`, Xcode `MARKETING_VERSION` /
`CURRENT_PROJECT_VERSION`, Android `versionName` / `versionCode` →
`bun run cap:sync` → smoke test on both devices → archive/upload → "What's
New" text → submit.

- Data refreshes need no app release: `index.json` and `stations_*.jsonl` are
  fetched remotely. Deploy both in the same Netlify deploy.
- Bundled-data changes and any code change need a store release.
- Test builds post real results to the production Supabase daily stats.

## Later (not planned)

- Live updates (Capgo / Appflow) to ship JS fixes without review.
- Universal links / App Links so shared `geohearo.com` links open the app.
- Web push daily reminders (VAPID keys, scheduled sender, push-capable service
  worker; iOS only for Home Screen web apps).
- Lock-screen media controls + background audio.
- Desktop builds.
