# Frontend cleanup

Out-of-date code that can be removed or simplified, from an audit of
`frontend/` at `771baf3` (2026-11-08). Each section is a small change you can do
on its own. Check items off as they land.

Run after each section: `bun run test --run` and `bun run build`. Note that
`bun test` starts Bun's own test runner, not Vitest.

Not audited: `frontend/ios/`, `frontend-old/`, `data-prep/`.

---

## 1. Show the Esri tile attribution (license)

`components/Map.vue` sets `attributionControl: false`, so the Esri credit text
on the `esri-world-topo` source is never shown. The comment in the empty
`<style>` block at the end of the file says the opposite.

- [x] Change the map option to `attributionControl: { compact: true }`.
- [x] Delete the empty `<style scoped>` block and its comment.
- [x] Check: finish a round. The topo tiles show an (i) attribution button.

## 2. Remove the dead "confirm" path from the results modal

`GameResultModal.vue` declares a `confirm` emit but never emits it, so
`handleModalConfirm` never runs.

- [x] `GameResultModal.vue`: remove `(e: "confirm"): void` from `defineEmits`.
- [x] `PlayDesktop.vue`, `PlayMobile.vue`: remove `@confirm="gameplay.handleModalConfirm"`.
- [x] `useGamePlay.ts`: delete `handleModalConfirm` (it nearly duplicates
      `handleNewGame`) and remove it from the return.

## 3. Remove unused returns from `useGamePlay`

- [x] Delete `generateShareText` and `handleShare`. `DailyChallengeCard.vue`
      has its own share logic.
- [x] Remove `debugCountry` and `currentStations` from the return. They are
      still used inside the composable (`mapProps`), but no view reads them.
- [x] Remove `export` from `ModalConfig` (unused type export).

## 4. Use `===` for country names

Guesses only come from map clicks (the input is `readonly`), so every guess is
an exact `ADMIN` name. The `country` field in the country-details JSON matches
`ADMIN` exactly (checked: all 168 entries).

- [x] `useGamePlay.ts`: replace the `.toLowerCase()` comparisons (lines ~128,
      153, 192, 237, 360, 385) with `===` or `guesses.includes(secret)`.
- [x] `useGamePlay.ts`: `isWin: roundFinished.value && guesses.some(...)`
      becomes `guesses.value.includes(secretCountry.value)` (in two places). The
      `roundFinished &&` part is redundant.
- [x] `stores/game.ts`: delete the `roundFinished` getter, including its
      `VITE_GAME_STAGE` override. It has no other users.
- [x] `useRadio.ts`: delete `checkGuess` and use `guess === secretCountry.value`
      in `handleAddGuess`.
- [x] `useGamePlay.ts` `handleAddGuess`: drop `.trim()` and the exact-match
      color branch that can't be reached after the win check.
- [x] `GuessDisplay.vue` (lines ~22, 50) and `CountryDetails.vue:50`: plain `===`.

## 5. Compute guess hints in one place

The color/hint for a guess is computed in three places, and the fallback colors
already disagree (map `#FB923C`, list `#FFFFFF`).

- [x] Add one helper in `useGamePlay.ts` (or `utils/`), e.g.
      `hintFor(guess) → { color, emoji, level, distance }`: win → green
      `#4ade80` + 🟢, missing feature → one agreed fallback.
      Done as `utils/guessHint.ts` `hintFor(guess, secret, getFeature)`;
      fallback is white `#FFFFFF` + ⬜ (no hint).
- [x] Use it in `populateGuessColors`, `handleAddGuess` and `generateEmojiString`.
- [x] Use it in `GuessDisplay.vue` `guessRows` instead of
      `getHintForGuess` + `getColorForDistanceLevel`.
- [x] `utils/colors.ts`: remove `export` from `DISTANCE_COLORS`, drop the
      unreachable purple `#A855F7` fallback and the comment block that repeats
      `geography.ts`. The table moved into `guessHint.ts` (its only user) and
      `colors.ts` is deleted.

