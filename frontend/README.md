# GeoHearo

A geography guessing game where players identify countries by listening to live local radio stations.

## Quick Start

```bash
bun install
bun run dev       # Start dev server
bun run test      # Run tests (Vitest; plain `bun test` starts Bun's own runner)
bun run build     # Production build (output: dist/)
bun run fmt       # Format code
```

## Mobile app (iOS and Android, Capacitor)

The same frontend runs as an iOS and Android app via [Capacitor](https://capacitorjs.com/). Remaining release work: `todo/mobile-release.md`.

Prerequisites:

- iOS: Xcode 26+ with an iOS simulator (CocoaPods not needed; the project uses Swift Package Manager).
- Android: an SDK in `~/Library/Android/sdk` with an emulator image, and JDK 21 for Gradle. The Gradle 8.14 wrapper fails on newer JDKs with "Unsupported class file major version"; the repo's `mise.toml` pins `java = "temurin-21"`, so run Gradle/`cap` commands through mise (or point `JAVA_HOME` / Android Studio's Gradle JDK at a JDK 21). Without the Android Studio wizard: `brew install --cask android-commandlinetools`, then `sdkmanager --sdk_root=$HOME/Library/Android/sdk "platform-tools" "platforms;android-36" "build-tools;36.0.0" "emulator" "cmdline-tools;latest" "system-images;android-35;google_apis;arm64-v8a"`, `ANDROID_HOME=$HOME/Library/Android/sdk $HOME/Library/Android/sdk/cmdline-tools/latest/bin/avdmanager create avd -n Pixel_9_API_35 -k "system-images;android-35;google_apis;arm64-v8a" -d pixel_9` (Homebrew's `avdmanager` looks in its own SDK root and reports "Package path is not valid"), and `echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties`. Start the emulator with `-gpu host`: the default software renderer on Apple Silicon is slow enough that `adb` calls time out.

```bash
bun run build:native   # Web assets for the app (output: dist-native/, settings from .env.native)
bun run cap:sync       # build:native + copy into ios/ and android/
bun run cap:ios        # cap:sync + build and launch (prompts for a simulator/device)
bun run cap:android    # cap:sync + build and launch (prompts for an emulator/device)
bunx cap open ios      # Open the Xcode project
bunx cap open android  # Open the Android Studio project
```

- `ios/` and `android/` are committed; the copied web assets (`ios/App/App/public`, `android/app/src/main/assets/public`) and the generated `capacitor.config.json` files are not (recreated by `cap sync`).
- The app bundles the map and country data but fetches `index.json` and `stations_*.jsonl` from `VITE_REMOTE_DATA_BASE` (`https://geohearo.com`), which must serve the CORS headers in `netlify.toml`. To point a build at another deploy: `VITE_REMOTE_DATA_BASE=https://<deploy>--geohearo.netlify.app bun run cap:sync`.
- Live reload: `bun run dev:native` (Vite on the LAN in `native` mode, so `.env.native` and `viewport-fit=cover` apply), then `CAP_SERVER_URL=http://<lan-ip>:5173 bun run cap:ios`. Run a plain `bun run cap:sync` afterwards to remove the dev URL from the native project. Debug flags for this mode go in `.env.native.local`.
- Debug the WebView with Safari → Develop → Simulator → GeoHearo.
- App-only behaviour is gated on `isNative` (`src/lib/platform.ts`): `src/lib/nativeApp.ts` (resume, Android back button, notification taps), `src/lib/dailyReminder.ts` (09:00 local reminder, toggle in the menu), `src/lib/persist.ts` (localStorage keys mirrored to native Preferences; add new long-lived keys to `PERSISTED_KEYS` and write them with `persist()`).
- Icon and splash: sources in `assets/` (`icon-only.png` 1024×1024 GH logo on `#0000ff`, no alpha; `icon-foreground.png` / `icon-background.png` for the Android adaptive icon; `splash.png` 2732×2732 globe on `#fff9f5`). After changing them, `bun run cap:assets` regenerates the iOS and Android images. The splash stays up until the first route resolves (`launchAutoHide: false`, hidden in `nativeApp.ts`).
- iOS release settings live in the Xcode project: iPhone only, portrait only, `ITSAppUsesNonExemptEncryption = NO`, dark status-bar text, privacy manifest `ios/App/App/PrivacyInfo.xcprivacy` (UserDefaults reason `CA92.1` for `@capacitor/preferences`; re-check it when adding a plugin). Version: keep `package.json` `version`, Xcode `MARKETING_VERSION` and Android `versionName` equal; bump Xcode `CURRENT_PROJECT_VERSION` / Android `versionCode` on every upload.
- iOS release upload (TestFlight / App Store), from `frontend/` after `bun run cap:sync`: `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath ios/App/build/GeoHearo.xcarchive -allowProvisioningUpdates archive`, then `xcodebuild -exportArchive -archivePath ios/App/build/GeoHearo.xcarchive -exportOptionsPlist ios/ExportOptions.plist -exportPath ios/App/build/export -allowProvisioningUpdates` uploads to App Store Connect (team `LLM5F36KYW`, automatic signing; needs the Apple ID in Xcode → Settings → Accounts). `ios/App/build` is gitignored. The project uses Swift Package Manager: there is no `.xcworkspace`.
- Android release: `cd android && mise exec -- ./gradlew bundleRelease` writes `app/build/outputs/bundle/release/app-release.aab`, signed with the Play upload key when `android/keystore.properties` exists (`storeFile`, `storePassword`, `keyAlias`, `keyPassword`; gitignored, like `*.jks`). Without it the bundle is unsigned. Android Studio picks up JDK 21 from `android/.gradle/config.properties` (`java.home=…/mise/installs/java/temurin-21`, machine-local); otherwise set Settings → Build Tools → Gradle → Gradle JDK.

## Symlinked Files

```bash
ln -s .claudeignore .aiexclude
ln -s claude.md .gemini-instructions
```

## Tech Stack

- **Framework:** Vue 3 (Composition API) + TypeScript (strict)
- **State:** Pinia
- **Build:** Vite 7
- **Styling:** Tailwind CSS v4 + Vant UI + Lucide Icons
- **Maps:** MapLibre GL JS + Turf.js
- **Icons:** Lucide
- **Onboarding:** driver.js
- **Animation:** CSS transitions
- **Testing:** Vitest
- **Analytics:** Plausible
- **PWA:** vite-plugin-pwa

## How It Works

Players listen to radio stations from a mystery country and try to identify it on an interactive map. Each round provides ~5 stations and allows up to 5 guesses, with distance/direction feedback after each wrong guess.

**Game Modes:**

- **Free Play** — Random country each round, unlimited replays
- **Daily Challenge** — One shared puzzle per day for all players, seeded by date. Tracked in localStorage to prevent replays.

### Country Selection

Both modes funnel through `useRadio.ts`, which splits country loading into two functions:

- **`loadCountryBySeed(seed)`** — Core logic: deterministically picks a country and fetches stations. Does not persist to sessionStorage. Used by `restoreState()` to re-hydrate an in-progress game on refresh.
- **`selectRandomCountry(seed?)`** — Resolves/generates a seed, calls `loadCountryBySeed`, then persists to sessionStorage. Used when starting a new round.

The selection algorithm:

1. **Seed** — Daily challenge passes a deterministic seed; free play generates a random one.
2. **Pick country** — A `SeededRandom` LCG (multiplier 1103515245, increment 12345, mod 2^31) selects an index into the sorted country list from `index.json`.
3. **Pick stations** — The same RNG draws up to 5 unique station indices from that country's pool (sampling without replacement).

| Mode            | Seed source                                         | Result                                            |
| --------------- | --------------------------------------------------- | ------------------------------------------------- |
| Daily Challenge | `YYYYMMDD` integer (`year*10000 + month*100 + day`) | Same country & stations for every player that day |
| Free Play       | `Math.floor(Math.random() * 10000000)`              | Different country each round                      |

The daily challenge seed is based on the user's **local** date. `initDailyChallenge()` checks localStorage to see if today's puzzle was already completed; if so, the player falls through to free play.

The env var `VITE_SECRET_COUNTRY` overrides country selection entirely (dev only).

**Repetition & distribution notes:** The LCG stride through the country list has a GCD of 1 with the country count, so daily challenge seeds map to distinct countries — empirically verified with zero repeats across 60+ simulated days. Free play has no anti-repetition mechanism; each round draws independently, so repeats are expected after ~√N rounds (~12 with 142 countries). Modulo bias is negligible (~10⁻⁷).

**Data Loading:** The app fetches a country index (`public/data/index.json`), then uses HTTP Range requests to lazily load only the needed station records from `public/data/stations_0.jsonl` … `stations_5.jsonl`. All geographic data is linked by the `ADMIN` country name field.

**Audio Reliability:** To ensure uninterrupted gameplay, the app monitors the audio stream for silence. If a station connects but broadcasts silence for more than 2 seconds, it automatically skips to the next available station.

**Round End Flow:** The game tracks an explicit `gameStage` state (`GamePhase` type: `'guessing' | 'seeResults' | 'listening'`) persisted to sessionStorage:

1. **`guessing`** — Clickable map polygons, guess panel visible, no stations shown.
2. **`seeResults`** — Results modal open (win/loss). Map shows the secret country but not stations yet.
3. **`listening`** — Modal dismissed, stations + basemap tiles visible, results panel with "New Game" button.

Transitions: `guessing → seeResults` (win or 5th guess) → `seeResults → listening` (close modal) → `listening → guessing` (new game). Refreshing the page restores the correct stage, including re-showing the modal if the user was in `seeResults`.

## Project Structure

```
src/
├── components/      # UI components (Map, RadioPlayer, GuessPanel, GameResultModal, GameHistoryList, CountryDetails, HamburgerMenu, etc.)
├── views/           # Route pages (Home, Play, PlayDesktop, PlayMobile, About)
├── stores/          # Pinia stores (game.ts)
├── composables/     # Domain logic & shared state (useRadio, useGamePlay, useCountryData, useOnboarding, usePwaInstall, etc.)
├── types/           # Shared TypeScript interfaces (geo.ts)
├── utils/           # Pure functions (geography, colors, audio static)
├── router/          # Vue Router config
├── assets/styles/   # Tailwind v4 theme + custom styles
├── App.vue          # Root component
└── main.ts          # Entry point
```

## Distance Feedback

After each wrong guess, the player sees a color and emoji indicating how far their guess was from the secret country (measured border-to-border in kilometers).

| Distance (km) | Level | Color         | Hex       | Emoji |
| ------------- | ----- | ------------- | --------- | ----- |
| 0 – 50        | 1     | Light Yellow  | `#FDE047` | 🤏    |
| 50 – 250      | 2     | Golden Yellow | `#FBBF24` | 🟡    |
| 250 – 750     | 3     | Light Orange  | `#FB923C` | 🟠    |
| 750 – 1,500   | 4     | Dark Orange   | `#F97316` | 🟠    |
| 1,500 – 3,000 | 5     | Medium Red    | `#EF4444` | 🔴    |
| 3,000+        | 6     | Dark Red      | `#B91C1C` | 🔴    |

In the shareable results string, a correct guess is shown as 🟢.

## Design System

"Saturday Morning Cartoon" — rounded, colorful, tactile. Fredoka for headings, Nunito for body. Candy-inspired palette (Gumball Blue, Yuzu Yellow, Bubblegum Pop). See `src/assets/styles/style.css` for full theme.

## Environment Variables

- `VITE_DEBUG_MODE=true` — Shows secret country on map (dev only)
- `VITE_GAME_STAGE=seeResults|listening` — Forces game into specified stage on load (dev only)
- `VITE_GIT_HASH` — Injected at build time
