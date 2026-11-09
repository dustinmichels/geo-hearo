# App Store (iOS) submission checklist

Follows [mobile-plan.md](mobile-plan.md). That plan builds the app; this is the
Apple-side work to get it listed. It expands Phase 5 (Store preparation) and
Phase 6 (Release) for iOS only. Android/Play is out of scope here.

Steps marked **(early)** don't depend on the app being finished. Do them
alongside mobile-plan Phase 0–2 so account problems surface early.

---

## 1. Account (early)

- [ ] Sign in at <https://developer.apple.com/account> → **Membership
      details**: status is active, note the **Team ID** and renewal date.
      If the membership lapses, the app is removed from sale.
- [ ] Check the enrolment type. **Individual** → the store shows your legal
      name as the seller. **Organization** → shows the company name but needs
      a D-U-N-S number and re-enrolment. Pick now; switching later is slow.
- [ ] Accept any pending agreements in the developer account and in
      [App Store Connect](https://appstoreconnect.apple.com) → **Business**.
      Uploads fail while an updated Program License Agreement is unaccepted.
- [ ] App Store Connect → **Business**: set **EU Digital Services Act trader
      status**. Required to distribute in the EU. "Trader" publishes your
      address, phone and email on the listing; a free, non-commercial app can
      usually declare non-trader. Decide before submission.
- [ ] Paid Apps Agreement, tax and banking forms: **not needed** for a free
      app with no in-app purchases. Skip.

## 2. Mac toolchain (early)

- [ ] Xcode **26 or later**. Since 2026-04-28, App Store Connect only accepts
      builds made with Xcode 26 and the iOS 26 SDK
      ([Apple](https://developer.apple.com/news/upcoming-requirements?id=02032026a)).
- [ ] Xcode → Settings → Accounts: add your Apple ID; the team appears.
- [ ] A physical iPhone registered for development (Xcode does this the first
      time you run on it with automatic signing).

## 3. Name and bundle ID (early)

- [ ] Confirm the **App Store name** "GeoHearo" is free: names are unique
      store-wide (max 30 chars). Creating the app record (step 5) reserves it.
- [ ] Bundle ID `com.geohearo.app` (fixed by mobile-plan). Xcode automatic
      signing registers it under Certificates, Identifiers & Profiles. No
      extra capabilities needed: local notifications do **not** need the Push
      Notifications capability.

## 4. Xcode project settings

Done once in `frontend/ios/App` after mobile-plan Phase 2–4. Commit the result.

- [ ] Target **App** → Signing & Capabilities: Team = your team, "Automatically
      manage signing" on.
- [ ] General:
  - Display Name `GeoHearo`.
  - Supported destinations: decide **iPhone only** or iPhone + iPad. iPad
    support means iPad screenshots and iPad layout review (mobile-plan Phase 5
    already flags this).
  - Orientation: portrait only unless landscape is tested.
  - Version (`CFBundleShortVersionString`) and Build (`CFBundleVersion`) per
    mobile-plan Phase 5 "Versioning". Every upload needs a new Build number.
- [ ] `Info.plist`: `ITSAppUsesNonExemptEncryption` = `NO`. The app only uses
      HTTPS (exempt), so this skips the export-compliance question on every
      build.
- [ ] Privacy manifest: Xcode → File → New File → **App Privacy File**
      (`PrivacyInfo.xcprivacy`, App target). `@capacitor/preferences` uses
      `UserDefaults`, a required-reason API; without a declaration the upload
      gets an ITMS-91053 rejection
      ([Capacitor docs](https://capacitorjs.com/docs/ios/privacy-manifest)):
  ```xml
  <key>NSPrivacyTracking</key><false/>
  <key>NSPrivacyTrackingDomains</key><array/>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array><string>CA92.1</string></array>
    </dict>
  </array>
  ```
  Re-check after adding any plugin (the warning email lists missing APIs).
- [ ] App icon: the 1024×1024 asset from mobile-plan Phase 4 has **no alpha
      channel** (upload validation rejects transparency).

## 4b. Website prerequisites

- [ ] **Support URL** (required field): a page on geohearo.com with a way to
      reach you. No contact address exists in `frontend/src` today; add an
      email to About or a `/support` page.
- [ ] **Privacy policy** update (mobile-plan Phase 5): mention the iOS app,
      local notifications, on-device storage, Plausible, and the anonymous
      Supabase daily counts (`increment_daily_stats` in `lib/supabase.ts`).
      Must be live before submitting.

## 5. App Store Connect app record

App Store Connect → Apps → **+** → New App:

- [ ] Platform iOS, Name `GeoHearo`, primary language English (U.S.), Bundle
      ID `com.geohearo.app`, SKU e.g. `geohearo-ios` (internal, permanent),
      User Access: Full Access.

Then fill in each section:

### App Information

- [ ] Subtitle (≤30 chars), e.g. "Guess the country by radio".
- [ ] Category: primary **Games**, subcategories **Trivia** (and optionally
      Educational / Word).
- [ ] **Content rights**: answer "Yes, it contains/accesses third-party
      content" (live radio streams) and confirm you have the rights to use it.
      Basis: the app plays publicly broadcast streams, never records or
      redistributes them (see Review notes below).
- [ ] **Age rating** questionnaire. Answer honestly; note the radio streams
      are live, unmoderated third-party audio. If a question covers
      unrestricted/user-generated or third-party content, answering yes may
      raise the rating. That's acceptable; a wrong answer is a rejection.

### Pricing and Availability

- [ ] Price: Free. Availability: all countries (or exclude any; EU requires
      the DSA status from step 1).

### App Privacy

- [ ] Privacy Policy URL: `https://geohearo.com/privacy`.
- [ ] Data collection questionnaire. Suggested answers, verify against the
      final code:
  - **Usage Data → Product Interaction** (Plausible page views/events,
    Supabase daily guess counts): collected, **not linked** to identity,
    **not used for tracking**, purpose Analytics.
  - No contact info, identifiers, location, or diagnostics, unless a crash
    reporter is added later.
  - Tracking: **No** → no App Tracking Transparency prompt needed.

### Version page (1.0)

- [ ] Screenshots (portrait PNG/JPEG, no alpha, 1–10 per size):
  - iPhone **6.9"**: 1320×2868 (iPhone 16/17 Pro Max simulator). Smaller
    iPhone sizes are scaled from it.
  - iPad **13"**: 2064×2752, only if iPad is supported.
  - Shots per mobile-plan Phase 5: map + guess, results modal, daily stats.
- [ ] Optional app preview video (15–30 s; sound on is a good fit here).
- [ ] Promotional text (≤170), Description (≤4000), Keywords (≤100 chars,
      comma-separated, no spaces after commas, don't repeat the app name).
- [ ] Support URL (step 4b), Marketing URL `https://geohearo.com` (optional),
      Copyright e.g. `2026 <your name>`.

## 6. Build and upload

- [ ] Bump Version/Build, then `bun run cap:sync` (from `frontend/`).
- [ ] Open the iOS project in Xcode (`bunx cap open ios`).
- [ ] Destination **Any iOS Device (arm64)** → Product → **Archive**.
- [ ] Organizer → **Distribute App** → App Store Connect → Upload. Fix any
      validation errors (icons, privacy manifest, Info.plist) and re-archive
      with a new Build number.
- [ ] Wait for processing (minutes to ~1 h); the build appears under
      TestFlight. Watch email for ITMS warnings.

## 7. TestFlight

- [ ] **Internal testing** (you + up to 100 team members, no review): install
      via the TestFlight app, run the mobile-plan Phase 2 smoke test on a
      physical iPhone, plus a daily-reminder notification.
- [ ] **External testing** (optional, up to 10,000 by email or public link):
      needs Beta App Review (usually ≤1 day), a beta description and feedback
      email. Good for catching stream/region issues before public review.

## 8. Submit for review

On the 1.0 version page:

- [ ] Select the build.
- [ ] **App Review Information**: contact name, phone, email. Sign-in
      required: **No**.
- [ ] **Review notes** (this is where 4.2 and content questions are won):
  - Native features: daily local notification reminder, haptics on
    guess/win/lose, native share sheet for results, map and country data
    bundled in the app, offline-safe game history.
  - How to test: "Tap Play, listen to the station, pick a country on the map.
    If a station is silent, tap skip; streams are live third-party broadcasts."
  - Content: the app plays publicly broadcast internet radio streams listed
    in public directories (credit sources as in About); it does not record,
    download, or redistribute audio. Relevant guideline: 5.2.3.
- [ ] Version release: **Manually release this version** for 1.0, so you
      control launch timing.
- [ ] **Add for Review** → **Submit**.

## 9. Review outcome

- Typical turnaround is 1–2 days. Replies go through the App Review messages
  in App Store Connect.
- Likely rejection reasons and responses:
  - **4.2 Minimum functionality** ("repackaged website"): reply pointing to
    the native features; if it holds, add more native value (e.g. widgets for
    the daily) before resubmitting.
  - **5.2.3 / content rights**: explain the directory model; be ready to show
    that stations are public broadcasts and to remove any station on request.
  - **2.1 App completeness**: reviewer hit a dead stream or no audio. Make
    sure skip works and the first stations load fast on a cold start.
  - **5.1.1 Privacy**: privacy label, privacy policy, and actual network
    calls must agree.
- [ ] On approval: **Release This Version**. It goes live within ~24 h.

## 10. After launch

- [ ] App Store badge on the website (mobile-plan Phase 6). Use Apple's
      official badge artwork per the
      [marketing guidelines](https://developer.apple.com/app-store/marketing/guidelines/).
- [ ] Optional: Smart App Banner on geohearo.com:
      `<meta name="apple-itunes-app" content="app-id=<numeric id>">`
      (numeric ID is on the App Information page).
- [ ] Each update: new Version + Build → archive → upload → "What's New" text
      → submit. Follow mobile-plan "Release checklist".
- [ ] Calendar reminder for the yearly $99 renewal.
