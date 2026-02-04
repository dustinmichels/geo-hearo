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
- **State management:** Composables in `src/composables/`, not Pinia/Vuex. Module-level reactive variables for shared state.
- **TypeScript:** Strict mode, `noUnusedLocals`/`noUnusedParameters` enforced. Use `import type` for type-only imports.
- **Imports:** Use `@/` path alias (e.g., `@/composables/useRadio`)
- **Styling:** Tailwind v4 utility classes. Theme is defined in `src/assets/styles/style.css` via `@theme` (no JS config). Design colors: `gumball-blue`, `yuzu-yellow`, `bubblegum-pop`, `mint-shake`, `pencil-lead`, etc.
- **Naming:** Components PascalCase, composables `use` prefix, utils camelCase
- **ESM only** — no CommonJS syntax
- **Cleanup:** Always clean up listeners/observers in `onUnmounted()`
- **MapLibre:** Store map in `shallowRef()`, use `watch()` to sync props to layers, use `ResizeObserver` for resize handling

## Key Files

| File | Purpose |
|------|---------|
| `src/composables/useRadio.ts` | Game state, station loading, guess validation, daily challenge logic |
| `src/composables/useGamePlay.ts` | Game flow orchestration, win/loss handling |
| `src/components/Map.vue` | MapLibre GL JS map, country selection |
| `src/components/RadioPlayer.vue` | Audio streaming (HLS/Icecast) |
| `src/utils/geography.ts` | Haversine distance, bearings |
| `src/utils/colors.ts` | Hot/cold color feedback |
| `src/views/Play.vue` | Responsive wrapper (routes to Desktop/Mobile) |

## Data Schema

All data linked by `ADMIN` country name (e.g., `"United States of America"`).

| File | Key Field | Content |
|------|-----------|---------|
| `public/data/index.json` | Object keys | Byte offsets into stations.jsonl (`{ config: { line_length: 1053 }, countries: { "Afghanistan": { start: 0, count: 5 } } }`) |
| `public/data/stations.jsonl` | `ADMIN` | Fixed-width JSONL records (1053 bytes). Fields: `place_id`, `channel_id`, `place_name`, `channel_name`, `geo_lat`, `geo_lon`, `channel_resolved_url`, `ADMIN`, `ISO_A3`, `CONTINENT` |
| `public/data/centers.geojson` | `properties.ADMIN` | Country center points |
| `public/data/ne_countries.geojson` | `properties.ADMIN` | Country boundary polygons |

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

- `VITE_DEBUG_MODE=true` — Shows secret country (dev only)
- `VITE_GIT_HASH` — Injected at build time
