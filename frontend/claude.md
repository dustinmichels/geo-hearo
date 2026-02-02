# GeoHearo - Developer Guide for AI Assistants

## Project Overview

GeoHearo is a Vue 3 + TypeScript geography game built with modern web technologies. This guide provides context for AI assistants working on the codebase.

## Tech Stack & Best Practices

### Vue 3 Composition API

**Always use:**

- `<script setup lang="ts">` syntax in all components
- Composition API (not Options API)
- `ref()` for primitive reactive values
- `shallowRef()` for non-reactive objects (e.g., MapLibre Map instances)
- Proper TypeScript typing for props and emits

**Example:**

```typescript
<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  count: number
  items: string[]
}>()

const emit = defineEmits<{
  (e: 'update', value: number): void
}>()

const localValue = ref(0)
const doubled = computed(() => localValue.value * 2)
</script>
```

### State Management

**Use composables, not Pinia/Vuex:**

- Shared state lives in `src/composables/`
- Main composable: `useRadio.ts` manages game state
- Use module-level reactive variables for truly shared state
- Return reactive values and methods from composable functions

**Example pattern from useRadio.ts:**

```typescript
// Module-level shared state
const secretCountry = ref<string>('')
const guesses = ref<string[]>([])

export function useRadio() {
  const loadStations = async () => {
    /* ... */
  }

  return {
    secretCountry,
    guesses,
    loadStations,
  }
}
```

### TypeScript

**Configuration:**

- Strict mode enabled
- `noUnusedLocals` and `noUnusedParameters` enforced
- Always type props, emits, function parameters, and return values
- Use type imports: `import type { Foo } from './types'`

**Path aliases:**

- Use `@/` for src imports: `import { useRadio } from '@/composables/useRadio'`

### Styling with Tailwind v4

**Configuration location:** `src/assets/styles/style.css` (not a separate config file)

**Custom theme variables:**

```css
@theme {
  --color-gumball-blue: #3b82f6;
  --color-yuzu-yellow: #fcd34d;
  --font-heading: 'Fredoka', ui-sans-serif, system-ui, sans-serif;
  --radius-btn: 16px;
}
```

**Best practices:**

- Prefer Tailwind utility classes over custom CSS
- Use design system colors (e.g., `bg-gumball-blue`, `text-pencil-lead`)
- Follow the "Saturday Morning Cartoon" design language (rounded, colorful, tactile)
- Avoid inline styles; use Tailwind classes

### Vite Configuration

**Key features:**

- Path alias: `@` → `./src`
- Git hash injection: `import.meta.env.VITE_GIT_HASH`
- Manual chunk splitting for optimal loading:
  - `maplibre` bundle
  - `vant` bundle
  - `vue` bundle
  - `vendor` bundle (other node_modules)
- Custom plugin to copy `index.html` → `404.html` for SPA routing

**Environment variables:**

- `VITE_DEBUG_MODE=true` - Shows secret country on map (development only)

### File Organization

```
src/
├── components/    # Reusable UI components
├── views/         # Route-level page components
├── composables/   # Shared reactive state and logic
├── utils/         # Pure utility functions
├── router/        # Vue Router setup
├── assets/        # Styles, images, sounds
├── App.vue        # Root component (just <router-view />)
└── main.ts        # Entry point
```

**Naming conventions:**

- Components: PascalCase (e.g., `RadioPlayer.vue`)
- Composables: camelCase with `use` prefix (e.g., `useRadio.ts`)
- Utils: camelCase (e.g., `geography.ts`)

## Data Schema

All geographic data is linked using the `ADMIN` country name (e.g., `"United States of America"`):

| File                               | Linking Field      | Description                                        |
| ---------------------------------- | ------------------ | -------------------------------------------------- |
| `public/data/index.json`           | Object keys        | Maps ADMIN names to byte offsets in stations.jsonl |
| `public/data/stations.jsonl`       | `ADMIN`            | Fixed-width JSONL records (1053 bytes each)        |
| `public/data/centers.geojson`      | `properties.ADMIN` | Country center points (lon/lat)                    |
| `public/data/ne_countries.geojson` | `properties.ADMIN` | Country boundary polygons                          |

**index.json structure:**

```json
{
  "config": { "line_length": 1053 },
  "countries": {
    "Afghanistan": { "start": 0, "count": 5 },
    "Albania": { "start": 5265, "count": 20 }
  }
}
```

**stations.jsonl record fields:**

```json
{
  "place_id": "bJHG3R4J",
  "channel_id": "ndNglOCM",
  "channel_url": "/listen/...",
  "place_name": "Kabul",
  "channel_name": "RTA Taranum Radio 91.3 FM",
  "place_size": 5,
  "country": "Afghanistan",
  "geo_lat": 34.55535,
  "geo_lon": 69.20749,
  "channel_resolved_url": "https://...",
  "ADMIN": "Afghanistan",
  "ISO_A3": "AFG",
  "ISO_A2_EH": "AF",
  "CONTINENT": "Asia"
}
```

