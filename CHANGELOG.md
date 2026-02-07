# Changelog

## 2026-02-07

### Improved game state management (`82eb9ca`)

Refactored game state transitions to use an explicit `gameStage` pattern, making state changes clearer and more predictable.

- Introduced `GamePhase` type (`'guessing' | 'seeResults' | 'listening'`) to model the game lifecycle
- `showModal` is now derived from `gameStage` rather than being managed independently
- Centralized stage transitions in `useGamePlay.ts` composable
- Updated `useRadio.ts` for sessionStorage persistence of the new stage
- Updated views (`PlayDesktop`, `PlayMobile`) and `Map.vue` to consume the new state model
