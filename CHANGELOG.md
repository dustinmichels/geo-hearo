# Changelog

## 2026-11-09

- **Mobile app, Android build and store listing drafts** (`todo/mobile-plan.md`, in progress):
  - Android builds (`gradlew assembleDebug`) and runs on an Android 15 emulator; JDK 21 pinned in `mise.toml` for Gradle. SDK/emulator setup without Android Studio documented in `frontend/README.md`. Smoke test passed on the emulator: stations, audio, guess/win, results and stats, share sheet, back button, pause on background, notification permission, reminder toggle and tapping a notification.
  - Fixed a native action bar ("GeoH…" over squashed globes) under the Android status bar: `MainActivity` now calls `EdgeToEdge.enable` after `super.onCreate`, once the launch theme has been replaced.
  - Fixed Android sending the player to the "Alarms & reminders" settings screen, again on every return to the app, after allowing notifications: daily reminders are scheduled as inexact alarms (`isExactNotification: false`) and may arrive up to an hour after 09:00.
  - Android release builds: `./gradlew bundleRelease` signs the AAB with the Play upload key from the gitignored `android/keystore.properties`.
  - Play store graphics: 7 phone screenshots in `store/screenshots/android-phone/` (1080×1920) and the 512×512 icon `store/play-icon-512.png`.
  - Android notification status-bar icon `ic_stat_geohearo` (white GH, tinted `#0000ff`), set in `capacitor.config.ts`.
  - Draft store copy, age-rating and privacy answers in `todo/store-listing.md`; Play feature graphic `store/feature-graphic.png`.
- **Mobile app, Phase 4 (branding) and iOS store prep** (`todo/mobile-plan.md`, `todo/app-store-ios.md` §4–4b):
  - App icon (GH logo on blue, 1024×1024, no alpha) and launch splash (globe on `#fff9f5`) replace the Capacitor placeholders on iOS and Android. Sources in `frontend/assets/`, regenerated with `bun run cap:assets` (`@capacitor/assets`).
  - `@capacitor/splash-screen`: the splash stays up until the first route resolves, instead of a blank screen while the page loads.
  - Dark status-bar text in the app, also when the phone is in dark mode (`SystemBars.style: "LIGHT"`, `UIStatusBarStyle`).
  - Xcode project: iPhone only, portrait only, `ITSAppUsesNonExemptEncryption = NO`, privacy manifest `PrivacyInfo.xcprivacy` (UserDefaults reason `CA92.1`, analytics product-interaction data).
  - Version `1.0.0` in `package.json`, Xcode `MARKETING_VERSION` and Android `versionName`.
  - Website: "Contact" section on About (App Store support URL) and a rewritten privacy policy covering the apps, notifications, on-device storage, daily stats and third-party services.
