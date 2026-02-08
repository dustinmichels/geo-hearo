# Changelog

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
