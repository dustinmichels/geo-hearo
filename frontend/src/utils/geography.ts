// Imports from Turf.js
import distance from '@turf/distance'
import explode from '@turf/explode'
import booleanIntersects from '@turf/boolean-intersects'
import type { Feature, Geometry } from 'geojson'

// Distance Hint Result
// emoji: The visual hint string (e.g., 🟣🟣🟣🟣)
// level: 1-4 scale (1=closest/yellow, 4=farthest/purple)
interface DistanceHintResult {
  emoji: string
  level: number
  distance: number
}

// 2. Distance Magnitude Logic
// Distance is in KILOMETERS.
// Level 1: <= 2000 km  (Close)              -> 🟡
// Level 2: <= 6000 km  (Medium)             -> 🟠
// Level 3: > 6000 km   (Far)                -> 🔴
function getDistanceLevel(distance: number): number {
  if (distance <= 2000) return 1
  if (distance <= 6000) return 2
  return 3
}

function getEmojiForLevel(level: number): string {
  switch (level) {
    case 1:
      return '🟡'
    case 2:
      return '🟠'
    case 3:
      return '🔴'
    default:
      return '🔴'
  }
}

// 4. Border Distance Logic
export function nearestBorderDistance(
  guessFeature: Feature<Geometry>,
  secretFeature: Feature<Geometry>
): number {
  if (!guessFeature || !secretFeature) return Infinity

  // Extract all vertices from both polygons
  const guessPoints = explode(guessFeature)
  const secretPoints = explode(secretFeature)

  // Find minimum distance between any two border points
  let minDistance = Infinity

  guessPoints.features.forEach((guessPoint) => {
    // If efficient approximation is needed, we could optimize this loop,
    // but for country polygons (usually < 1000 points simplified), n*m might be acceptable
    // or we rely on the fact that we've simplified geometries.
    secretPoints.features.forEach((secretPoint) => {
      const d = distance(guessPoint, secretPoint, { units: 'kilometers' })
      if (d < minDistance) {
        minDistance = d
      }
    })
  })

  return minDistance
}

export function getDistanceHint(
  guessFeature: Feature<Geometry>,
  secretFeature: Feature<Geometry>
): DistanceHintResult {
  let dist: number

  // Check for intersection first
  if (
    guessFeature &&
    secretFeature &&
    booleanIntersects(guessFeature, secretFeature)
  ) {
    dist = 0
  } else if (guessFeature && secretFeature) {
    // Calculate distance between nearest border points
    dist = nearestBorderDistance(guessFeature, secretFeature)
  } else {
    // Fallback if features are missing (should not happen in normal flow)
    dist = Infinity
  }

  const level = getDistanceLevel(dist)
  const emoji = getEmojiForLevel(level)

  return {
    emoji,
    level,
    distance: dist,
  }
}