## 6. Use `numericScore` everywhere

`numericScore` was added on 2026-02-11 (`7b0a31b`). `initDailyChallenge` clears
history whenever a new daily starts, so no saved item is missing it.

- [x] `GameHistoryList.vue`: delete the emoji fallback in `getScore`. Use
      `item.numericScore`, and `numericScore < 6` for the win/loss border.
- [x] `GameResultModal.vue` `playerNumGuesses`: `displayItem.value?.numericScore`.
- [x] `useGamePlay.ts` `handleShowStats`: `isWin: dailyItem.numericScore < 6`
      instead of `score.includes("🟢")`. Use the `dailyItem` computed instead
      of running `find` again.

## 7. Clean up `useRadio.ts`

- [x] `selectRandomCountry`: drop the `string` seed branch. Callers pass a
      number or nothing.
- [x] `loadCountryBySeed`: remove the three `isLoading.value = false` lines in
      early returns. `isLoading` is not set to `true` until later.
- [x] Delete the stale "Refactor note: we use local '2026-02-02'…" comment.
- [x] Remove `isLoading` and `getEasternDateParts` from the return (only used
      inside the composable). `isLoading` had no reader left, so it is deleted.
- [x] `addGuess`: drop the duplicate check; `store.addGuess` already dedupes.

## 8. Merge the duplicate onboarding tours

`useOnboarding.ts` builds the same driver.js setup twice, and both
`onDestroyStarted` handlers repeat `skipTour`.

- [x] Add `runTour(key, steps)` holding the shared setup.
      `onDestroyStarted: skipTour`.
- [x] Rewrite `startTour` and `startResultsTour` as `runTour` calls.
- [x] Remove the `// Export this` comment.
- [x] Check: fresh `localStorage` shows both tours. "Skip Tour" still works.
- [x] Coordinate with `package-audit-followups.md` §1 (lazy-loading driver.js)
      if both are done. Its step 3 now targets `runTour`.

## 9. Fix tests that test copies of the code

- [x] `useRadio.ts`: move the pure pick step out of `loadCountryBySeed` into an
      exported `pickCountryAndStations(seed, names, countries)`. Call it from
      `loadCountryBySeed`.
- [x] `composables/__tests__/dailyChallenge.test.ts`: test that function
      instead of the local copy `selectCountryAndStations`. Import
      `IndexStructure` from `types/geo` instead of redeclaring it.
- [x] Delete the "same seed produces same country and station indices" test
      (it runs the same copy twice) and the `console.log`.
- [x] Fix the `npm test -- dailyChallenge` usage comment (`bun run test dailyChallenge`).
- [x] Delete `utils/challenge.test.ts`. Its `numericScore` test only checks a
      formula defined inside the test, and its other two tests repeat
      `countdown.test.ts`.

## 10. Remove duplicated page CSS

`style.css` already defines `.animate-blob1/2`. About and Privacy also share
about 85 identical lines.

- [x] `Home.vue`, `About.vue`, `Privacy.vue`: delete the scoped `blobMove1/2`
      keyframes and `.animate-blob1/2`.
- [x] Move the shared About/Privacy rules (`hover-scale`, `slideUp`,
      `scaleUpFade`, `popIn`, `.animate-*`) into `style.css` once, then delete
      them from both views. Check that Home's own `slideUp`/`popIn` timings
      differ before merging them too. They differ (0.6 s / 0.5 s vs 1 s /
      0.8 s), so Home uses the shared classes with inline duration/delay.
      `scaleUpFade` was identical to `slideUp` and is removed.
- [x] Check: `fallow dupes --format json --quiet` no longer reports these
      groups. Two template groups remain (Home's two PLAY buttons, the
      About/Privacy card/button markup); not CSS, out of scope here.

## 11. Remove Tailwind classes and settings that do nothing

