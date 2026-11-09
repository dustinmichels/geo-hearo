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
| App ID                                                                    | `com.geohearo.app`                                                | Permanent once published; decide before Phase 2.                                                                                                                                                                                                   |

Page origins inside the app: iOS `capacitor://localhost`, Android
`https://localhost` (Capacitor defaults).

---

## Phase 0 — De-risk spike (do first, throwaway)

Goal: prove the three things that could force a design change, before touching
real code.

- [ ] Add CORS headers for `/data/*` in `netlify.toml` and deploy to a Netlify
      branch deploy:
      `toml
    [[headers]]
    for = "/data/*"
    [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Headers = "Range"
    Access-Control-Expose-Headers = "Content-Range, Content-Length"
    `
- [ ] Scratch Capacitor app (`bunx cap init` in a temp dir) whose page does,
      from an iOS **device** and an Android emulator:
  - [ ] `fetch("https://<branch>.netlify.app/data/stations_0.jsonl", { headers: { Range: "bytes=0-799" } })`
        → status 206, body is one JSON line. `[verify]` whether a preflight
        `OPTIONS` is sent and whether Netlify answers it with the headers above
        (the `/*` → `/index.html` SPA redirect must not swallow it).
  - [ ] `<audio src="<an https station URL>">` started from a tap, then a
        second station started **after an `await fetch(...)`** (mirrors
        station switching in `RadioPlayer.vue`). `[verify]` autoplay policy
        allows it.
  - [ ] POST to `https://geohearo.com/we-hear/for-you` (Plausible proxy) from
        the app origin succeeds. `[verify]` CORS on the proxied response.

**Accept when:** all three work on both platforms.

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

- [ ] `bun add @capacitor/core`
- [ ] New `src/lib/platform.ts`:
  - `isNative = Capacitor.isNativePlatform()`
  - `remoteDataUrl(path)` → `${import.meta.env.VITE_REMOTE_DATA_BASE ?? ""}/data/${path}`
- [ ] `frontend/.env.native`: `VITE_REMOTE_DATA_BASE=https://geohearo.com`
      (web build leaves it unset → same-origin, unchanged).

### 1.2 Data URLs

- [ ] `useRadio.loadStations`: `/data/index.json` → `remoteDataUrl("index.json")`.
- [ ] `useRadio.loadCountryBySeed`: `DATA_URL` → `remoteDataUrl(\`stations\_${fileIndex}.jsonl\`)`.
- [ ] Leave `useCountryData.ts` (`ne_countries.geojson`) and
      `CountryDetails.vue` (`country_details_with_pics.json`) on relative paths
      — bundled.

### 1.3 Native build mode in `vite.config.ts`

- [ ] `defineConfig(({ mode }) => …)`; when `mode === "native"`:
  - omit `VitePWA(...)` and the `copy-404` plugin;
  - add a `closeBundle` plugin that deletes `stations_*.jsonl` and `index.json`
    from `dist-native/data/`.
- [ ] `package.json` script: `"build:native": "vue-tsc -b && vite build --mode native --outDir dist-native"`.
- [ ] `.gitignore`: `dist-native`.

**Accept when:** `du -sh frontend/dist-native` is < 15 MB and `bun run build`
output is byte-identical in structure to before (still has `data/stations_*`,
`sw.js`, `404.html`).

### 1.4 Web-only features

- [ ] `main.ts`: call `usePwaInstall()` only when `!isNative`; `Footer.vue`'s
      install button then never shows in the app.
- [ ] `main.ts` Plausible: in native mode send
      `url: "https://geohearo.com" + to.fullPath` instead of
      `window.location.origin + …`, and add a `platform` prop (`ios`/`android`)
      so app traffic is separable. `[verify]` the tracker's localhost
      suppression option name in `@plausible-analytics/tracker` and enable
      capture (the iOS/Android hostname is `localhost`).

### 1.5 Safe areas

- [ ] `index.html` viewport: add `viewport-fit=cover`.
- [ ] Add `env(safe-area-inset-*)` padding to the fixed top/bottom chrome in
      `PlayMobile.vue`, `HamburgerMenu.vue`, and the result/guess panels.
      No `safe-area` usage exists today `[code]`. Android 15+ is edge-to-edge,
      so this applies to both platforms.

**Accept when:** iPhone simulator with a notch and an Android 15 emulator show
no UI under the status bar / home indicator (checked in Phase 2).

---

## Phase 2 — Add Capacitor and run on devices

- [ ] `bun add @capacitor/cli @capacitor/ios @capacitor/android`
- [ ] `bunx cap init GeoHearo com.geohearo.app --web-dir dist-native`
- [ ] `capacitor.config.ts`: `backgroundColor: "#fff9f5"` (matches manifest
      `background_color`).
- [ ] `bunx cap add ios && bunx cap add android`; commit `ios/` and `android/`.
- [ ] Scripts:
  - `"cap:sync": "bun run build:native && cap sync"`
  - `"cap:ios": "bun run cap:sync && cap run ios"`
  - `"cap:android": "bun run cap:sync && cap run android"`
- [ ] Dev loop: `CAP_SERVER_URL=http://<lan-ip>:5173` read in
      `capacitor.config.ts` as `server.url` (+ `cleartext: true`) only when set,
      for live reload against `bun run dev`.
- [ ] Apply Phase 0 autoplay settings if needed.

### Smoke test on both platforms

- [ ] Home → Play → stations load, audio plays, skip station works.
- [ ] Static noise (`utils/audio.ts`) plays on station change. Note: on iOS
      Web Audio follows the mute switch `[verify]`; acceptable.
- [ ] Map tiles (ArcGIS) and glyphs (`demotiles.maplibre.org`) render.
- [ ] Guess, win, lose, results modal, daily stats bar chart (Supabase).
- [ ] Deep routes survive reload (`createWebHistory` `[code]`; Capacitor serves
      `index.html` for unknown paths).
- [ ] External links in About/Footer/Privacy open the system browser, not
      inside the app view.
- [ ] Driver.js onboarding tour fits the screen.

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
