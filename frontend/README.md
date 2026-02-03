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

```txt
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
│   │   ├── useRadio.ts   # Game state and radio station logic
│   │   └── useGamePlay.ts # Game flow, daily challenge integration
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
│   │   ├── stations.jsonl # Radio stations (line-delimited JSON)
│   │   ├── index.json     # Index for sparse fetching
│   │   ├── centers.geojson  # Country centroids (ADMIN)
│   │   └── ne_countries.geojson  # Country boundaries (ADMIN)
│   └── ...               # Favicon and PWA assets
└── ...config files
```

## Game Architecture

### Game Modes

**Free Play**: Unlimited rounds with randomly selected countries. Play as many times as you want.

**Daily Challenge**: One puzzle per day, shared across all players. A seeded random number generator ensures everyone gets the same mystery country on a given date. Progress is tracked in localStorage to prevent replaying the same day's challenge. A "Daily Challenge #X" badge displays the current day number (counting from the launch date).

### How It Works

1. **Initialization**: On game start, the app loads the country index from `public/data/index.json` and country centroids from `public/data/centers.geojson`. If a daily challenge is available (not yet completed today), the game enters daily challenge mode; otherwise it starts in free play.
2. **Station Selection**: A country is selected (deterministically for daily challenge, randomly for free play) using the `ADMIN` name, and ~5 radio stations are sparse-fetched from `public/data/stations.jsonl` using HTTP Range headers.
3. **Radio Streaming**: `RadioPlayer.vue` handles audio playback with the fetched stations.
4. **Map Interaction**: Users explore the interactive map (`Map.vue`) using MapLibre GL JS to pan, zoom, and click countries.
5. **Guessing Logic**:
   - Users submit guesses via `GuessPanel.vue` (matched against `ADMIN` name)
   - Correct guess → Win modal
   - Incorrect guess → Visual arrows on map showing distance/direction + color-coded "hot/cold" feedback
   - 5 incorrect guesses → Game Over
6. **State Management**: Shared game state managed via `useRadio.ts` and `useGamePlay.ts` composables with sessionStorage persistence. Daily challenge completion is tracked in localStorage.

### Key Features

- **Daily Challenge**: One shared puzzle per day for all players, with completion tracking
- **Responsive Design**: Separate desktop and mobile layouts
- **Debug Mode**: Set `VITE_DEBUG_MODE=true` to highlight the secret country
- **Keyboard Shortcuts** (Desktop):
  - `Space`: Play/Pause
  - `Arrow Left/Right`: Previous/Next station
  - `Enter`: Submit guess
- **Session Persistence**: Game state saved in sessionStorage (survives page refresh)
- **Sparse Data Loading**: Efficiently fetches only the data needed for the current round.

## Data Schema

All geographic data is linked using the `ADMIN` (Administrative Name) field:

- `public/data/centers.geojson` → `properties.ADMIN`
- `public/data/ne_countries.geojson` → `properties.ADMIN`
- `public/data/stations.jsonl` → `ADMIN` field (indexed via `public/data/index.json`)

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
