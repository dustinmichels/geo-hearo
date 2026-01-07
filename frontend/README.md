# Geo Hearo

A geography guessing game where players identify countries by listening to live local radio stations.

## Tech Stack

- **Framework:** Vue 3 + Vite (TypeScript)
- **Styling:** Tailwind CSS v4 (configured via Vite/CSS), Vant UI, Lucide Icons
- **Maps:** MapLibre GL JS + Custom GeoJSON layers
- **Animation:** GSAP
- **Routing:** Vue Router

## Architecture

### File Structure

```
src/
├── components/         # Game logic & UI widgets
│   ├── Map.vue         # MapLibre instance, visualizes guesses/arrows
│   ├── RadioPlayer.vue # Audio streaming logic (HLS/Icecast)
│   ├── GuessPanel.vue  # User input & game status
│   └── ...
├── views/              # Page layouts
│   ├── PlayDesktop.vue # Desktop game layout
│   └── PlayMobile.vue  # Mobile game layout
├── composables/        # Shared state (e.g., useRadio)
├── utils/              # Helpers (e.g., audio.ts static generator)
├── router/             # Vue Router configuration
└── App.vue             # Root component (RouterView only)
```

### Core Logic

1.  **Game Initialization:** The app selects a random country from `public/data/radio.json` and loads 5 associated radio stations.
2.  **Gameplay:**
    - **RadioPlayer**: Streams audio; plays static during loading/switching.
    - **Map**: Users pan/zoom to find the location. `Map.vue` handles vector layers and coordinate math.
    - **Guessing**: Users submit guesses via `GuessPanel`.
3.  **Feedback**:
    - Correct guess -> Win modal.
    - Incorrect guess -> Visual arrows on map (distance/direction) + "Hot/Cold" hints.
    - 5 strikes -> Game Over.

### Development

**Commands:**

- `npm run dev`: Start local development server.
- `npm run build`: Type-check and build for production.

**Environment Variables:**

- `VITE_DEBUG_MODE=true`: Enables debug overlays (e.g., highlights the target country in red on the map).

**Notes for AI Agents:**

- **State:** Shared state is managed via Composition API in `src/composables`.
- **Styling:** Use Tailwind utility classes.
- **Maps:** Map interactions are handled directly in `Map.vue` via MapLibre API.
