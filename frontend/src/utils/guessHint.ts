import type { Feature, Geometry } from "geojson";
import { getDistanceHint } from "./geography";

// Fill color per distance level (see getDistanceLevel in geography.ts)
const DISTANCE_COLORS: Record<number, string> = {
  1: "#FDE047", // Light yellow (Yellow 300)
  2: "#FBBF24", // Golden yellow (Amber 400)
  3: "#FB923C", // Light orange (Orange 400)
  4: "#F97316", // Dark orange (Orange 500)
  5: "#EF4444", // Medium red (Red 500)
  6: "#B91C1C", // Darkest red (Red 700)
};

export interface GuessHint {
  color: string;
  emoji: string;
  /** 0 for the correct country, 1–6 distance level, null when there is no geometry to measure. */
  level: number | null;
  /** Kilometres between the nearest borders, null when unknown. */
  distance: number | null;
}

const WIN_HINT: GuessHint = { color: "#4ade80", emoji: "🟢", level: 0, distance: 0 };
const UNKNOWN_HINT: GuessHint = { color: "#FFFFFF", emoji: "⬜", level: null, distance: null };

/** Color, emoji and distance for one guess, used by the map, the guess list and the share grid. */
export function hintFor(
  guess: string,
  secret: string,
  getFeature: (admin: string) => Feature<Geometry> | undefined,
): GuessHint {
  if (guess === secret) return WIN_HINT;

  const guessFeature = getFeature(guess);
  const secretFeature = getFeature(secret);
  if (!guessFeature || !secretFeature) return UNKNOWN_HINT;

  const { level, emoji, distance } = getDistanceHint(guessFeature, secretFeature);
  return { color: DISTANCE_COLORS[level]!, emoji, level, distance };
}
