# Map Component Refactoring Guide

## File Overview

- **Current size**: ~938 lines
- **Primary concerns**: Map initialization, layer management, station 3D rendering, globe spinning, projection toggling, tile visibility
- **Goal**: Reduce to <600 lines, improve maintainability, eliminate duplication

---

## Task Checklist

### 1. Organization & Structure

#### 1.1 Consolidate Watchers

- [ ] **Lines 42-128 and 377-433**: Move all watchers to a single section
- [ ] Group related watchers together (country filters, stations, map state)
- [ ] Add section comments to delineate watcher groups

#### 1.2 Extract Station Logic to Composable

- [ ] Create new file: `composables/useMapStations.ts`
- [ ] Move these functions (lines 130-308):
  - `getPillarPolygon`
  - `getZoomScaleFactor`
  - `buildStationFeatures`
  - `updateStationsLayer`
  - `handleStationZoom`
  - `zoomToStations`
  - `setStationsVisibility`
- [ ] Export composable with proper TypeScript types
- [ ] Import and use in main component

---

### 2. Eliminate Duplicate Code

#### 2.1 Create Projection Styling Helper

**Current duplication**: Lines 787-820 (toggleProjection) and 828-850 (resetView)

- [ ] Create helper function:

```typescript
const applyProjectionStyles = () => {
  if (!map.value) return

  if (map.value.getLayer('background')) {
    map.value.setPaintProperty(
      'background',
      'background-color',
      isGlobe.value ? '#0f172a' : '#ffffff'
    )
  }

  if (map.value.getLayer('countries-border')) {
    map.value.setPaintProperty(
      'countries-border',
      'line-color',
      isGlobe.value ? '#94a3b8' : '#64748b'
    )
  }

  map.value.setSky(
    isGlobe.value
      ? {
          'atmosphere-blend': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            1,
            5,
            1,
            7,
            0,
          ],
        }
      : {}
  )
}
```

- [ ] Replace duplicated code in `toggleProjection` with call to helper
- [ ] Replace duplicated code in `resetView` with call to helper

#### 2.2 Create Country Filter Helper

**Current duplication**: Lines 42-62, 87-106, 109-128

- [ ] Create helper function:

```typescript
const setCountryFilter = (layerPrefix: string, filterExpression: any[]) => {
  if (!map.value) return

  const fillLayer = `${layerPrefix}-fill`
  const borderLayer = `${layerPrefix}-border`

  if (map.value.getLayer(fillLayer)) {
    map.value.setFilter(fillLayer, filterExpression)
  }

  if (map.value.getLayer(borderLayer)) {
    map.value.setFilter(borderLayer, filterExpression)
  }
}
```

- [ ] Replace `selectedCountry` watcher logic (lines 87-106)
- [ ] Replace `secretCountry` watcher logic (lines 109-128)
- [ ] Replace `guessedCountries` watcher logic (lines 42-62)

#### 2.3 Fix setTilesVisibility Inconsistency

**Issue**: Lines 325-331 manually set visibility instead of using helper

- [ ] Replace manual visibility code with:

```typescript
setLayerVisibility('esri-terrain-layer', shouldShow)
```

---

### 3. Remove Stale/Unnecessary Code

#### 3.1 Delete Obsolete Comments

- [ ] **Line 153**: Remove `// zoomHeightExpression removed - height scaling is now handled in buildStationFeatures`
- [ ] **Line 421**: Remove `// Height is now handled in buildStationFeatures and updated via setData below`

#### 3.2 Simplify or Remove reloadMap

**Lines 865-867**

- [ ] Option A: Delete `reloadMap` function and call `initMap()` directly in template
- [ ] Option B: If needed for clarity, keep but add documentation explaining why wrapper exists

---

### 4. Improve Type Safety

#### 4.1 Replace `any` with Proper Types

