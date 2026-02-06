# GeoHearo - AI Developer Guide

Vue 3 + TypeScript geography game. Players identify countries by listening to live local radio stations.

## Commands

```bash
npm run dev       # Dev server
npm test          # Vitest
npm run build     # Type-check (vue-tsc -b) + Vite bundle → dist/
npm run format    # Prettier
```

## Coding Conventions

- **Always** use `<script setup lang="ts">` and Composition API (never Options API)
- **Reactivity:** `ref()` for primitives, `shallowRef()` for objects like MapLibre Map instances
- **State management:** Pinia store (`src/stores/game.ts`) for core game state. Composables in `src/composables/` for domain logic and shared reactive state (module-level variables).
- **TypeScript:** Strict mode, `noUnusedLocals`/`noUnusedParameters` enforced. Use `import type` for type-only imports.
- **Imports:** Use `@/` path alias (e.g., `@/composables/useRadio`)
- **Styling:** Tailwind v4 utility classes. Theme is defined in `src/assets/styles/style.css` via `@theme` (no JS config). Design colors: `gumball-blue`, `yuzu-yellow`, `bubblegum-pop`, `mint-shake`, `pencil-lead`, etc.
- **Naming:** Components PascalCase, composables `use` prefix, utils camelCase
- **ESM only** — no CommonJS syntax
- **Cleanup:** Always clean up listeners/observers in `onUnmounted()`
- **MapLibre:** Store map in `shallowRef()`, use `watch()` to sync props to layers, use `ResizeObserver` for resize handling

## Key Files

| File                                  | Purpose                                                              |
| ------------------------------------- | -------------------------------------------------------------------- |
| `src/stores/game.ts`                  | Pinia store: core game state (guesses, secret country, stations)     |
| `src/types/geo.ts`                    | Shared TypeScript interfaces (RadioStation, IndexStructure, etc.)    |
| `src/composables/useRadio.ts`         | Station loading, guess validation, daily challenge logic             |
| `src/composables/useGamePlay.ts`      | Game flow orchestration, win/loss handling                           |
| `src/composables/useCountryData.ts`   | Loads and caches country GeoJSON features by ADMIN name              |
| `src/composables/useDistanceUnit.ts`  | km/mi toggle with locale-aware defaults                              |
| `src/composables/useMapStations.ts`   | 3D station pillars on the MapLibre map (fill-extrusion layer)        |
| `src/composables/useOnboarding.ts`    | Onboarding tours via driver.js (startTour, startResultsTour)         |
| `src/components/Map.vue`              | MapLibre GL JS map, country selection                                |
| `src/components/RadioPlayer.vue`      | Audio streaming (HLS/Icecast)                                        |
| `src/components/GameResultModal.vue`  | Win/loss modal with share functionality                              |
| `src/components/GuessPanel.vue`       | Guess input panel (Vant Field) with shake animation                  |
| `src/components/GuessDisplay.vue`     | Renders guess history with distance/color feedback                   |
| `src/components/GameHistoryList.vue`  | Game history display with average score                              |
| `src/components/ResultsPanel.vue`     | Post-round station details + new game button                         |
| `src/components/StationDetails.vue`   | Station name, location, and Radio Garden link                        |
| `src/components/Footer.vue`          | Navigation footer with Home/About links and git hash                 |
| `src/utils/geography.ts`             | Haversine distance, bearings                                         |
| `src/utils/colors.ts`                | Hot/cold color feedback                                              |
| `src/utils/audio.ts`                 | Radio static sound effect via Web Audio API                          |
| `src/views/Play.vue`                 | Responsive wrapper (routes to Desktop/Mobile)                        |

## Data Schema

All data linked by `ADMIN` country name (e.g., `"United States of America"`).

| File                               | Key Field          | Content                                                                                                                                                                              |
| ---------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `public/data/index.json`           | Object keys        | Byte offsets into stations.jsonl (`{ config: { line_length: 1053 }, countries: { "Afghanistan": { start: 0, count: 5 } } }`)                                                         |
| `public/data/stations.jsonl`       | `ADMIN`            | Fixed-width JSONL records (1053 bytes). Fields: `place_id`, `channel_id`, `place_name`, `channel_name`, `geo_lat`, `geo_lon`, `channel_resolved_url`, `ADMIN`, `ISO_A3`, `CONTINENT` |
| `public/data/centers.geojson`      | `properties.ADMIN` | Country center points                                                                                                                                                                |
| `public/data/ne_countries.geojson` | `properties.ADMIN` | Country boundary polygons                                                                                                                                                            |

**Loading:** `useRadio` fetches `index.json` for byte offsets, then HTTP Range requests to load only needed stations from `stations.jsonl`.

## Game Architecture

**Two modes** from the same `/play` route:

- **Free Play:** Random country, unlimited replays
- **Daily Challenge:** Seeded RNG (`YYYYMMDD` seed) for deterministic country selection. Completion stored in localStorage (`dailyChallengeDate` key). Session state in sessionStorage.

**State flow:**

1. `useRadio.loadStations()` loads index + centers
2. `useGamePlay` calls `initDailyChallenge()` to check localStorage
3. `selectRandomCountry(seed?)` picks country + ~5 stations
4. User clicks map → `select-country` event → parent updates `guessInput`
5. Submit guess → `checkGuess()` → win/loss or distance feedback
6. State persists to sessionStorage; daily completion to localStorage

**Daily challenge functions** in `useRadio.ts`: `SeededRandom` (LCG), `getDailyChallengeNumber()` (days since launch Feb 2, 2026), `getDailyChallengeSeed()`, `initDailyChallenge()`, `completeDailyChallenge()`

## Environment

- `VITE_DEBUG_MODE=true` — Shows secret country on map (dev only)
- `VITE_SECRET_COUNTRY` — Overrides country selection entirely (dev only)
- `VITE_ROUND_FINISHED=true` — Forces the game into a "completed round" state (dev only)
- `VITE_GIT_HASH` — Injected at build time
