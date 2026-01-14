# GeoHearo

A geography guessing game where players identify countries by listening to live local radio stations.

## Tech Stack

- **Framework:** Vue 3 (Composition API) + TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS v4 + Vant UI + Lucide Icons
- **Maps:** MapLibre GL JS with custom GeoJSON layers
- **Animation:** GSAP
- **Routing:** Vue Router
- **Testing:** Vitest
- **Code Quality:** Prettier, TypeScript strict mode

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview

# Format code
npm run format
```

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Map.vue       # MapLibre map with country selection
│   │   ├── RadioPlayer.vue  # Audio streaming (HLS/Icecast)
│   │   ├── GuessPanel.vue   # Guess input and history
│   │   ├── GameResultModal.vue  # Win/lose modal
│   │   └── ...
│   ├── views/            # Route-level page components
│   │   ├── Home.vue      # Landing page
│   │   ├── Play.vue      # Game controller (desktop/mobile)
│   │   ├── PlayDesktop.vue  # Desktop game layout
│   │   ├── PlayMobile.vue   # Mobile game layout
│   │   └── About.vue     # About page
│   ├── composables/      # Composition API composables
│   │   └── useRadio.ts   # Game state and radio station logic
│   ├── utils/            # Helper functions
│   │   ├── audio.ts      # Static audio generation
│   │   ├── colors.ts     # Color mapping for feedback
│   │   └── geography.ts  # Distance/direction calculations
│   ├── router/           # Vue Router configuration
│   │   └── index.ts
│   ├── assets/
│   │   └── styles/
│   │       └── style.css # Tailwind v4 config + custom styles
│   ├── App.vue           # Root component
│   └── main.ts           # Application entry point
├── public/
│   ├── data/             # Static game data
│   │   ├── radio.json    # Radio stations with ISO_A2 codes
│   │   ├── centers.geojson  # Country centroids (iso_a2)
│   │   └── ne_countries.geojson  # Country boundaries (ISO_A2_EH)
│   └── ...               # Favicon and PWA assets
└── ...config files
```

## Game Architecture

### How It Works

1. **Initialization**: On game start, the app loads radio stations from `public/data/radio.json` and randomly selects a country
2. **Radio Streaming**: `RadioPlayer.vue` handles audio playback with 5 stations per country, playing static during loading/switching
3. **Map Interaction**: Users explore the interactive map (`Map.vue`) using MapLibre GL JS to pan, zoom, and click countries
4. **Guessing Logic**:
   - Users submit guesses via `GuessPanel.vue`
   - Correct guess → Win modal
   - Incorrect guess → Visual arrows on map showing distance/direction + color-coded "hot/cold" feedback
   - 5 incorrect guesses → Game Over
5. **State Management**: Shared game state managed via `useRadio.ts` composable with sessionStorage persistence

### Key Features

- **Responsive Design**: Separate desktop and mobile layouts
- **Debug Mode**: Set `VITE_DEBUG_MODE=true` to highlight the secret country
- **Keyboard Shortcuts** (Desktop):
  - `Space`: Play/Pause
  - `Arrow Left/Right`: Previous/Next station
  - `Enter`: Submit guess
- **Session Persistence**: Game state saved in sessionStorage (survives page refresh)

## Data Schema

All geographic data is linked using ISO country codes:

- `public/data/centers.geojson` → `properties.iso_a2`
- `public/data/ne_countries.geojson` → `properties.ISO_A2_EH`
- `public/data/radio.json` → `ISO_A2` field

See [CLAUDE.md](./CLAUDE.md) for technical notes about data structure.

## Development

### Environment Variables

Create a `.env` file (see `.env.template`):

```bash
# Enable debug mode (shows secret country)
VITE_DEBUG_MODE=true
```

### Code Style

- **TypeScript**: Strict mode enabled with comprehensive linting rules
- **Vue 3**: Composition API with `<script setup lang="ts">` syntax
- **Formatting**: Prettier (run `npm run format`)
- **Imports**: Use `@/` alias for src imports (e.g., `import { useRadio } from '@/composables/useRadio'`)

### Best Practices

1. **Component Composition**: Keep components focused and composable
2. **State Management**: Use composables (not Pinia/Vuex) for shared state
3. **Styling**: Prefer Tailwind utility classes over custom CSS
4. **TypeScript**: Properly type all props, emits, and reactive state
5. **Reactivity**: Use `ref()` for primitives, `shallowRef()` for non-reactive objects like Map instances

## Build & Deploy

The production build includes:

- TypeScript type checking (`vue-tsc -b`)
- Optimized chunk splitting (Vue, MapLibre, Vant, and vendor bundles)
- Git commit hash injection (`import.meta.env.VITE_GIT_HASH`)
- 404.html copy for SPA routing support

```bash
npm run build
# Output: dist/
```

## Design System

See implementation in `src/assets/styles/style.css`:

- **Theme**: "Saturday Morning Cartoon" - fun, rounded, tactile
- **Colors**: Candy-inspired palette (Gumball Blue, Yuzu Yellow, Bubblegum Pop, etc.)
- **Typography**: Fredoka (headings/buttons), Nunito (body)
- **Components**: Pressable buttons with hard shadows, rounded corners everywhere

## License

MIT
