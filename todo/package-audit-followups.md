# Package audit follow-ups

Leftovers from the `frontend/packages_eval.md` review (deleted 2026-11-09). All
four of its changes (vant per-component CSS, `@supabase/postgrest-js`,
dependency cleanup, native `<input>`/`<button>`) are done; see `CHANGELOG.md`
2026-11-08 for the measured savings.

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
     (driverModule ??= Promise.all([import("driver.js"), import("driver.js/dist/driver.css")]).then(
       ([m]) => m,
     ));
   ```

3. Make `runTour` `async` (both `startTour` and `startResultsTour` call it). Keep
   the `localStorage` check **before** the `await`, so returning players never
   fetch the chunk, then `const { driver } = await loadDriver();` and continue as today.
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

## 2. Notes kept from the audit review

- `vant/es/*/style` still pulls in `vant/es/style/base.css`, which has unlayered
  `input, button, textarea { color: inherit; font: inherit }`. That rule beats
  Tailwind utilities, which is why `GuessPanel`'s `<input>` uses
  `!text-[18px] !leading-6`.
- [ ] `oxlint` is not installed and there is no lint script; only `oxfmt` is
      used. Add `oxlint` with a `lint` script if wanted.
