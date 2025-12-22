# Design Guide: The "Terra-Hertz" System

**Vibe:** Analog warmth, tactile controls, organic textures, and playful signals. Think: A walkie-talkie used on a forest hike.

---

## 1. Color Palette

The palette combines deep earth tones with high-contrast, glowing "indicator light" colors found on vintage radio equipment.

### Base Tones (The Earth)

Used for backgrounds, layouts, and containers.

| Color Name       | Hex       | CSS Variable        | Usage                                     |
| :--------------- | :-------- | :------------------ | :---------------------------------------- |
| **Forest Floor** | `#2B4238` | `--color-forest`    | Primary backgrounds, heavy contrast text. |
| **Sandstone**    | `#F4F1EA` | `--color-sand`      | Main canvas, page background.             |
| **Cardboard**    | `#E0D8C8` | `--color-cardboard` | Card backgrounds, panels, muted borders.  |
| **Loam**         | `#5C5248` | `--color-loam`      | Secondary text, subheaders.               |

### Signal Tones (The Radio)

Used for actions, buttons, notifications, and "glowing" elements.

| Color Name         | Hex       | CSS Variable        | Usage                                          |
| :----------------- | :-------- | :------------------ | :--------------------------------------------- |
| **Tuner Amber**    | `#FFB03B` | `--color-tuner`     | Primary buttons, active states, glowing dials. |
| **On-Air Red**     | `#FF4D4D` | `--color-on-air`    | Errors, "Live" indicators, delete actions.     |
| **Frequency Blue** | `#4DA6FF` | `--color-frequency` | Links, info toggles, water elements.           |
| **LCD Green**      | `#B8F244` | `--color-lcd`       | Success states, digital number displays.       |

### CSS Variables

```css
:root {
  /* Earth */
  --color-forest: #2b4238;
  --color-sand: #f4f1ea;
  --color-cardboard: #e0d8c8;
  --color-loam: #5c5248;

  /* Radio */
  --color-tuner: #ffb03b;
  --color-on-air: #ff4d4d;
  --color-frequency: #4da6ff;
  --color-lcd: #b8f244;

  /* Utility */
  --shadow-hard: 4px 4px 0px var(--color-forest);
}
```

---

## 2. Typography

We mix rounded, friendly geometric shapes (organic) with pixelated or monospaced fonts (radio/tech).

### Headings: **Space Grotesk**

A quirky sans-serif with geometric details that look like radio dials.

- **Weights:** 700 (Bold), 500 (Medium)
- **Usage:** Page titles, card headers.

### Body: **Nunito**

Highly rounded terminal sans-serif. It feels soft, fun, and organic.

- **Weights:** 400 (Regular), 700 (Bold)
- **Usage:** Paragraphs, long-form text, UI labels.

### Data/Display: **VT323** or **Fira Code**

Monospaced or Pixel font.

- **Usage:** Frequency numbers (e.g., "104.5 FM"), coordinates, timestamps, input fields.

### Import String

```html
<link
  rel="preconnect"
  href="[https://fonts.googleapis.com](https://fonts.googleapis.com)"
/>
<link
  rel="preconnect"
  href="[https://fonts.gstatic.com](https://fonts.gstatic.com)"
  crossorigin
/>
<link
  href="[https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&family=Space+Grotesk:wght@500;700&family=VT323&display=swap](https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&family=Space+Grotesk:wght@500;700&family=VT323&display=swap)"
  rel="stylesheet"
/>
```

### Font Stacks

```css
h1,
h2,
h3 {
  font-family: "Space Grotesk", sans-serif;
  letter-spacing: -0.02em;
}

body,
p,
button {
  font-family: "Nunito", sans-serif;
}

.frequency-display,
.code-snippet {
  font-family: "VT323", monospace;
  font-size: 1.2rem;
}
```

---

## 3. UI Components & Styling

The UI should feel "tactile." Users should feel like they are pressing physical buttons or turning knobs.

### Buttons (The "Push-to-Talk")

Buttons use "hard shadows" (no blur) to create a chunky, pop-art depth.

```css
.btn-primary {
  background-color: var(--color-tuner);
  color: var(--color-forest);
  border: 2px solid var(--color-forest);
  border-radius: 12px; /* Soft, organic corners */
  box-shadow: var(--shadow-hard); /* 4px solid offset */
  font-weight: 700;
  padding: 12px 24px;
  transition: all 0.1s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-primary:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px var(--color-forest);
}
```

### Cards & Panels

Panels resemble cardboard cutouts or retro plastic casings.

```css
.panel {
  background-color: var(--color-cardboard);
  border: 2px solid var(--color-forest);
  border-radius: 20px;
  padding: 24px;
}
```

### The "Static" Texture

To sell the radio vibe, add a subtle noise texture to the background using SVG or CSS patterns.

```css
.bg-texture {
  background-color: var(--color-sand);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='[http://www.w3.org/2000/svg'%3E%3Cfilter](http://www.w3.org/2000/svg'%3E%3Cfilter) id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
}
```

---

## 4. Iconography

Use filled, rounded icons. Avoid thin lines.

- **Preferred Set:** [Phosphor Icons](https://phosphoricons.com/) (Fill or Duotone weight) or FontAwesome (Solid).
- **Style:** Wrap icons in circles to look like screws or knobs.

**Example Icon Wrapper:**

```css
.icon-knob {
  background-color: var(--color-forest);
  color: var(--color-lcd);
  width: 40px;
  height: 40px;
  border-radius: 50%; /* Perfect circle */
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## 5. Layout Philosophy

1. **Chunky Borders:** Everything has a 2px-3px solid border in `--color-forest`.
2. **Radio Metaphors:**
   - Loaders should look like waveforms.
   - Toggles should look like physical sliding switches.
   - Volume/Value sliders should look like tuning bars.
3. **Playful Spacing:** Use generous padding. Don't crowd the controls.
