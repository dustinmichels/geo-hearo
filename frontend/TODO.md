# Map.vue & useMapStations.ts — Cleanup Recommendations

Current state: ~678 lines (Map.vue) + ~257 lines (useMapStations.ts).

---

## Done

- ~~Remove `console.log` in `roundFinished` watcher~~
- ~~Remove trivial `reloadMap` wrapper~~
- ~~Extract `applyProjectionStyles()` helper~~
- ~~Extract country filter helper (`setLayerFilter`)~~
- ~~Fix `setTilesVisibility` inconsistency~~
- ~~Fix props variable shadowing in click handler~~
- ~~Fix double call to `getSkyConfig()`~~
- ~~Replace `any` types in Map.vue (`getSkyConfig` → `SkySpecification`, fill color expressions → `string | unknown[]`)~~
- ~~Replace `any` casts in useMapStations.ts (`as GeoJSONSource`, `as const` on Feature/FeatureCollection types)~~
- ~~Register zoom handler once instead of re-registering on every `updateStationsLayer` call~~
- ~~Remove unnecessary `{ deep: true }` on stations watcher~~

---

## Remaining

### 1. Extract Magic Values

#### 1.1 Hardcoded colors

Colors are scattered throughout both files. Many correspond to Tailwind classes already in the theme. Consider extracting shared map-specific colors:

| Hex       | Meaning                       | Used in                           |
| --------- | ----------------------------- | --------------------------------- |
| `#0f172a` | Globe background (slate-900)  | Map.vue (×3)                      |
| `#020617` | Finished globe bg (slate-950) | Map.vue (×1)                      |
| `#cbd5e1` | Country fill (slate-300)      | Map.vue (×1)                      |
| `#94a3b8` | Globe border (slate-400)      | Map.vue (×3)                      |
| `#64748b` | Flat border (slate-500)       | Map.vue (×2)                      |
| `#86efac` | Guessed fallback (green-300)  | Map.vue (×3)                      |
| `#4ade80` | Secret country (green-400)    | Map.vue (×2), useMapStations (×1) |
| `#f472b6` | Highlight / active (pink-400) | Map.vue (×1), useMapStations (×2) |
| `#facc15` | Station default (yellow-400)  | useMapStations (×2)               |
| `#ffffff` | White borders / flat bg       | Map.vue (×5)                      |

A `MAP_COLORS` constant object would centralize these and make theme changes easier.

#### 1.2 Hardcoded numbers

- `5000` ms — loading timeout before showing reload button
- `1.5` — default/reset zoom level
- `800` — `easeTo` animation duration
- `3` — spin speed (degrees/sec), already a const but only locally scoped
