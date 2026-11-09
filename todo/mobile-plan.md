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
| App ID                                                                    | `com.geohearo.app`                                                | Reverse-DNS of geohearo.com plus an app suffix. Fixed once the App Store Connect record exists (app-store-ios.md step 5); until then it is a one-line change in `capacitor.config.ts` + Xcode. |

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
results panel all clear the Dynamic Island and home indicator. Android open.

---

## Phase 2 — Add Capacitor and run on devices

iOS first; Android items stay open until Android Studio is installed.

- [ ] Deploy the `netlify.toml` CORS headers to production. Until then an app
      built with the default `.env.native` (`https://geohearo.com`) cannot load
      stations; build against the draft deploy with
      `VITE_REMOTE_DATA_BASE=https://mobile-spike--geohearo.netlify.app bun run cap:sync`.

- [x] `bun add @capacitor/ios` + `bun add -d @capacitor/cli` (8.6.0)
- [ ] `bun add @capacitor/android`
- [x] `bunx cap init GeoHearo com.geohearo.app --web-dir dist-native`
- [x] `capacitor.config.ts`: `backgroundColor: "#fff9f5"` (matches manifest
      `background_color`). Type-checked via `tsconfig.node.json`.
- [ ] Android: `plugins.SystemBars.insetsHandling: "native"` so Android
      WebView < 140 (broken `env(safe-area-inset-*)`) gets native padding
      instead, per `@capacitor/core/system-bars.md`. Its Android note also asks
      for `EdgeToEdge.enable(this)` in `MainActivity.onCreate`.
- [x] `bunx cap add ios` (Swift Package Manager project, no CocoaPods). Commit
      `ios/`.
- [ ] `bunx cap add android`; commit `android/`.
- [x] Scripts: `cap:sync` (`build:native && cap sync`), `cap:ios`
      (`cap:sync && cap run ios`).
- [ ] Script `cap:android`.
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

**Accept when:** a full daily challenge and a free-play round complete on a
physical iPhone and a physical Android phone.

---

## Phase 3 — Native behaviour

Each item branches on `isNative`; web keeps the current code path.

### 3.1 App lifecycle and audio

- [ ] `bun add @capacitor/app`
- [ ] On `App` `pause`: pause the `<audio>` element and stop the static source
      (expose a `pause()` from `RadioPlayer.vue` via the game store or an event).
- [ ] On `resume`: re-run `initDailyChallenge()` so a phone left open overnight
      rolls to the new Eastern-time challenge.
- [ ] Android hardware back: `router.back()` when history exists, else
      `App.exitApp()`.

### 3.2 Persistence

- [ ] `bun add @capacitor/preferences`
- [ ] New `src/lib/persist.ts`:
  - `hydrate()` — before `app.mount` in `main.ts`, copy persisted keys from
    Preferences into `localStorage`.
  - `persist(key, value)` — write `localStorage` and (native) Preferences.
- [ ] Persisted keys: `geo_hearo_history` (`stores/game.ts`),
      `dailyChallengeDate` (`useRadio.completeDailyChallenge`), the distance
      unit (`useDistanceUnit.ts`), onboarding flags (`useOnboarding.ts`).
- [ ] `sessionStorage` (in-progress round, `useRadio.saveState`) stays as is.

**Accept when:** complete the daily, force-quit, clear Safari website data,
reopen → daily still marked complete and history intact.

### 3.3 Haptics

- [ ] `bun add @capacitor/haptics`
- [ ] `GuessPanel.vue`: replace `navigator.vibrate(200)` (no-op on iOS) with
      `Haptics.impact({ style: ImpactStyle.Medium })` on native.
- [ ] Add `Haptics.notification({ type: Success | Error })` on win/lose.

### 3.4 Share sheet

- [ ] `bun add @capacitor/share`
- [ ] `DailyChallengeCard.vue` and `useGamePlay.ts` (share results): on native
      call `Share.share({ text })`; keep `navigator.clipboard.writeText` on web.
      Button label changes from "Copy" to "Share" on native.

### 3.5 Daily reminder notification

- [ ] `bun add @capacitor/local-notifications`
- [ ] Ask permission only after the user finishes their first daily challenge
      (not at launch).
- [ ] Schedule one notification per day at a fixed **local** time (default
      09:00), text "GeoHearo #N is live". Reschedule on every launch/resume for
      the next 7 days; cancel today's if the daily is already complete.
- [ ] Settings toggle in `HamburgerMenu.vue` (on/off), stored via `persist`.

**Accept when:** with device time advanced, the notification fires once,
tapping it opens the app on Home with the new daily offered.

---

## Phase 4 — Branding assets

- [ ] Source art: 1024×1024 icon (no transparency for iOS) and a 2732×2732
      splash, derived from `public/globe.png` / `android-chrome-512x512.png`.
- [ ] `bun add -d @capacitor/assets` → `bunx capacitor-assets generate`.
- [ ] `bun add @capacitor/splash-screen @capacitor/status-bar`; hide splash
      after first route renders; status bar style matches the light theme.
- [ ] Android adaptive icon foreground/background layers.

---

## Phase 5 — Store preparation

### Accounts

- [ ] Apple Developer Program ($99/yr), App Store Connect app record for
      `com.geohearo.app`.
- [ ] Google Play Console ($25 once). New personal accounts must run a
      **closed test with ≥12 testers for 14 days** before production access —
      start this as early as Phase 2 to overlap the wait.

### Versioning

- [ ] `package.json` `version` is `0.0.0` `[code]`. Adopt semver, set
      `CFBundleShortVersionString`/`versionName` from it, and increment
      `CFBundleVersion`/`versionCode` per upload.

### Listing content

- [ ] Screenshots: 6.9" and 6.5" iPhone, 13" iPad (or mark iPhone-only), Android
      phone. Show map + guess, results modal, daily stats.
- [ ] Description, keywords, category (Games › Trivia / Word), age rating.
- [ ] Privacy policy URL: `https://geohearo.com/privacy` (exists,
      `views/Privacy.vue`). Update it to mention the apps, notifications, and
      Preferences storage.
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
- **Docs:** add a "Mobile" section to `README.md` (prereqs: Xcode, Android
  Studio, JDK; commands from Phase 2) and log each phase in `CHANGELOG.md`.

## Later (not in this plan)

- Live updates (Capgo / Appflow) to ship JS fixes without review.
- Universal links / App Links so shared `geohearo.com` links open the app.
- Lock-screen media controls + background audio.
- Desktop builds.
