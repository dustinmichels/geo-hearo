# GeoHearo

A geography guessing game where players identify countries by listening to live local radio stations.

## Quick Start

```bash
npm install
npm run dev       # Start dev server
npm test          # Run tests
npm run build     # Production build (output: dist/)
npm run format    # Format code
```

## Tech Stack

- **Framework:** Vue 3 (Composition API) + TypeScript (strict)
- **Build:** Vite 7
- **Styling:** Tailwind CSS v4 + Vant UI + Lucide Icons
- **Maps:** MapLibre GL JS
- **Animation:** GSAP
- **Testing:** Vitest

## How It Works

Players listen to radio stations from a mystery country and try to identify it on an interactive map. Each round provides ~5 stations and allows up to 5 guesses, with distance/direction feedback after each wrong guess.

**Game Modes:**

- **Free Play** — Random country each round, unlimited replays
- **Daily Challenge** — One shared puzzle per day for all players, seeded by date. Tracked in localStorage to prevent replays.

**Data Loading:** The app fetches a country index (`public/data/index.json`), then uses HTTP Range requests to lazily load only the needed station records from `public/data/stations.jsonl`. All geographic data is linked by the `ADMIN` country name field.

## Project Structure

```
src/
├── components/      # UI components (Map, RadioPlayer, GuessPanel, etc.)
├── views/           # Route pages (Home, Play, PlayDesktop, PlayMobile, About)
├── composables/     # Shared state (useRadio.ts, useGamePlay.ts)
├── utils/           # Pure functions (geography, colors, audio)
├── router/          # Vue Router config
├── assets/styles/   # Tailwind v4 theme + custom styles
├── App.vue          # Root component
└── main.ts          # Entry point
```

## Design System

"Saturday Morning Cartoon" — rounded, colorful, tactile. Fredoka for headings, Nunito for body. Candy-inspired palette (Gumball Blue, Yuzu Yellow, Bubblegum Pop). See `src/assets/styles/style.css` for full theme.

## Environment Variables

- `VITE_DEBUG_MODE=true` — Shows secret country on map (dev only)
- `VITE_GIT_HASH` — Injected at build time
