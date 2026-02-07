# GeoHearo

Vue 3 + TypeScript geography game — identify countries by listening to live local radio stations.

## Commands

```bash
npm run dev       # Dev server
npm test          # Vitest
npm run build     # Type-check + Vite bundle
npm run format    # Prettier
```

## Coding Conventions

- `<script setup lang="ts">` + Composition API only (never Options API)
- `ref()` for primitives, `shallowRef()` for objects (e.g. MapLibre Map)
- Pinia store (`src/stores/game.ts`) for core state; composables (`src/composables/`) for domain logic
- Strict TypeScript: `noUnusedLocals`/`noUnusedParameters`, `import type` for type-only imports
- `@/` path alias for imports
- Tailwind v4 utilities; theme in `src/assets/styles/style.css` via `@theme`
- ESM only, clean up listeners in `onUnmounted()`

## Key Files

- `src/stores/game.ts` — Pinia store (guesses, secret country, stations, gameStage)
- `src/types/geo.ts` — Shared types (RadioStation, GamePhase, etc.)
- `src/composables/useRadio.ts` — Station loading, guess validation, daily challenge logic
- `src/composables/useGamePlay.ts` — Game flow orchestration, win/loss handling
- `src/components/Map.vue` — MapLibre GL JS map, country selection

## Data

All data files in `public/data/`, linked by `ADMIN` country name. `useRadio` fetches `index.json` for byte offsets, then HTTP Range requests into `stations.jsonl` (fixed-width JSONL, 1053 bytes/record).

## Game Architecture

**Two modes** from `/play`: Free Play (random) and Daily Challenge (seeded RNG from `YYYYMMDD`). Daily completion in localStorage, session state in sessionStorage.

**Game stage** (`gameStage` in Pinia, type `GamePhase`):

| Stage | UI | Map |
| --- | --- | --- |
| `'guessing'` | Guess panel, clickable polygons | Globe/flat, no stations |
| `'seeResults'` | Results modal | Secret country shown |
| `'listening'` | Results panel + new game btn | Stations visible |

Transitions: `guessing → seeResults` (win/loss) → `listening` (close modal) → `guessing` (new game). Persisted to sessionStorage.

## Environment

- `VITE_DEBUG_MODE=true` — Shows secret country on map
- `VITE_SECRET_COUNTRY` — Overrides country selection
- `VITE_GAME_STAGE=seeResults|listening` — Forces game into specified stage on load
