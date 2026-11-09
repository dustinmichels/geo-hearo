# Frontend Package Audit

Findings are grounded in source code (import sites, usage patterns) and the
`vant/lib/index.css` global-import fact. Exact per-package bundle-size contributions
require a clean isolated build and are not cited here.

---

## Production Dependencies

### `vant` — ⚠️ Oversized CSS import; two components replaceable

**The CSS import is the concrete problem.** `main.ts` contains:

```ts
import "vant/lib/index.css";
```

This loads the stylesheet for every vant component (~80 total) regardless of which are
used. Only three vant components are actually imported anywhere in the codebase:

- `FloatingPanel` (PlayMobile.vue) — a drag-to-expand bottom sheet with snap points.
  Legitimately complex; hard to replicate correctly in a few lines of Vue.
- `Field` (GuessPanel.vue) — used as `readonly`. A styled display box; a plain
  `<input readonly>` with Tailwind classes is a direct substitute.
- `Button` (RadioPlayer.vue, ×3) — all three instances override every vant style with
  Tailwind `!important`. These are functionally plain `<button>` elements wearing a
  vant wrapper.

**Recommended fix:** Replace the global CSS import with per-component imports:

```ts
import "vant/es/floating-panel/style";
// (add Field/Button only if kept)
```

This is source-verifiable as a large saving; the exact byte figure needs a clean build
to confirm.

**Secondary fix:** replace `VanField` with `<input readonly>` and `VanButton` with
`<button>` — removes the JS imports for those two components as well.

---

### `@supabase/supabase-js` — ⚠️ Oversized for use case

Used for exactly two operations in `lib/supabase.ts`:

```ts
supabase.from("daily_challenge_stats").select("num_guesses, count").eq(...)
supabase.rpc("increment_daily_stats", { ... })
```

`createClient` unconditionally initialises five sub-clients: `auth-js`, `postgrest-js`,
`realtime-js` (Phoenix WebSocket), `functions-js`, and `storage-js`. Only `postgrest-js`
is exercised; the rest cannot be eliminated by tree-shaking because they are constructed
inside `createClient`.

**Alternative:** `@supabase/postgrest-js` covers both operations directly and is one of
those five sub-packages. Exact bundle savings are not isolated here but the dead
sub-packages make up the majority of the install.

---

### `@turf/area`, `@turf/boolean-intersects`, `@turf/distance`, `@turf/explode`, `@turf/helpers` — ✅ Keep

All five are directly used in `utils/geography.ts`:

- `area` + `helpers` — filter minor island polygons (< 20% of country total area)
- `boolean-intersects` — detect overlap (result: distance = 0)
- `explode` + `distance` — nearest-border distance via vertex iteration

Turf v7 ships individual packages, giving Rollup fine-grained tree-shaking. No idle
packages. Note: the `explode` + `distance` approach is O(n×m) on vertex count across
polygon pairs; `@turf/point-to-line-distance` could reduce that, but that is a logic
change, not a dependency change.

---

### `maplibre-gl` — ✅ Essential

Core WebGL map rendering; no credible lighter alternative at this capability level.
The chunk is large by necessity.

---

### `vue` — ✅ Essential

Framework. No alternative considered.

---

### `pinia` — ✅ Keep

Official Vue 3 state manager. Used correctly across the game store.

---

### `vue-router` — ✅ Keep

Standard SPA routing. Used in `router/index.ts` and `HamburgerMenu.vue`.

---

### `lucide-vue-next` — ✅ Keep (install size is misleading)

36 MB in `node_modules`, but each icon is an individual ES module. Vite tree-shakes
to only the ~16 icons actually imported across components. No concern.

---

### `driver.js` — ✅ Keep

Used for two multi-step product tours in `useOnboarding.ts`. The library is small and
actively maintained. Building equivalent highlight + tooltip behaviour from scratch
would cost similar lines of CSS and positioning logic for no clear gain.

---

### `@plausible-analytics/tracker` — ✅ Keep

Tiny package. Privacy-first, self-hosted-compatible analytics used correctly: manual
pageview tracking per route via a proxy endpoint.

---

## Dev Dependencies

### `jsdom` + `@types/jsdom` — ⚠️ Removable

Vitest has no `environment: "jsdom"` config → defaults to Node. The three test files
that import composables only call date-math helpers (`getDailyChallengeNumber`,
`getNextEasternMidnight`, `getEasternDateParts`) and `SeededRandom`. The DOM APIs in
`useRadio` (`document`, `sessionStorage`, `localStorage`) live inside function bodies
(`updatePreconnectLinks`, `initDailyChallenge`, `completeDailyChallenge`, `saveState`,
`restoreState`) that are never invoked during the test runs.

`@types/jsdom` is only forced by the `"jsdom"` entry in `tsconfig.vitest.json`'s
`types` array.

**To remove:** uninstall both packages, drop `"jsdom"` from that `types` array, then
confirm `bun test` and `vue-tsc -b` both pass.

---

### `mapshaper` — ✅ Keep as devDep

Used in the `prebuild` script to simplify `ne_countries.geojson` before each
production build. A devDep is appropriate — it pins the version and ensures CI
reproduces the same output.

---

### `oxlint` + `oxfmt` — ✅ Keep

Rust-based linter and formatter (oxc ecosystem). Fast, actively maintained, correct
choice for this stack.

---

### `tailwindcss` + `@tailwindcss/vite` — ✅ Keep

Tailwind v4 with the official Vite plugin; no PostCSS pipeline needed. Correct setup.

---

### `@types/geojson`, `@types/node`, `@vitejs/plugin-vue`, `@vue/tsconfig`, `typescript`, `vite`, `vite-plugin-pwa`, `vitest`, `vue-tsc` — ✅ All necessary

Standard toolchain for a Vue 3 + Vite + PWA project. No redundancy.

---

## Summary

| Package                  | Finding                                                                        | Recommended action                                          |
| ------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `vant` CSS               | Global `vant/lib/index.css` imports all component styles for 3 used components | Switch to per-component CSS imports                         |
| `vant` Field + Button    | Vant wrapper overridden entirely by Tailwind; functionally native elements     | Replace with `<input readonly>` / `<button>`                |
| `@supabase/supabase-js`  | Auth, realtime, storage, functions all initialised; only postgrest used        | Replace with `@supabase/postgrest-js`                       |
| `jsdom` + `@types/jsdom` | Vitest runs in Node; DOM code unreachable during test runs                     | Remove both; drop `"jsdom"` from tsconfig.vitest.json types |
| Everything else          | Justified and correctly used                                                   | Keep                                                        |
