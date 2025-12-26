# Style Guide UI

**Vibe:** Fun, Light, Tactile, "Saturday Morning Cartoon"
**Keywords:** Squishy, Pop, Rounded, Airy, Safe

---

## 1. Design Pillars

1. **Squishy & Pop:** Elements should feel tactile. Buttons have depth; cards feel like stickers.
2. **No Sharp Edges:** Everything is rounded. Avoid 90-degree angles.
3. **High Saturation, Low Strain:** Colors are bright and candy-like, but backgrounds are warm/creamy to prevent eye strain.
4. **Thick Lines:** Use bold borders (2px-3px) to mimic a drawing or comic book style.

---

## 2. Color Palette

### The "Candy Shop" (Brand Colors)

| Name              | Hex       | Usage                   | Visual Feel             |
| :---------------- | :-------- | :---------------------- | :---------------------- |
| **Gumball Blue**  | `#3B82F6` | Primary Actions, Links  | Energetic & Trustworthy |
| **Yuzu Yellow**   | `#FCD34D` | Highlights, Badges      | Sunny, Happy, & Loud    |
| **Bubblegum Pop** | `#F472B6` | Accents, "Like" buttons | Sweet & Playful         |
| **Mint Shake**    | `#34D399` | Success States          | Fresh & Clean           |
| **Berry Oops**    | `#F87171` | Errors, Deletions       | Urgent but soft         |

### The "Sketchbook" (Neutrals)

| Name            | Hex       | Usage                    | Note                                      |
| :-------------- | :-------- | :----------------------- | :---------------------------------------- |
| **Cloud White** | `#FFF9F5` | **Page Background**      | A warm cream/off-white.                   |
| **Paper White** | `#FFFFFF` | **Component Background** | Pure white for contrast on Cloud.         |
| **Pencil Lead** | `#334155` | **Primary Text**         | Soft dark blue-grey. **Never use black.** |
| **Eraser Grey** | `#94A3B8` | **Secondary Text**       | Subtitles, placeholders.                  |

---

## 3. Typography

**Font Provider:** [Google Fonts](https://fonts.google.com/)

### Headings: `Fredoka`

- **Weights:** SemiBold (600), Bold (700)
- **Usage:** H1, H2, H3, and Buttons.
- **Vibe:** Bubbly, rounded, and impact-heavy.

### Body: `Nunito`

- **Weights:** Regular (400), Bold (700)
- **Usage:** Paragraphs, inputs, labels, data tables.
- **Vibe:** Highly readable rounded sans-serif.

### Type Scale

- **H1:** `3.5rem` (Leading: 1.1)
- **H2:** `2.5rem` (Leading: 1.2)
- **H3:** `1.75rem` (Leading: 1.3)
- **Body:** `1.125rem` (Leading: 1.6)
- **Button Text:** `1.25rem` (Uppercase or Capitalized)

---

## 4. UI Components

### Buttons (The "Pressable" Effect)

Buttons should have a hard shadow that disappears when clicked, simulating a physical button press.

**CSS Reference:**

```css
.btn {
  font-family: 'Fredoka', sans-serif;
  border-radius: 16px;
  border: none;
```
