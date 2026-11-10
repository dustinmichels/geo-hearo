# To-do

| File                                                                               | What                                                                                                 |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [mobile-release.md](mobile-release.md)                                             | Remaining work to ship the iOS and Android apps (accounts, deploy, device checks, store submission). |
| [store-listing.md](store-listing.md)                                               | Store copy, age rating, privacy and review-note answers (reference).                                 |
| [crawler-improvements.md](crawler-improvements.md)                                 | Data-safety and coverage fixes for the station crawler.                                              |
| [maybe/daily-challenge-data-stability.md](maybe/daily-challenge-data-stability.md) | Why a data refresh can change the daily challenge; options.                                          |

Completed plans (frontend cleanup, package audit, mobile Phases 0–4) were
removed; `CHANGELOG.md` records what landed.

---

## Small items

### Lazy-load driver.js (optional)

`driver.js` (38.4 KB min) and `driver.js/dist/driver.css` (4.9 KB) load on
every visit but only run for first-time players: both tours return early once
`geo-hearo-onboarding-seen` / `geo-hearo-results-tour-seen` is set.

`frontend/src/composables/useOnboarding.ts`:

1. Replace the static `driver.js` and CSS imports with a memoised loader
   (keep `import type { Driver, DriveStep }`):

   ```ts
   let driverModule: Promise<typeof import("driver.js")> | null = null;
   const loadDriver = () =>
     (driverModule ??= Promise.all([import("driver.js"), import("driver.js/dist/driver.css")]).then(
       ([m]) => m,
     ));
   ```

2. Make `runTour` `async`. Keep the `localStorage` check **before** the
   `await`, so returning players never fetch the chunk.
3. `skipTour()` or a route change can happen while the chunk loads: set
   `activeTourKey`/`isTourActive` after the import resolves, and return if
   `activeDriver` is already set.
4. `vite.config.ts` `manualChunks` sends every `node_modules` id to `vendor`,
   which would undo the split. Add `if (id.includes("driver.js")) return "driver";`
   before the `vendor` fallback.

Verify: `vite build` emits a `driver` JS/CSS chunk and `vendor` shrinks by
~38 KB; fresh `localStorage` shows both tours (desktop and mobile); a returning
profile requests no `driver-*.js`; the PWA precache lists the new chunk.

### Lint

- [ ] `oxlint` is not installed and there is no `lint` script (only `oxfmt`).
      Add both if wanted.

## Notes

- `vant/es/*/style` pulls in `vant/es/style/base.css`, whose unlayered
  `input, button, textarea { color: inherit; font: inherit }` beats Tailwind
  utilities. That is why `GuessPanel`'s `<input>` uses `!text-[18px] !leading-6`.
