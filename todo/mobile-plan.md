# Mobile app plan (Capacitor)

Ship GeoHearo to the App Store and Google Play by wrapping the existing Vue/Vite
frontend with [Capacitor](https://capacitorjs.com/). The web app at geohearo.com
stays the primary product; the native build is the same code with a few
platform branches.

**Why Capacitor:** stock Vite build drops in, mature plugin set (notifications,
haptics, share, preferences), JS-only toolchain, optional live updates. Tauri v2
is viable but adds Rust for no feature we need; Wails v3 mobile is still
experimental.

**Evidence key**

- `[code]` — read from this repo.
- `[verify]` — assumption about WebView/Capacitor/Netlify behaviour that must be
  proven on a real device before building on it. Phase 0 exists for these.

---

## Architecture decisions

| Decision                                                                  | Choice                                                            | Reason                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project location                                                          | `frontend/` gets `capacitor.config.ts`, `ios/`, `android/`        | One `package.json`, one bun lockfile.                                                                                                                                                                                                              |
| Web assets in the app                                                     | Built with `vite build --mode native` into `frontend/dist-native` | Keeps `dist/` (Netlify) untouched.                                                                                                                                                                                                                 |
| Station data                                                              | **Fetched from `https://geohearo.com/data/`**, never bundled      | `public/data/stations_*.jsonl` is 234 MB `[code]`; Play caps base download at 200 MB, and a game reads 5 lines via `Range` `[code]` (`useRadio.fetchStationAt`).                                                                                   |
| `index.json`                                                              | **Also fetched remotely**                                         | Its byte offsets must match the remote `stations_*.jsonl`. A bundled copy goes stale on the next data-prep run and every station read breaks. It also keeps the daily-challenge country (seeded from `countryList`) identical between web and app. |
| `ne_countries.geojson`, `country_details_with_pics.json`, `country-pics/` | Bundled (~7 MB)                                                   | Static, small, makes the map/country UI fast.                                                                                                                                                                                                      |
| PWA (`vite-plugin-pwa`, `usePwaInstall`)                                  | Disabled in native mode                                           | Service workers don't run on `capacitor://` `[verify]`; the install button is meaningless inside an app.                                                                                                                                           |
| Background audio                                                          | **Not supported**; pause on app background                        | A guessing round needs the screen. Avoids `UIBackgroundModes` justification and an Android foreground service.                                                                                                                                     |
| Persistence                                                               | `@capacitor/preferences` mirrored into `localStorage`             | iOS may evict WKWebView storage; game history and daily-completion date must survive. Keeps existing sync `localStorage` reads unchanged.                                                                                                          |
| App ID                                                                    | `com.geohearo.app`                                                | Reverse-DNS of geohearo.com plus an app suffix. Fixed once the App Store Connect record exists (app-store-ios.md step 5); until then it is a one-line change in `capacitor.config.ts` + Xcode.                                                     |

Page origins inside the app: iOS `capacitor://localhost`, Android
`https://localhost` (Capacitor defaults).

---

## Phase 0 — De-risk spike (do first, throwaway)

Goal: prove the three things that could force a design change, before touching
real code.

- [x] Add CORS headers for `/data/*` in `netlify.toml`:

  ```toml
  [[headers]]
  for = "/data/*"
  [headers.values]
  Access-Control-Allow-Origin = "*"
  Access-Control-Allow-Headers = "Range"
  Access-Control-Expose-Headers = "Content-Range, Content-Length"
  ```

- [x] Deploy that to a Netlify draft deploy:
      `https://mobile-spike--geohearo.netlify.app` (`netlify deploy --alias mobile-spike`).
- [x] ~~Scratch Capacitor app~~ Ran the real app (Phase 2, iOS) built with
      `VITE_REMOTE_DATA_BASE=https://mobile-spike--geohearo.netlify.app`, on
      the iPhone 17 Pro simulator (iOS 26.5). Android deferred.
  - [x] Range fetch from `capacitor://localhost`: daily challenge #280 loaded
        its country and all 5 stations from the draft deploy.
  - [x] Audio: Play started the stream from a tap, and Skip started the next
        station after `await playStatic()` with no autoplay block. Evidence: UI
        left the loading state and macOS showed an active
        `iOSSimulatorAudioDevice` output assertion. Still to repeat on a
        physical iPhone (autoplay policy can differ).
  - [ ] Plausible POST from the app origin. Not observable from here (Web
        Inspector proxy shows no pages on iOS 26); the proxy's CORS preflight
        passes. Confirm in Plausible realtime after the first device run.

**Accept when:** all three work on both platforms.

**Findings (curl, 2026-11-08):**

- Live `GET /data/stations_0.jsonl` with `Range: bytes=0-799` → `206`,
  `content-range: bytes 0-799/43876936`. Range support is fine.
- Live preflight `OPTIONS /data/…` → `200` with **no** CORS headers, so the
  headers above are required in production before the app can load stations.
- Draft deploy: `OPTIONS` (`Origin: capacitor://localhost` and
  `https://localhost`) → `200` with all three `Access-Control-*` headers; the
  SPA redirect does not interfere. `GET` with `Range` → `206` with the same
  headers; `index.json` → `200` with them.
- Live preflight `OPTIONS /we-hear/for-you` → `204`,
  `access-control-allow-origin: *`, `POST` allowed (from Plausible).
- Toolchain: Xcode 26 + iOS 26.5 simulators, CocoaPods present (unused: the
  iOS project is SPM). No Android SDK.
- Toolchain on the current Mac (2026-11-09): macOS 15.2, Xcode 16.3, no iOS
  simulator runtimes, so **iOS can't build here** until macOS ≥ 15.6 and
  Xcode 26 are installed (Capacitor 8 needs Xcode 26). Android Studio 2026.2
  is installed and syncs the project (Gradle JDK: temurin-21 via
  `android/.gradle/config.properties`). The macOS 15.8.3 update download was
  started with `softwareupdate --download` (not installed). Next: install it
  (System Settings → Software Update, restart), install Xcode 26 from the App
  Store, open it once, `xcodebuild -downloadPlatform iOS`.

**If the `Range` request fails CORS:** add a Netlify Function
`/api/stations/:file/:start/:len` that reads the byte range server-side and
returns the line with `Access-Control-Allow-Origin: *` (no preflight: plain
GET). `useRadio.fetchStationAt` calls it in native mode only.

**If post-`await` playback is blocked:** set
`mediaTypesRequiringUserActionForPlayback = []` (iOS) /
`setMediaPlaybackRequiresUserGesture(false)` (Android) in the native projects
in Phase 2.

---

## Phase 1 — Make the web build native-ready (no Capacitor yet)

All changes keep the web build behaving exactly as today.

### 1.1 Platform module

- [x] `bun add @capacitor/core` (8.6.0)
- [x] New `src/lib/platform.ts`:
  - `isNative = Capacitor.isNativePlatform()`, `platform = Capacitor.getPlatform()`
  - `remoteDataUrl(path)` → `${import.meta.env.VITE_REMOTE_DATA_BASE ?? ""}/data/${path}`
  - `safeAreaInsets()` — px heights of the top and bottom insets (see 1.5).
- [x] `frontend/.env.native`: `VITE_REMOTE_DATA_BASE=https://geohearo.com`
      (web build leaves it unset → same-origin, unchanged). It also carries the
      public Supabase URL/key from `netlify.toml` (so a clean checkout builds
      the app) and blanks `VITE_DEBUG_MODE` / `VITE_SECRET_COUNTRY` /
      `VITE_GAME_STAGE` so local `.env` debug values never reach a store build.

### 1.2 Data URLs

- [x] `useRadio.loadStations`: `/data/index.json` → `remoteDataUrl("index.json")`.
- [x] `useRadio.loadCountryBySeed`: `DATA_URL` → `remoteDataUrl(\`stations\_${fileIndex}.jsonl\`)`.
- [x] Leave `useCountryData.ts` (`ne_countries.geojson`) and
      `CountryDetails.vue` (`country_details_with_pics.json`) on relative paths
      — bundled.

### 1.3 Native build mode in `vite.config.ts`

- [x] `defineConfig(({ mode }) => …)`; when `mode === "native"`:
  - `build.outDir` is `dist-native`;
  - omit `VitePWA(...)` and the `copy-404` plugin;
  - a `closeBundle` plugin deletes `stations_*.jsonl` and `index.json` from
    `dist-native/data/`;
  - a `transformIndexHtml` plugin appends `viewport-fit=cover` (see 1.5).
- [x] `package.json` script: `"build:native": "vue-tsc -b && vite build --mode native"`.
      `prebuild` (geo/JSON minify) does not run for it; it reads the
      already-minified files in `public/data`.
- [x] `.gitignore`: `dist-native`.

**Accept when:** `du -sh frontend/dist-native` is < 15 MB and `bun run build`
output is byte-identical in structure to before (still has `data/stations_*`,
`sw.js`, `404.html`).

**Result:** `dist-native` is 9.4 MB (`data/` holds only
`country_details_with_pics.json` and `ne_countries.geojson`). `dist/` file list
(hashes stripped) is identical to the previous build: 202 files, PWA precache
23 entries. Tests: 35/35.

### 1.4 Web-only features

- [x] `usePwaInstall()` skips its `beforeinstallprompt` listeners when
      `isNative` (guarded inside the composable rather than in `main.ts`,
      because `Footer.vue` also calls it); the install button never shows in
      the app.
- [x] `main.ts` Plausible: native sends `url: "https://geohearo.com" + to.fullPath`,
      `captureOnLocalhost: true` (the tracker drops events when
      `location.hostname` is `localhost`, which is the app's hostname), and
      `customProperties: { platform }` (`ios`/`android`). Web is unchanged.
  - Moved to `todo/docs-todo.md`: add `platform` as a custom property in the
    Plausible site settings.

### 1.5 Safe areas

- [x] `viewport-fit=cover` is added to `index.html` **only in the native
      build** (1.3). On the web every `env(safe-area-inset-*)` stays `0`, so
      the web layout is unchanged, including the installed PWA.
- [x] `style.css`: `--safe-top/right/bottom/left` and Tailwind utilities
      `pt-safe-N`, `pb-safe-N`, `top-safe-N`, `right-safe-N`, `bottom-safe-N`,
      `left-safe-N` (= the `N` spacing step + the inset). Applied to:
  - the fixed menu button in `Home`, `About`, `Privacy`, `PlayDesktop`,
    `PlayMobile`; page padding in `Home`, `About`, `Privacy`, `PlayDesktop`;
  - `PlayMobile` title row, bottom padding and the close-arrows hint;
  - the `HamburgerMenu` drawer; the "Skip Tour" button in `Play.vue`;
  - a `.status-bar-scrim` in `App.vue` (cloud-white strip of height
    `--safe-top`) so scrolled pages don't run under the status bar.
- [x] `PlayMobile` panel anchors use `safeAreaInsets()`: expanded heights
      subtract the top inset, collapsed heights add the bottom inset (vant
      `FloatingPanel` pads its bottom with `safe-area-inset-bottom`). The
      panel root's transparent background is painted white over that bottom
      padding, otherwise the dim overlay showed through under the panel.

**Accept when:** iPhone simulator with a notch and an Android 15 emulator show
no UI under the status bar / home indicator.

**iOS result (iPhone 17 Pro simulator):** Home, About (scrolled), Play,
expanded guess panel, menu drawer, tour "Skip" button, results modal and
results panel all clear the Dynamic Island and home indicator.

**Android result (Pixel 9 emulator, Android 15, WebView 124):** Home, Play
(tour, globe, flat map, guess row), menu drawer, results modal and share sheet
clear the status bar and gesture bar (native padding from
`insetsHandling: "native"`).

---

## Phase 2 — Add Capacitor and run on devices

iOS first. Android now builds and launches (2026-11-09): SDK via
`android-commandlinetools` + `sdkmanager` (no Android Studio wizard), JDK 21
pinned in `mise.toml` (`java = "temurin-21"`; the default `java` is 27, which
the Gradle 8.14.3 wrapper rejects with "Unsupported class file major version
71"). Setup commands are in `frontend/README.md`.

- [x] Deploy the `netlify.toml` CORS headers to production (2026-11-09,
      `b5a1ae8`; previous production tagged `v1.0.0`). `OPTIONS` and `GET` with
      `Range` on `geohearo.com/data/*` return all three `Access-Control-*`
      headers, so the default `.env.native` build now loads stations.

- [x] `bun add @capacitor/ios` + `bun add -d @capacitor/cli` (8.6.0)
- [x] `bun add @capacitor/android` (8.6.0)
- [x] `bunx cap init GeoHearo com.geohearo.app --web-dir dist-native`
- [x] `capacitor.config.ts`: `backgroundColor: "#fff9f5"` (matches manifest
      `background_color`). Type-checked via `tsconfig.node.json`.
- [x] Android: `plugins.SystemBars.insetsHandling: "native"` (+
      `initialViewportFitValueHint: "cover"`) in `capacitor.config.ts`, so
      Android WebView < 140 (broken `env(safe-area-inset-*)`) gets native
      padding instead, per `@capacitor/core/system-bars.md`.
      `MainActivity.onCreate` calls `EdgeToEdge.enable(this)` **after**
      `super.onCreate` (see the action-bar bug below).
- [x] `bunx cap add ios` (Swift Package Manager project, no CocoaPods). Commit
      `ios/`.
- [x] `bunx cap add android`; commit `android/`. The project was generated;
      only the post-add Gradle sync failed (JDK 27, see above).
- [x] Scripts: `cap:sync` (`build:native && cap sync`), `cap:ios`
      (`cap:sync && cap run ios`).
- [x] Script `cap:android` (`cap:sync && cap run android`).
- [x] Vite watch ignore and `.prettierignore` also cover `android/`.
- [x] Android: run the Phase 1.5 and smoke-test checks on an Android 15
      emulator (2026-11-09).
  - [x] SDK (platform 36, build-tools 36 + 35, emulator, platform-tools,
        `cmdline-tools;latest`, `android-35` google_apis arm64 image); AVD
        `Pixel_9_API_35`; `android/local.properties` (gitignored) points at
        the SDK.
  - [x] `mise exec -- ./gradlew assembleDebug` (in `frontend/android`)
        builds `app-debug.apk`; installed and launched (cold start ~1.1–2.5 s).
  - [x] **Fixed:** a native strip under the status bar showed "GeoH…" and
        two squashed globes. It was a framework action bar
        (`ActionBarOverlayLayout` → `android.widget.Toolbar` in `dumpsys
        activity top`): `EdgeToEdge.enable` ran before `super.onCreate`, so it
        installed the window decor while the theme was still
        `AppTheme.NoActionBarLaunch` (`Theme.SplashScreen`, which has an action
        bar; its `android:background` painted the splash into the title views).
        Calling it after `super.onCreate`, once `BridgeActivity` has switched to
        `AppTheme.NoActionBar`, removes it.
  - [x] **Fixed:** completing the daily asked for notification permission, then
        opened the system "Alarms & reminders" screen, and every return to the
        app opened it again (`resume` → `rescheduleDailyReminders` →
        `schedule`). `@capacitor/local-notifications` 8.3 defaults to
        `isExactNotification: true` and opens that screen on Android 12+ when
        exact alarms aren't allowed. Reminders now set
        `isExactNotification: false`; Android may deliver them up to 1 h late
        (alarm window 09:00 +1h in `dumpsys alarm`).
  - [x] Play → stations load from geohearo.com, audio plays (two `started`
        AAudio players in `dumpsys audio`; the emulator ran `-no-audio`, so not
        heard). Guess → win (daily #281), results modal, daily stats bar chart,
        share sheet ("GeoHearo #281 / https://geohearo.com/ / 🟢"). Haptics
        `impact` and `notification SUCCESS` reach the plugin (logcat; not felt).
  - [x] Hardware back: `/about` → `/` → exits the app (real taps). Entries
        pushed from DevTools without a user gesture are skipped by WebView
        history, so `canGoBack` is false there; test back with taps.
  - [x] Notification permission prompt (Android 13+) appears over the results
        modal after the first completed daily.
  - Tooling notes: start the emulator with `-gpu host` (the default
    software renderer made `adb` screencap/shell time out). WebView DevTools:
    `adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>`, then
    `http://127.0.0.1:9222/json`; `Runtime.evaluate` over its WebSocket drives
    the app (Pinia: `document.querySelector('#app').__vue_app__.config.globalProperties.$pinia`).
- [x] Dev loop: `CAP_SERVER_URL=http://<lan-ip>:5173` sets `server.url`
      (+ `cleartext: true`) in `capacitor.config.ts` only when set. Serve with
      `bun run dev:native` (`vite --host --mode native`): plain `bun run dev`
      lacks `viewport-fit=cover`, so the page ignores the safe areas. Vite now
      ignores `ios/**` for file watching and the dependency scan (`cap sync`
      writes copies of `index.html` there, which triggered reloads). Verified:
      simulator loaded the dev server and played the daily.
- [x] `.prettierignore`: add `ios/` (Xcode-owned JSON) next to `public/data`.
- [x] Phase 0 autoplay settings: not needed on the iOS simulator.

### Smoke test on both platforms

iOS simulator status (iPhone 17 Pro, iOS 26.5, draft-deploy data):

- [x] Home → Play → stations load, audio plays, skip station works.
- [ ] Static noise (`utils/audio.ts`) plays on station change. Not audible
      from the automation; check by ear on a device. On iOS, Web Audio follows
      the mute switch `[verify]`; acceptable.
- [x] Map tiles (ArcGIS) and glyphs render (results map with labels).
- [x] Guess, win, results modal, daily stats bar chart (Supabase). Lose not
      run.
- [ ] Deep routes survive reload. Not testable on iOS: a relaunch always
      starts at `/`.
- [x] External links (station "Visit website") open in Safari with a
      "◀ GeoHearo" back link, not inside the app view.
- [x] Driver.js onboarding tours (play, results) fit the screen.
- First paint on a cold launch: ~2 s; the first launch after a simulator boot
  took ~8 s.
- Completing a daily in a test build posts a real result to the production
  Supabase daily stats (daily #281 on 2026-11-09 has one test result, 1 guess).
  The Android run added a second (1 guess).

Android emulator status (Pixel 9, Android 15, production data): stations,
audio (player state only), guess/win, results, stats, share, back, pause on
background all pass; see the Phase 2 Android item. Skip station passes
(station index and `<audio>` source change on each tap; an unreachable
stream triggers the loading-timeout auto-skip). A free-play round (Kenya,
2 guesses) also completed.

**Accept when:** a full daily challenge and a free-play round complete on a
physical iPhone and a physical Android phone.

---

## Phase 3 — Native behaviour

Goal: the web app works as well as the app. App-only features branch on
`isNative`; where the web has an equivalent it gets it too (3.6). App-wide
wiring lives in `src/lib/nativeApp.ts` (`setupNativeApp(router)`, called from
`main.ts` after mount).

**iOS simulator results (2026-11-09, production data):** recorded under each
item. Android emulator results are noted where run.

### 3.1 App lifecycle and audio

- [x] `bun add @capacitor/app` (8.1.2)
- [x] On `App` `pause`: `useGamePlay` sets `isPlaying = false`, and
      `RadioPlayer`'s existing watcher pauses the `<audio>` element and stops
      the static. Simpler than exposing a `pause()` from `RadioPlayer`.
      Verified: playing → Home button → reopen shows the player stopped (iOS;
      Android: `<audio>` `paused` false → true across Home/reopen).
- [x] On `resume`: when the Eastern-time challenge number differs from the one
      at launch, `window.location.replace("/")` restarts on Home. Re-running
      `initDailyChallenge()` alone is not enough: `Play` only picks the daily
      on mount. Not exercised (needs the clock to cross Eastern midnight)
      `[verify]`.
- [x] Android hardware back: `router.back()` when the event's `canGoBack`,
      else `App.exitApp()`. Verified on the Android emulator.

### 3.2 Persistence

- [x] `bun add @capacitor/preferences` (8.0.1)
- [x] New `src/lib/persist.ts`:
  - `hydrate()` — before `app.mount` in `main.ts`, copies persisted keys from
    Preferences into `localStorage`; a key only in `localStorage` is backed up
    to Preferences.
  - `persist(key, value)` / `unpersist(key)` — write `localStorage` and
    (native) Preferences.
  - `useDistanceUnit` now reads its saved unit on first use instead of at
    module import, which ran before `hydrate()`.
- [x] Persisted keys (`PERSISTED_KEYS`): `geo_hearo_history`,
      `dailyChallengeDate`, `geo_hearo_distance_unit`, the two onboarding
      flags, and `geo_hearo_daily_reminder` (3.5).
- [x] `sessionStorage` (in-progress round, `useRadio.saveState`) stays as is.

**Accept when:** complete the daily, force-quit, clear Safari website data,
reopen → daily still marked complete and history intact.

**Result:** passed on the simulator. Won daily #281, terminated the app,
deleted its `Library/WebKit` (where `localStorage` lives), relaunched: Free
Play mode (daily complete), trophy button (daily history), no onboarding tour,
reminder toggle still on. The values are in
`Library/Preferences/com.geohearo.app.plist` under `CapacitorStorage.*`.

### 3.3 Haptics

- [x] `bun add @capacitor/haptics` (8.0.2)
- [x] `GuessPanel.vue`: `Haptics.impact({ style: ImpactStyle.Medium })` on
      native; `navigator.vibrate(200)` stays on the web.
- [x] `Haptics.notification({ type: Success | Error })` on win/lose
      (`useGamePlay.finishRound`).
- [ ] Feel both on a physical phone (the simulator has no haptics).

### 3.4 Share sheet

- [x] `bun add @capacitor/share` (8.0.3)
- [x] `DailyChallengeCard.vue`: on native `Share.share({ text })` (dismissing
      the sheet is not an error); `navigator.clipboard.writeText` on the web.
      Label "Share score" on native, "Copy shareable score" on the web.
      `useGamePlay`'s `handleShare`/`generateShareText` were never called and
      are removed. Verified: the share sheet opens with the "GeoHearo #281"
      text (first presentation takes ~3 s on the simulator).

### 3.5 Daily reminder notification

- [x] `bun add @capacitor/local-notifications` (8.3.1); `src/lib/dailyReminder.ts`.
- [x] Permission is asked only after the first completed daily
      (`finishRound` → `offerDailyReminder()`); the answer sets the toggle.
      Verified: the iOS prompt appears over the results modal.
- [x] One notification per day at 09:00 **local**, "GeoHearo #N is live",
      where N is the challenge live at that moment (Eastern time). All pending
      reminders are replaced on launch, resume, daily completion and toggle,
      for the next 7 days; a reminder whose challenge is already completed is
      skipped (today's, once the daily is done). Notification id = challenge
      number. Verified: after winning #281 at 00:30, seven pending
      notifications #282–#288, Tue–Mon at 09:00. On Android they are inexact
      alarms (`isExactNotification: false`, see the Phase 2 Android item):
      delivered between 09:00 and ~10:00, no exact-alarm permission needed.
- [x] "Daily reminder" switch in `HamburgerMenu.vue` (app only), stored via
      `persist`. If permission is denied it stays off and says to enable
      notifications in Settings. Verified: off cancels all pending, on
      schedules the seven again. Denied path not run.
- [x] Tapping a notification navigates to `/` (`nativeApp.ts`). Verified on
      Android: a test notification fired with the app in the background,
      tapping it opened `/` (from `/about`). Menu toggle off → 0 pending, on → 7.

**Accept when:** with device time advanced, the notification fires once,
tapping it opens the app on Home with the new daily offered.

**Status:** open. The simulator follows the Mac clock; check on a device by
setting the time past 09:00.

### 3.6 Web parity

The web gets each feature that has a browser equivalent.

- [x] Day rollover: `lib/dayRollover.ts` `createDayRolloverCheck()` is shared.
      The app runs it on `App` `resume`, the web on `visibilitychange` →
      visible (`watchTabDayRollover()` in `main.ts`). A tab left open past
      Eastern midnight used to keep yesterday's round under today's number.
      Verified in Chromium with a faked clock: same-day return stays on
      `/about`, next-day return restarts on `/`.
- [x] Share: phone browsers (`navigator.share` + `(pointer: coarse)`) open
      the Web Share sheet, labelled "Share score"; desktop keeps "Copy
      shareable score" (clipboard). A failed share falls back to copying.
      Verified in Chromium: desktop copies, phone calls `navigator.share`
      with the same text.
- [x] Vibration: `lib/haptics.ts` (`guessFeedback`, `roundResultFeedback`)
      serves both; the web uses `navigator.vibrate` (Android browsers: 200 ms
      on a guess, two short pulses on a win, one long buzz on a loss; iOS
      Safari has no vibration).
- Not mirrored: settings persistence (browsers don't evict a site's
  `localStorage` the way WKWebView can; Safari clears it only after 7 days
  without a visit), pausing audio when hidden (a background tab playing is
  normal on the web), daily reminders (see Later).

---

## Phase 4 — Branding assets

- [x] Source art in `frontend/assets/`: `icon-only.png` (1024×1024 RGB, the
      GH logo from `android-chrome-512x512.png` upscaled onto `#0000ff`; no
      vector source exists, so a crisper redraw is optional), `splash.png`
      (2732×2732, `globe.png` on `#fff9f5`).
- [x] `bun add -d @capacitor/assets` (4.0.0); script `cap:assets`
      (`capacitor-assets generate --ios --android --assetPath assets`).
      Replaced the Capacitor placeholder icon and splash.
- [x] `bun add @capacitor/splash-screen` (8.0.2): `launchAutoHide: false`,
      `nativeApp.ts` hides it once the first route resolves.
- [x] Status bar: no `@capacitor/status-bar` needed. Capacitor 8 core's
      `SystemBars` takes `style: "LIGHT"` (dark text), and `Info.plist`
      `UIStatusBarStyle = UIStatusBarStyleDarkContent` covers the launch
      screen. Without it, phones in dark mode showed white text over the
      light status-bar scrim.
- [x] Android adaptive icon foreground/background layers (generated, not yet
      seen on a device).
- [x] Android notification small icon: `res/drawable-{mdpi…xxxhdpi}/ic_stat_geohearo.png`
      (white GH on transparent, 24–96 px, cut from `assets/icon-foreground.png`),
      set as `plugins.LocalNotifications.smallIcon` with `iconColor:
      "#0000ff"` in `capacitor.config.ts`. Seen on Android: the shade shows the
      white GH on a blue circle.

**iOS result (iPhone 17 Pro simulator, dark mode):** home-screen icon is the
blue GH logo; launch shows the globe splash until Home renders (no blank
cream gap); status bar text is dark.

---

## Phase 5 — Store preparation

### Accounts

- [ ] Apple Developer Program ($99/yr), App Store Connect app record for
      `com.geohearo.app`.
- [ ] Google Play Console ($25 once). New personal accounts must run a
      **closed test with ≥12 testers for 14 days** before production access —
      start this as early as Phase 2 to overlap the wait.

### Versioning

- [x] Semver from `package.json` `version` (`1.0.0`); Xcode `MARKETING_VERSION`
      and Android `versionName` set to match by hand (Capacitor doesn't sync
      them). Increment Xcode `CURRENT_PROJECT_VERSION` / Android
      `versionCode` per upload.

### Listing content

- [ ] Screenshots: 6.9" iPhone (iPhone-only for 1.0; 6.5" is scaled from it),
      Android phone. Show map + guess, results modal, daily stats.
  - [x] Android phone: 7 shots in `store/screenshots/android-phone/`
        (1080×1920, 24-bit PNG, demo-mode status bar at 9:41). Play rejects
        screenshots whose long side is over twice the short side, so the
        Pixel 9's native 1080×2424 doesn't qualify; taken with
        `adb shell wm size 1080x1920` (reset with `wm size reset`). The daily
        stats shot shows "2 players"; retake after launch for a fuller chart.
  - [ ] iOS 6.9": blocked on Xcode 26 on this Mac (see Phase 0 toolchain).
        Plan: iPhone 17 Pro Max simulator (1320×2868), status bar overridden
        to 9:41 / full battery (`xcrun simctl status_bar … override`), saved
        under `store/screenshots/ios-6.9/` (path assumed by
        `todo/store-listing.md`).
- [x] Play hi-res icon: `store/play-icon-512.png` (512×512, 32-bit PNG).
- [x] Play feature graphic: `store/feature-graphic.png` (1024×500, no
      alpha), source `store/feature-graphic.html` (globe + tagline).
- [ ] Description, keywords, category, age rating: **drafted** in
      `todo/store-listing.md` (also subtitle, Play short description,
      promotional text, privacy/Data safety answers, Play "App content"
      declarations). Needs your review before pasting into the stores.
- [x] Privacy policy (`views/Privacy.vue`) rewritten: no accounts/ads,
      Plausible page views (+ app platform), Supabase daily stats (date +
      guess count), on-device storage, local-only reminders, third-party
      streams/tiles/fonts, contact email. Live after the next production
      deploy.
- [x] Support contact: "Contact" section on About
      (`bronco-eaten-bash@duck.com`), so the Support URL is
      `https://geohearo.com/about`. Live after the next production deploy.
- [ ] App Store privacy label / Play Data safety form: Plausible (anonymous,
      no identifiers), Supabase (anonymous aggregate daily counts), no account.

### Review risks

- **Apple 4.2 (minimum functionality):** reviewers reject thin website
  wrappers. Review notes should list the native features: daily local
  notifications, haptics, native share sheet, bundled map/country data.
- **Third-party radio streams:** the app plays streams discovered via
  Radio Garden / RadioBrowser. Expect a question about content rights; answer
  that the app links to publicly broadcast streams without recording or
  redistributing them, like other radio-directory apps. Decide whether to
  credit sources in the listing (already credited in About).

---

## Phase 6 — Release

- [ ] iOS: Xcode archive → TestFlight (internal) → external TestFlight →
      submit.
- [ ] Android: signed AAB (upload key in a password manager; enrol in Play App
      Signing) → internal testing → closed testing (12 testers / 14 days) →
      production.
  - [x] Release signing: `app/build.gradle` signs `release` with
        `android/keystore.properties` (gitignored, with `*.jks`) when it
        exists. Upload key generated 2026-11-09:
        `~/.config/geohearo/geohearo-upload.jks`, alias `upload`, RSA 4096,
        password in the macOS Keychain (`geohearo-android-upload-key`). Back
        both up to a password manager; Play App Signing can reset a lost
        upload key, but not before enrolment.
  - [x] `./gradlew bundleRelease` → `app/build/outputs/bundle/release/app-release.aab`
        (12 MB, signed: `keytool -printcert -jarfile` shows `CN=Dustin
        Michels`). The release APK installs and launches on the emulator.
- [ ] After launch: the web app's footer/About gains App Store / Play badges;
      `usePwaInstall` stays for web users.

---

## Ongoing maintenance

- **Data refreshes:** no app release needed — `index.json` and
  `stations_*.jsonl` are fetched from geohearo.com. Rule: deploy new
  `index.json` and new `stations_*.jsonl` in the same Netlify deploy (already
  the case).
- **Bundled-data changes** (`ne_countries.geojson`, `country_details_with_pics.json`,
  `country-pics/`) and any code change require a store release.
- **Release checklist:** `bun run test` → `bun run cap:sync` → smoke test
  (Phase 2 list) on both devices → bump versions → upload.
- **Docs:** prereqs and commands live in "Mobile app" in `frontend/README.md`;
  the root `README.md` points there. Log each phase in `CHANGELOG.md`.

## Later (not in this plan)

- Live updates (Capgo / Appflow) to ship JS fixes without review.
- Universal links / App Links so shared `geohearo.com` links open the app.
- Web push daily reminders: needs a push service (VAPID keys, a scheduled
  sender, e.g. a Netlify scheduled function) and a push-capable service
  worker; on iOS only for sites added to the Home Screen.
- Lock-screen media controls + background audio.
- Desktop builds.