- [x] `bg-sea-blue/10` (`PlayDesktop.vue`, `CountryDetails.vue` ×2): no
      `--color-sea-blue` is defined, so these produce no CSS. Either add the
      color to `@theme` or remove the class. Removed (keeps today's look).
- [x] `Map.vue:706`: drop `animate-in fade-in duration-500`. No animation
      plugin is installed.
- [x] `style.css` `@theme`: delete `--border-2`, `--border-3` (Tailwind v4
      handles `border-3` without them), `--radius-card`, `--radius-badge`
      (unused).
- [x] `style.css`: delete the hand-written `.font-heading` / `.font-body`
      classes. `@theme` `--font-heading` / `--font-body` already create them.
- [x] `style.css`: drop `opacity: 1` from `close-pulse`. Merge
      `.magic-wave.wave-1/2` background into `.magic-wave` (same color).
- [x] `Home.vue:50`: drop `scale-100 sm:scale-100` (no-op).

## 12. Simplify `CountryDetails.vue`

- [x] Make `local_image_path` required. Delete the `pexels_data.src` fallback
      and the unused `src` fields from `PexelsData`. Keep the "Image coming
      soon" fallback: Kosovo and Puerto Rico have no details.
- [x] Cache the fetched JSON in module scope (as `useCountryData` does), so
      the 134 KB file is not fetched on every mount (every round).
      (Both were already in the code.)

## 13. Remove unused props, options and IDs

- [x] `GuessPanel.vue`: delete the `disabled` prop and `v-if="!disabled"`
      (no caller passes it).
- [x] `GuessPanel.vue`: drop `id="tour-guess-input"` and `id="tour-guess-btn"`.
      `RadioPlayer.vue`: drop `id="tour-skip-back-btn"`. No tour step uses them.
- [x] `Map.vue`: make `defaultProjection` required and delete the
      `window.innerWidth < 768` fallback (both layouts pass it).
      `isGlobe` is now initialised from the prop directly.
- [x] `Map.vue`: `resizeObserver` → plain `let` (not rendered). Delete the
      stray `// Sync zoom level` comment.
- [x] `useCountryData.ts`: remove the unused `isLoading` and `error` refs and
      their returns.
- [x] `useDistanceUnit.ts`: remove `export` from `DistanceUnit`.
- [x] `PlayDesktop.vue`: drop `mapRef` from `defineExpose` and delete the
      empty `<style scoped>` block.

## 14. Simplify panel heights in `PlayMobile.vue`

- [x] Replace the `anchors` / `resultsAnchors` arrays with named computeds
      (`collapsed`, `expanded` per panel). Pass `[collapsed, expanded]` to
      `:anchors`. Named `guessCollapsed/guessExpanded`,
      `resultsCollapsed/resultsExpanded`.
- [x] Delete the `?? 140` / `?? 160` fallbacks and the
      `typeof … === "undefined"` checks in `isPanelFullHeight`,
      `isResultsPanelFullHeight` and `overlayOpacity`.
- [x] Check on a phone-sized viewport: drag, the arrow close button and the
      overlay dimming all still work. Checked at 390×844 with touch drag:
      guess panel 140 → 760 px, results panel 160 → 714 px, overlay 0 → 0.6,
      the X button collapses both.

## 15. Fix out-of-date comments

- [x] `lib/supabase.ts:15-21`: the JSDoc above `fetchDailyStats` belongs to
      `trackDailyResult`. Move it and write one for `fetchDailyStats`.
- [x] `utils/geography.ts`: fix the `DistanceHintResult` comment (6 levels, no
      purple, no 🟣) and the orphan numbering ("2.", "4.").
- [x] `main.ts`: drop "1. Initialize and store the instance". Move
      `import { createPinia }` to the top. (Also dropped the matching "2.".)
- [x] `Home.vue`, `About.vue`, `Privacy.vue`: "Hamburger Menu (Mobile Only)"
      → the menu shows on all sizes.
- [x] `Home.vue` `handleTuneIn`: delete the "small JS delay" comment and the
      unused `_event` parameter.
- [x] `GameResultModal.vue`: remove the duplicated
      `<!-- Game History or Share View -->` comment. Move
      `import { computed, … } from "vue"` to the top of the script.

## 16. Remove out-of-date repo files and docs

- [x] Delete `frontend/packages_eval.md` (its four changes are done), or apply
      the corrections in `package-audit-followups.md` §2. Pick one. Deleted.
- [x] Delete the empty `frontend/.aiexclude` and `frontend/.gemini-instructions`,
      or turn them into the symlinks the README describes. Already symlinks
      (`→ .claudeignore`, `→ claude.md`), so the README section is accurate.
- [x] Delete `frontend/src/assets/sounds/` (only a `.DS_Store`). Already gone.
- [x] `frontend/.env`: remove the `PEXELS_API_KEY` comment block (no Netlify
      functions exist). `frontend/.env` no longer exists; no `PEXELS` reference
      is left.
- [x] `frontend/README.md`: `bun test` → `bun run test`; `stations.jsonl` →
      `stations_0..5.jsonl`; fix or remove the "Symlinked Files" section.
      The "Symlinked Files" section matches the repo, so it stays.

## 17. Remove build config that isn't needed

- [x] `vite.config.ts`: delete the `copy-404` plugin. `netlify.toml` already
      rewrites `/*` to `/index.html`, so `dist/404.html` is never served.
- [x] `tsconfig.app.json`: delete `"baseUrl": "."`. `paths` works without it,
      and TypeScript 6 deprecates `baseUrl`.
- [ ] Check: `bun run build`, then a deep link (`/about`) still loads on a
      Netlify deploy preview. `bun run build` passes; deploy preview not
      checked yet.

---

## Optional (small wins)

### 18. `RadioPlayer.vue`

- [x] Extract `startPlayback()` for the static-then-play code repeated in the
      `isPlaying` and `stationUrl` watchers (lines ~62–69 and 89–96).
- [x] `currentStaticSource` → plain `let` (not rendered).
- [x] `catch (e) { // ignore }` → `catch {}`.

### 19. `utils/geography.ts`

- [x] `getDistanceHint`: pass the already-computed landmass polygons to the
      border-distance step instead of calling `getMajorLandmasses` again
      (every polygon's area is currently computed twice per hint). Keep
      `nearestBorderDistance`'s public signature; `geography.test.ts` uses it.
      Both now use the private `minPolygonDistance(guessPolys, secretPolys)`.
- [x] `getEmojiForLevel`: replace the `switch` with a lookup array.
      (`LEVEL_EMOJIS`, inlined into `getDistanceHint`.)
- [x] `getMajorLandmasses`: narrow on `feature.geometry.type` directly to drop
      the `as any` casts.

### 20. `GameResultModal.vue` countdown

- [x] Run the 1 s `setInterval` only while `show && isDailyChallenge`. Today it
      ticks for the whole time `/play` is open.

### 21. Misc

- [x] `utils/audio.ts`: drop the `webkitAudioContext` fallback and the
      "not supported" branch.
- [x] `usePwaInstall.ts`: drop the `typeof window !== "undefined"` check (no
      server rendering).
- [x] `StatsBarChart.vue`: build `rows` with a map over `1..6`. Compute
      `maxCount` once instead of `Math.max(...)` per row. Drop `loaded &&` from
      `v-else-if`.
- [x] `StationDetails.vue`: remove the static `text-sm` that conflicts with
      the `layout === 'desktop' ? 'text-xs' : 'text-sm'` binding.
- [x] `About.vue`, `Privacy.vue`, `Home.vue`: replace `router.push` buttons with
      `RouterLink`. Replace `v-html="step.text"` in Home with `{{ step.text }}`
      (plain text).
- [x] `useGamePlay.ts`: merge the debug-stage blocks repeated in `onMounted` and
      `handleNewGame`, and the two near-identical restore branches that set the
      modal config. (`DEBUG_STAGE` + `applyDebugStage`, `restoreResultsModal`.)
