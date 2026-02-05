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
- **State:** Pinia
- **Build:** Vite 7
- **Styling:** Tailwind CSS v4 + Vant UI + Lucide Icons
- **Maps:** MapLibre GL JS + Turf.js
- **Animation:** GSAP
- **Testing:** Vitest
- **Analytics:** Plausible

## How It Works

Players listen to radio stations from a mystery country and try to identify it on an interactive map. Each round provides ~5 stations and allows up to 5 guesses, with distance/direction feedback after each wrong guess.

**Game Modes:**

- **Free Play** — Random country each round, unlimited replays
- **Daily Challenge** — One shared puzzle per day for all players, seeded by date. Tracked in localStorage to prevent replays.

### Country Selection

Both modes funnel through `selectRandomCountry(seed?)` in `useRadio.ts`:

1. **Seed** — Daily challenge passes a deterministic seed; free play generates a random one.
2. **Pick country** — A `SeededRandom` LCG (multiplier 1103515245, increment 12345, mod 2^31) selects an index into the sorted country list from `index.json`.
3. **Pick stations** — The same RNG draws up to 5 unique station indices from that country's pool (sampling without replacement).

| Mode            | Seed source                                         | Result                                            |
| --------------- | --------------------------------------------------- | ------------------------------------------------- |
| Daily Challenge | `YYYYMMDD` integer (`year*10000 + month*100 + day`) | Same country & stations for every player that day |
| Free Play       | `Math.floor(Math.random() * 10000000)`              | Different country each round                      |

The daily challenge seed is based on the user's **local** date. `initDailyChallenge()` checks localStorage to see if today's puzzle was already completed; if so, the player falls through to free play.

The env var `VITE_SECRET_COUNTRY` overrides country selection entirely (dev only).

**Repetition & distribution notes:** The LCG stride through the country list has a GCD of 1 with the country count, so daily challenge seeds map to distinct countries — empirically verified with zero repeats across 60+ simulated days. Free play has no anti-repetition mechanism; each round draws independently, so repeats are expected after ~√N rounds (~12 with 142 countries). Modulo bias is negligible (~10⁻⁷).

**Data Loading:** The app fetches a country index (`public/data/index.json`), then uses HTTP Range requests to lazily load only the needed station records from `public/data/stations.jsonl`. All geographic data is linked by the `ADMIN` country name field.

**Audio Reliability:** To ensure uninterrupted gameplay, the app monitors the audio stream for silence. If a station connects but broadcasts silence for more than 2 seconds, it automatically skips to the next available station.

**Round End Flow:** When a round ends (win or loss), the result modal appears, stations become visible on the map, and the map resets to the default zoomed-out view. The zoom animation to the stations is deliberately delayed until the user dismisses the modal by clicking "See the stations", allowing them to watch the satisfying zoom transition.

## Project Structure

```
src/
├── components/      # UI components (Map, RadioPlayer, GuessPanel, GameResultModal, etc.)
├── views/           # Route pages (Home, Play, PlayDesktop, PlayMobile, About)
├── stores/          # Pinia stores (game.ts)
├── composables/     # Domain logic & shared state (useRadio, useGamePlay, useCountryData, etc.)
├── types/           # Shared TypeScript interfaces (geo.ts)
├── utils/           # Pure functions (geography, colors, audio)
├── router/          # Vue Router config
├── assets/styles/   # Tailwind v4 theme + custom styles
├── App.vue          # Root component
└── main.ts          # Entry point
```

## Distance Feedback

After each wrong guess, the player sees a color and emoji indicating how far their guess was from the secret country (measured border-to-border in kilometers).

| Distance (km) | Level | Color         | Hex       | Emoji |
| ------------- | ----- | ------------- | --------- | ----- |
| 0 – 50        | 1     | Light Yellow  | `#FDE047` | 🤏    |
| 50 – 250      | 2     | Golden Yellow | `#FBBF24` | 🟡    |
| 250 – 750     | 3     | Light Orange  | `#FB923C` | 🟠    |
| 750 – 1,500   | 4     | Dark Orange   | `#F97316` | 🟠    |
| 1,500 – 3,000 | 5     | Medium Red    | `#EF4444` | 🔴    |
| 3,000+        | 6     | Dark Red      | `#B91C1C` | 🔴    |

In the shareable results string, a correct guess is shown as 🟢.

## Design System

"Saturday Morning Cartoon" — rounded, colorful, tactile. Fredoka for headings, Nunito for body. Candy-inspired palette (Gumball Blue, Yuzu Yellow, Bubblegum Pop). See `src/assets/styles/style.css` for full theme.

## Environment Variables

- `VITE_DEBUG_MODE=true` — Shows secret country on map (dev only)
- `VITE_ROUND_FINISHED=true` — Forces the game into a "completed round" state (dev only)
- `VITE_GIT_HASH` — Injected at build time