- [ ] **Lines 71-77, 594-601**: Replace `initialFillColor: any` and `matchExpression: any[]`
  - Use MapLibre's `DataDrivenPropertyValueSpecification` types
  - Import from `maplibre-gl`

- [ ] **Lines 278, 424**: Replace `source as any`
  - Use `GeoJSONSource` type from `maplibre-gl`
  - Add proper type assertion: `source as GeoJSONSource`

- [ ] **Line 242**: Replace `data: sourceData as any`
  - Define proper GeoJSON FeatureCollection type
  - Create interface if needed

---

### 5. Extract Magic Values to Constants

#### 5.1 Create Color Constants File

- [ ] Create new file: `constants/mapColors.ts`
- [ ] Define color constants:

```typescript
export const MAP_COLORS = {
  // Country states
  GUESSED_CORRECT: '#86efac',
  GUESSED_ALTERNATE: '#4ade80',
  SECRET_COUNTRY: '#f472b6',
  SELECTED_COUNTRY: '#facc15',

  // Globe colors
  GLOBE_BACKGROUND: '#0f172a',
  GLOBE_BORDER: '#94a3b8',

  // Flat map colors
  FLAT_BACKGROUND: '#ffffff',
  FLAT_BORDER: '#64748b',
} as const
```

- [ ] Replace all hardcoded color values throughout the file
- [ ] Update both projection styling locations
- [ ] Update country filter styling

#### 5.2 Extract Other Magic Numbers

- [ ] Define zoom levels, scaling factors, animation durations as named constants
- [ ] Create `constants/mapConfig.ts` if many values exist

---

### 6. Optimize Performance

#### 6.1 Fix Zoom Handler Registration

**Issue**: Lines 271-272 toggle listener on every `updateStationsLayer` call

- [ ] Move `handleStationZoom` registration to `setupInteractions` (one-time setup)
- [ ] Add early return in `handleStationZoom`:

```typescript
const handleStationZoom = () => {
  if (!map.value || !stations.value?.length) return
  // ... rest of logic
}
```

- [ ] Remove `map.value.off('zoom', handleStationZoom)` from `updateStationsLayer`

#### 6.2 Optimize Stations Watcher

**Issue**: Line 394 uses `{ deep: true }` unnecessarily

- [ ] Change to shallow watch:

```typescript
watch(
  () => stations.value,
  () => {
    updateStationsLayer()
  }
)
```

- [ ] Verify stations are replaced wholesale, not mutated in-place

---

## Verification Checklist

After completing refactoring:

- [ ] File is under 600 lines
- [ ] No duplicate code blocks >5 lines
- [ ] All TypeScript `any` types have been replaced or justified
- [ ] No hardcoded colors (all extracted to constants)
- [ ] All comments are relevant and current
- [ ] Watchers are grouped logically
- [ ] Station logic is in separate composable
- [ ] All tests pass
- [ ] Map functionality unchanged (manual testing):
  - [ ] Projection toggle works
  - [ ] Country selection/highlighting works
  - [ ] Station 3D pillars render correctly
  - [ ] Zoom behavior is smooth
  - [ ] Reset view works
  - [ ] Tile visibility toggles correctly

---

## Estimated Impact

- **Lines removed**: ~340-400 lines
- **New files created**: 2 (composable + constants)
- **Type safety**: ~8 `any` casts eliminated
- **Maintainability**: Significantly improved through separation of concerns

---

## Implementation Order

Recommended sequence to minimize conflicts:

1. Create constants file (isolated, no conflicts)
2. Create composable file (isolated, no conflicts)
3. Apply type improvements (minimal code movement)
4. Create and apply helper functions (touches multiple locations)
5. Clean up stale code (final cleanup)
6. Consolidate watchers (reorganization)

---

## Notes for AI Agents

- Preserve all existing functionality - this is a refactor, not a rewrite
- Run tests after each major change
- Keep git commits atomic (one task per commit)
- If uncertain about a type, add a TODO comment rather than using `any`
- Check for other instances of patterns when creating helpers