**Loading strategy:** `useRadio` fetches `index.json` to get byte offsets, then uses HTTP Range requests to lazily load only the stations needed for the current game round from `stations.jsonl`.

## Game Architecture

### State Flow

1. `useRadio.loadStations()` loads index.json and centers.geojson
2. `useRadio.selectRandomCountry()` picks a secret country and 5 stations
3. User interacts with `Map.vue` (clicks country) → emits `select-country`
4. Parent view updates `guessInput` → passes to `GuessPanel.vue`
5. User submits → parent calls `useRadio.checkGuess()`
6. State persists to sessionStorage via `useRadio.saveState()`

### Key Files

- **src/composables/useRadio.ts**: Game state, station loading, guess validation
- **src/components/Map.vue**: MapLibre GL JS integration, country selection
- **src/components/RadioPlayer.vue**: Audio streaming with HLS/Icecast support
- **src/utils/geography.ts**: Distance/direction calculations (haversine, bearings)
- **src/utils/colors.ts**: Color mapping for hot/cold feedback
- **src/views/Play.vue**: Responsive wrapper (desktop vs mobile)

### MapLibre Integration

**Best practices:**

- Store map instance in `shallowRef()` (not `ref()`)
- Use `watch()` to sync Vue props → MapLibre layers
- Call `map.value.resize()` when container size changes
- Use `ResizeObserver` for automatic resize handling

**Example from Map.vue:**

```typescript
const map = shallowRef<maplibregl.Map | null>(null)

watch(
  () => props.guessedCountries,
  (newGuesses) => {
    if (!map.value || !map.value.getLayer('countries-guessed')) return
    map.value.setFilter('countries-guessed', ['in', 'NAME', ...newGuesses])
  },
  { deep: true }
)
```

## Common Tasks

### Adding a New Component

1. Create file in `src/components/` with PascalCase name
2. Use `<script setup lang="ts">` syntax
3. Type all props and emits
4. Prefer composition over large monolithic components
5. Use Tailwind classes for styling

### Adding a New Route

1. Create view in `src/views/`
2. Add route to `src/router/index.ts`:

```typescript
{
  path: '/new-page',
  name: 'NewPage',
  component: NewPage,
}
```

### Adding a New Util Function

1. Create/edit file in `src/utils/`
2. Export pure functions (no side effects)
3. Add proper TypeScript types
4. Consider adding unit tests in `__tests__/`

### Modifying Game State

1. Edit `src/composables/useRadio.ts`
2. Add new reactive variables at module level if shared
3. Expose via return object
4. Update `saveState()`/`restoreState()` if persistent

## Testing

**Framework:** Vitest

**Current coverage:** `src/composables/__tests__/useRadio.spec.ts`

**Run tests:**

```bash
npm test
```

**When to add tests:**

- New composables
- Complex utility functions (geography calculations, etc.)
- Bug fixes (regression tests)

## Build & Deployment

```bash
npm run build
```

**Output:** `dist/`

**Build process:**

1. TypeScript type checking (`vue-tsc -b`)
2. Vite bundling with chunk splitting
3. Copy `index.html` → `404.html` for SPA routing

**Environment-specific:**

- `import.meta.env.VITE_DEBUG_MODE` - Only set in development
- `import.meta.env.VITE_GIT_HASH` - Injected at build time

## Code Quality

**Formatting:**

```bash
npm run format
```

**Linting:** TypeScript compiler catches most issues via strict mode

**Pre-commit:** No hooks currently, but consider adding Prettier pre-commit

## Design System Reference

**Colors:**

- Primary: `gumball-blue` (#3B82F6)
- Accents: `yuzu-yellow`, `bubblegum-pop`, `mint-shake`, `berry-oops`
- Neutrals: `cloud-white` (background), `paper-white`, `pencil-lead`, `eraser-grey`

**Typography:**

- Headings/Buttons: Fredoka (600, 700)
- Body: Nunito (400, 700)

**Components:**

- Use `.btn-pressable` for tactile button effect
- All borders are 2-3px with `border-pencil-lead`
- Rounded corners everywhere (16px buttons, 24px cards)

## Common Pitfalls

1. **Don't** use Options API - always use Composition API
2. **Don't** use `ref()` for MapLibre instances - use `shallowRef()`
3. **Don't** import Tailwind config JS - configuration is in CSS using `@theme`
4. **Don't** mutate props - emit events to parent instead
5. **Don't** forget to clean up in `onUnmounted()` (event listeners, observers, etc.)
6. **Don't** use CommonJS syntax - project is ESM (`"type": "module"`)

## Questions?

Refer to:

- **README.md** for high-level overview
- **src/assets/styles/style.css** for design system implementation
- **Existing components** for patterns and examples
