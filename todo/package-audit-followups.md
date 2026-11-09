# Package audit follow-ups

Leftovers from reviewing `frontend/packages_eval.md`. Items 1–4 of that review
(vant per-component CSS, `@supabase/postgrest-js`, dependency cleanup,
native `<input>`/`<button>`) are done; see `CHANGELOG.md` 2026-11-08.

---

## 1. Lazy-load driver.js (optional)

**Why:** `driver.js` is 38.4 KB minified in the `vendor` chunk (measured from a
sourcemapped build), the largest thing left there after the Supabase swap
(vendor is now 117 KB / 38.4 KB gzip). It is downloaded on every visit but only
runs for first-time players: both tours return early once their `localStorage`
key is set (`geo-hearo-onboarding-seen`, `geo-hearo-results-tour-seen`).
`driver.js/dist/driver.css` (4.9 KB, the `vendor-*.css` file) is also loaded on
every visit.

**Change** (`frontend/src/composables/useOnboarding.ts`):

1. Drop the static `import { driver } from "driver.js"` and
   `import "driver.js/dist/driver.css"`. Keep `import type { Driver }` (types are
   erased).
2. Add a memoised loader that pulls the JS and CSS together:

   ```ts
   let driverModule: Promise<typeof import("driver.js")> | null = null;
   const loadDriver = () =>
     (driverModule ??= Promise.all([
       import("driver.js"),
       import("driver.js/dist/driver.css"),
     ]).then(([m]) => m));
   ```

3. Make `startTour` / `startResultsTour` `async`. Keep the `localStorage` check
   **before** the `await`, so returning players never fetch the chunk, then
   `const { driver } = await loadDriver();` and continue as today.
4. Handle a race: `skipTour()` or a route change can happen while the chunk is
   loading. Set `activeTourKey`/`isTourActive` only after the import resolves,
   and bail out if another tour started in the meantime
   (`if (activeDriver) return;` after the `await`).
5. Callers in `frontend/src/views/Play.vue` (`setTimeout(() => startTour(), 1000)`
   and `startResultsTour()` after 500 ms) need no change. The returned promise
   can be ignored.

**Check `vite.config.ts` `manualChunks`:** it sends every `node_modules` id to
`vendor`, which would pull driver.js back into the eagerly loaded chunk and undo
the split. Add `if (id.includes("driver.js")) return "driver";` before the
`vendor` fallback, or skip `manualChunks` for dynamically imported modules.

**Verify:**

- `vite build`: `driver` becomes its own JS/CSS chunk, and `vendor` shrinks by
  about 38 KB.
- Fresh profile (cleared `localStorage`): `/play` shows the 3-step tour, and
  finishing a game shows the results tour. Desktop and mobile.
- Returning profile: the network tab shows no `driver-*.js` request.
- The PWA precache (`globPatterns` includes `**/*.js`) still lists the new chunk,
  so offline first runs keep working.

---

## 2. Correct `frontend/packages_eval.md`

Errors found when checking the audit against the code (as of `771baf3`). Fix
the audit, or replace each finding with a "Done" note now that the work has
landed.

| Section | Audit says | Actual |
| --- | --- | --- |
| `vant` | Button instances are "functionally plain `<button>`" | Only the two skip buttons were fully overridden. The play button relied on vant for `round`, the `type="primary"` background and flex centring (`bg-gumball-blue` without `!` lost to vant's unlayered CSS). |
| `vant` | Per-component CSS saves "a large" amount, not measured | Measured: `vant-*.css` went from 198.9 KB (53.1 KB gzip) to 7.0 KB (1.9 KB gzip). `vant-*.js` went from 22.5 KB to 7.5 KB. |
| `vant` | (not mentioned) | `vant/es/*/style` still pulls in `vant/es/style/base.css`, which has unlayered `input, button, textarea { color: inherit; font: inherit }`. That rule beats Tailwind utilities, so the native `<input>` needs `!text-[18px] !leading-6`. |
| `@supabase/supabase-js` | Savings not measured | Measured: about 220 KB of the 325 KB `vendor` chunk was Supabase (auth-js 102, realtime 33, phoenix 25, storage 23 + iceberg-js 5, postgrest 17.5, supabase-js 11, functions 3). After the swap, `vendor` is 117 KB (38.4 KB gzip, was 92 KB). |
| `jsdom` | "drop `"jsdom"` from that `types` array, then confirm … `vue-tsc -b` pass" | Wrong as written. `tsconfig.vitest.json` had `"lib": []`, and `@types/jsdom` was what supplied `/// <reference lib="dom" />`. Dropping `"jsdom"` alone gives 58 TS errors. `"lib": []` must go too, so `lib` is inherited from `tsconfig.app.json`. |
| `jsdom` | "confirm `bun test`" | `bun test` runs Bun's test runner, not Vitest. Use `bun run test` (or `bunx vitest run`). |
| `jsdom` | "The three test files that import composables" | There are 4 test files. Only `composables/__tests__/dailyChallenge.test.ts` imports a composable. |
| Dev deps | `@types/geojson` is a devDependency | It was not declared. `package.json` had the unrelated runtime package `geojson` (a converter, no types, never imported). The `import type … from "geojson"` lines resolved through a transitive `@types/geojson` from `@turf/helpers` and `maplibre-gl`. Now fixed: `geojson` removed, `@types/geojson` added as a devDependency. |
| Dev deps | `oxlint` + `oxfmt` — keep | `oxlint` is not in `package.json` or `bun.lock`, and there is no lint script. Only `oxfmt` is used. Remove the `oxlint` mention, or add it with a `lint` script if wanted. |
| `driver.js` | "The library is small" | 38.4 KB minified, the largest non-framework item left in `vendor`. See follow-up 1. |
| `lucide-vue-next` | "~16 icons" | 22 unique icons, about 5 KB in the bundle. The conclusion still holds. |
| Summary table | Recommends the four changes | All four are done. Update the table to show their status. |