- **Web parity with the app** (`todo/mobile-plan.md` §3.6): a tab left open past Eastern midnight restarts on Home with the new daily when it becomes visible again (shared `lib/dayRollover.ts`, also used by the app's resume); phone browsers share the score through the Web Share sheet, desktop keeps copying; Android browsers vibrate on win/lose (shared `lib/haptics.ts`).
- **Frontend cleanup §1–11** (`todo/frontend-cleanup.md`):
  - `Map.vue` shows the compact (i) attribution control, so the Esri tile credit is visible again. Removed the empty `<style>` block whose comment claimed this already worked.
  - Removed the never-emitted `confirm` event from `GameResultModal` and the unused `useGamePlay.handleModalConfirm`.
  - `useGamePlay` no longer returns `debugCountry` / `currentStations`. `ModalConfig` is no longer exported.
  - Country names are compared with `===` (guesses are always exact `ADMIN` names from map clicks). Removed the `game` store's `roundFinished` getter and `useRadio.checkGuess`. The restored-results win flag is now `guesses.includes(secretCountry)`.
  - Guess hints come from one helper, `utils/guessHint.ts` `hintFor`, used by the map colors, the guess list and the share grid. A guess without geometry now shows white + ⬜ everywhere (the map used orange, the list white). `utils/colors.ts` is folded into it.
  - History, the stats chart and "show stats" read `numericScore` instead of parsing the emoji grid.
  - `useRadio`: the seed pick is the exported pure `pickCountryAndStations`, and `dailyChallenge.test.ts` tests it instead of a copy (same countries and stations as before for 2000 seeds). Removed the write-only `isLoading`, the string-seed branch and the duplicate dedupe in `addGuess`. Deleted `utils/challenge.test.ts` (it tested its own formula and repeated `countdown.test.ts`).
  - `useOnboarding`: both tours go through `runTour`, and `skipTour` is the `onDestroyStarted` handler.
  - Page CSS: Home, About and Privacy use the `animate-blob1/2` rules already in `style.css`. The About/Privacy entrance animations (`slideUp`, `popIn`, `.animate-slide-up`, `.animate-scale-up-fade`, `.animate-pop-in-delayed`) and `.hover-scale` moved into `style.css`. `scaleUpFade` was a copy of `slideUp` and is gone. Home keeps its faster timings via inline `animation-duration`/`animation-delay`, and its PLAY buttons carry `hover-scale` directly.
  - Removed Tailwind classes and settings that produced no CSS: `bg-sea-blue/10` (no such color), `animate-in fade-in` on the map's reload hint (no plugin), `scale-100 sm:scale-100`, the `--border-2/3` and `--radius-card/badge` theme vars, and the hand-written `.font-heading` / `.font-body` (the `@theme` fonts generate them). `.magic-wave` holds the shared ripple color.
  - Deleted the out-of-date `frontend/packages_eval.md` (all four changes landed). `todo/package-audit-followups.md` keeps the vant `base.css` note and the open `oxlint` item.
- **Production deploy** of `dev` (`b5a1ae8`), including the `/data/*` CORS headers the app needs. The previous production commit is tagged `v1.0.0`.
- **Mobile app, Phase 3 (native behaviour)** (`todo/mobile-plan.md`). All of it is gated on `isNative`; the web keeps its current behaviour.
  - Plugins: `@capacitor/app`, `preferences`, `haptics`, `share`, `local-notifications`.
  - `lib/persist.ts`: history, daily completion date, distance unit, onboarding flags and the reminder setting are mirrored to native Preferences and restored into `localStorage` before mount, so iOS evicting WKWebView storage loses nothing. `useDistanceUnit` reads its saved unit on first use instead of at import.
  - `lib/nativeApp.ts`: when the Eastern-time day changes while the app is in the background, resuming restarts on Home with the new daily; the Android back button walks history, then exits; tapping a reminder opens Home.
  - Audio stops when the app goes to the background (`useGamePlay` clears `isPlaying`).
  - Haptics on a guess and on win/lose.
  - "Share score" opens the native share sheet. Removed the unused `useGamePlay.handleShare` / `generateShareText`.
  - `lib/dailyReminder.ts`: after the first completed daily the app asks for notification permission, then schedules a "GeoHearo #N is live" reminder at 09:00 local time for the next 7 days, skipping completed dailies. "Daily reminder" switch in the menu drawer.
  - Verified on the iPhone 17 Pro simulator: background pause, wiping WebKit storage keeps the daily and history, the permission prompt, the seven scheduled reminders, the toggle and the share sheet.
- **Mobile app, Phase 2 (Android scaffold)**: `frontend/android` (`cap add android`), script `cap:android`, `SystemBars.insetsHandling: "native"`, `EdgeToEdge.enable` in `MainActivity`; Vite and `.prettierignore` ignore `android/`. Not built yet: needs the Android Studio SDK setup and JDK 21 for Gradle (see `frontend/README.md`).
- **Mobile app, Phase 2 (iOS)** (`todo/mobile-plan.md`): Capacitor 8 iOS project in `frontend/ios` (Swift Package Manager), app ID `com.geohearo.app`.
  - `capacitor.config.ts` (web dir `dist-native`, background `#fff9f5`, `CAP_SERVER_URL` → `server.url` for live reload); scripts `cap:sync`, `cap:ios`, `dev:native`.
  - Ran on the iPhone 17 Pro simulator against a Netlify draft deploy with the new CORS headers: stations load via `Range` from `capacitor://localhost`, audio plays and skips, a daily challenge completes with Supabase stats, external links open Safari.
  - `PlayMobile`: collapsed panel heights include the home-indicator inset and that inset is painted white; `safeAreaTop()` became `safeAreaInsets()`.
  - Vite ignores `ios/` for file watching and dependency scanning; `.prettierignore` also excludes `ios/` (Xcode-owned JSON).
  - `frontend/README.md` has a "Mobile app" section.

## 2026-11-08

- **Merged `main` (live `014ebf5`)**: brings the refreshed country photos and matching `country_details_with_pics.json` into `dev`. Fixed two mis-encoded language names in that JSON (Asháninka, Guaraní). `CountryDetails` now treats non-OK responses as errors and logs them.
- **Regressions vs. live fixed**:
  - `Map.vue` `zoomToStationsWrapped`: it waited for a `moveend` that `stop()` emits synchronously (or never, when idle), so the map stopped zooming to the stations after the results modal. It now zooms right after `stop()`.
  - Daily-challenge stats (trophy / `DailyChallengeCard`) query the Eastern challenge date instead of the UTC date of the completion timestamp, matching what `trackDailyResult` records.
  - `initDailyChallenge` compares the stored completion date numerically, so dates stored unpadded by the live build (`2026-11-9`) still count as completed.
  - `RadioPlayer` re-arms the 5s dead-station timeout on every station change, so skipping while a station is loading no longer inherits the old timer.
  - `Play.vue` pauses playback when crossing the 1024px layout breakpoint, because the remounted `<audio>` has no source.
  - A failed country GeoJSON load no longer blocks game setup.
  - `usePwaInstall()` registers its listeners in `main.ts`, before any route renders.
  - driver.js 1.11 tour buttons keep the live `← Previous` / `Next →` labels.
  - `.btn-pressable` transitions `box-shadow` again.
- **Bundle trim** (findings from `frontend/packages_eval.md`, follow-ups in `todo/package-audit-followups.md`):
  - `main.ts` imports only `vant/es/floating-panel/style` instead of `vant/lib/index.css`. The vant CSS chunk went from 198.9 KB to 7.0 KB (53.1 → 1.9 KB gzip).
  - `GuessPanel` uses a native `<input readonly>` and `RadioPlayer` uses native `<button>`s instead of vant `Field`/`Button`. Size and colors match the old build. The `--van-*` overrides in `style.css` are trimmed to the two that `FloatingPanel` reads.
  - `lib/supabase.ts` uses `@supabase/postgrest-js` in place of `@supabase/supabase-js`. It sends the same `apikey`/`Authorization` headers to the same `/rest/v1` endpoints. The `vendor` chunk went from 325 KB to 117 KB (92 → 38 KB gzip).
  - Removed the unused deps `geojson`, `jsdom` and `@types/jsdom`. Added `@types/geojson` as a devDependency (it was only present transitively). `tsconfig.vitest.json` now inherits `lib` (with DOM) from the app config; DOM types used to come from `@types/jsdom`.
  - Removed the dead `:deep(.van-floating-panel__bar)` rule from `PlayMobile.vue`. Vant's class is `__header-bar`, so the rule never matched.
- **Mobile app, Phase 1** (`todo/mobile-plan.md`): the frontend can now be built for Capacitor; the web build is unchanged.
  - `bun run build:native` (`vite build --mode native`) writes `dist-native/` (9.4 MB): no PWA/service worker, no `404.html`, no `stations_*.jsonl`/`index.json`, and `viewport-fit=cover` in `index.html`. Settings come from `frontend/.env.native`.
  - `lib/platform.ts`: `isNative`, `platform`, `remoteDataUrl()`, `safeAreaTop()` (now `safeAreaInsets()`). `useRadio` loads `index.json` and station byte ranges via `remoteDataUrl()`, which is same-origin on the web and `https://geohearo.com` in the app.
  - `netlify.toml` sends CORS headers (`Access-Control-Allow-Origin: *`, `Range` allowed, `Content-Range` exposed) for `/data/*`.
  - In the app, Plausible reports `https://geohearo.com` URLs with a `platform` property and `usePwaInstall` registers no listeners.
  - Safe-area utilities (`pt-safe-N`, `top-safe-N`, …) and a status-bar scrim; applied to the menu buttons, page padding, `PlayMobile`, the menu drawer and the tour "Skip" button. They resolve to the old values on the web.

## 2026-04-07

- **Daily challenge timezone**: Daily challenge now rolls over at midnight US/Eastern time (`America/New_York`) instead of UTC. All players worldwide see the same challenge based on Eastern time. Updated `getDailyChallengeNumber`, `getDailyChallengeSeed`, and date string helpers in `useRadio.ts`.
- **Map zoom fix**: Fixed a race condition in `Map.vue` where the camera would reset incorrectly after a round. The `gameStage` watcher now only resets to default view on `seeResults` (not all non-guessing stages), and `zoomToStationsWrapped` now waits for a `moveend` event instead of using a fixed `setTimeout` delay.
- **RadioBrowser stream validation**: The RadioBrowser crawler now concurrently validates each station's stream URL (20 threads, 5s timeout) before including it in the output, filtering out dead streams. Deduplication logic was also improved so that a record with a resolved stream URL always beats one without, regardless of field count.

## 2026-04-06

### Data pipeline and station expansion

- **Station data split into chunks**: Added `data-prep/scripts/06_split_chunks.py` to split the station dataset into multiple `stations_N.jsonl` files for better loading performance. Updated `index.json`, `useRadio.ts`, `StationDetails.vue`, and `geo.ts` types accordingly.
- **Second radio scraper (RadioBrowser)**: Added `data-prep/crawl/radiobrowser/scraper.go` to pull stations from a second source (RadioBrowser), expanding coverage. Refactored crawl entry point (`main.go`, `runner.go`, `scraper.go`, `station.go`) and added a standalone `merge/` tool for combining datasets.
- **Radio Garden scraper refactor**: Extracted a shared HTTP client (`radiogarden/client.go`) and updated place/channel/stream scrapers to use it.
- **Matching script improvements**: Made `scripts/03_filter_radio.py` and `scripts/04_match_radio.py` more flexible to handle varied input formats.
- **Updated country photos**: Refreshed country photos for all countries.
- **About page update**: Minor copy update on the About page.

## 2026-03-27

### ICY metadata service (Go)

- **ICY service**: Added a new `icy/` Go service that reads ICY metadata from radio streams in real time. Includes a hub, client, station, and metadata modules, plus a compiled binary.
- **ICY test page**: Added an `index.html` test site for interacting with the ICY service from the browser.
- **ICY script**: Added `data-prep/icy.ts` — a TypeScript script for reading ICY metadata from a stream URL.

## 2026-03-23

### UI improvements and scoring simplification

- **`hasEverPlayed` state**: Added `hasEverPlayed` to the game store; `HamburgerMenu` now reflects whether the player has previously played (e.g. shows "Play Again" vs "Play").
- **Daily challenge revisit buttons**: Updated `DailyChallengeCard` and `GameResultModal` buttons for returning players who have already completed today's challenge.
- **Simplified scoring**: Removed complexity from score calculation in `useGamePlay.ts` and `GameHistoryList`.

## 2026-03-19 – 2026-03-20

### Supabase integration, stats bar chart, and tooling

- **Supabase integration**: Added `src/lib/supabase.ts` with a client and helper to fetch and submit daily challenge scores. Results are stored per-day using UTC timestamps.
- **Stats bar chart**: Added `StatsBarChart.vue` component displaying community score distribution for the current daily challenge. Displayed inside `GameResultModal`.
- **Daily challenge stats in modal**: `GameResultModal` now fetches and displays global score stats after a round ends. Fixed a race condition that caused the chart to render before data was ready.
- **Modal scrollable**: Made `GameResultModal` scrollable for smaller screens.
- **Migrated from npm to bun**: Replaced `package-lock.json` with `bun.lock`; updated `package.json` scripts and `netlify.toml` build command.
- **Formatting**: Switched formatter to `oxfmt`.

## 2026-02-10 – 2026-02-11

### Layout, mobile, and content fixes

- **Layout rework**: Rearranged components across desktop and mobile views; added hamburger icons to the desktop header.
- **Privacy page**: Added a `/privacy` route and Privacy page.
- **Game history**: Updated `GameHistoryList` to show the daily challenge country name. Fixed display issues in the component.
- **Mobile panel**: Adjusted the Vant floating panel layout for the listening stage; improved compactness of the modal overlay.
- **Bug fixes**: Fixed a polygon loading bug, fixed daily challenge share score, fixed footer layout.

## 2026-02-09

### Country details, hamburger menu, and PWA support

- **Country details page**: Added a `CountryDetails` component that displays country information (official/regional/minority languages, photo) after a round ends. Data sourced from a new `country_details_with_pics.json` file in `public/data/`.
- **Country details data pipeline**: Added two new data-prep scripts (`scrape.py` and `get_pics.py`) that scrape Wikipedia for language data and fetch country photos from Pexels, producing the `country_details_with_pics.json` dataset and `country-pics/` images.
- **Hamburger menu**: Added a slide-out navigation drawer with links to Home, Play, and About pages, replacing inline navigation.
- **PWA support**: Converted the app into an installable Progressive Web App with a web manifest, service worker via `vite-plugin-pwa`, and an install prompt composable (`usePwaInstall`).
- **Skip tour repositioned**: Moved the skip tour button position for better visibility.
- **Symlinks**: Added `.aiexclude` and `.gemini-instructions` as symlinks to `.claudeignore` and `claude.md`.
- **Misc**: Increased radio stream loading timeout. Added `.claudeignore` files for frontend and root.

## 2026-02-08

### Scoring, modal, map, and onboarding improvements

- **New scoring system**: Replaced simple guess-count scoring with a weighted algorithm that accounts for win/loss, speed, and guess proximity (scores range 0–10). Average score now displays with "/ 10" suffix.
- **Improved results modal**: Combined emoji grid and share button into a single clickable card. Updated share copy text format (`GeoHearo #N` instead of `GeoHearo | #N`). Replaced emoji in "See the stations" button with an arrow icon. Removed unused commented-out markup.
- **Map basemap switching**: Satellite/tile basemap now activates as soon as the round ends (`seeResults`), not just during `listening` phase.
- **Skip tour button**: Added a floating "Skip Tour" button visible during onboarding tours. Removed the browser `confirm()` dialog that previously asked before skipping. Refactored `useOnboarding.ts` to expose `isTourActive` and `skipTour` reactively.
- **Debug settings**: Replaced `VITE_ROUND_FINISHED` env var with `VITE_GAME_STAGE` to allow jumping directly to `seeResults` or `listening` stages during development.
- **Tests**: Added determinism test for daily challenge seed → country/station selection.
- **Security**: Removed secret country from sessionStorage; it is now regenerated from the seed on restore.
- **Misc**: Fixed "Tomrrow" → "Tomorrow" typo on Home page. Code formatting cleanup across several files.

## 2026-02-07

### Improved game state management (`82eb9ca`)

Refactored game state transitions to use an explicit `gameStage` pattern, making state changes clearer and more predictable.

- Introduced `GamePhase` type (`'guessing' | 'seeResults' | 'listening'`) to model the game lifecycle
- `showModal` is now derived from `gameStage` rather than being managed independently
- Centralized stage transitions in `useGamePlay.ts` composable
- Updated `useRadio.ts` for sessionStorage persistence of the new stage
- Updated views (`PlayDesktop`, `PlayMobile`) and `Map.vue` to consume the new state model
