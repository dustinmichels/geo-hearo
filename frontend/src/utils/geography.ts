// Imports from Turf.js
import distance from '@turf/distance'
import explode from '@turf/explode'
import area from '@turf/area'
import { polygon } from '@turf/helpers'
import booleanIntersects from '@turf/boolean-intersects'
import type { Feature, Geometry, Polygon } from 'geojson'

// Helper: Extract the largest polygon from a MultiPolygon or FeatureCollection
// This ensures we calculate distance based on the main landmass, ignoring small islands.
function getLargestPolygon(
  feature: Feature<Geometry>
): Feature<Polygon> | null {
  if (!feature || !feature.geometry) return null

  const type = feature.geometry.type

  if (type === 'Polygon') {
    return feature as Feature<Polygon>
  }

  if (type === 'MultiPolygon') {
    const coords = (feature.geometry as any).coordinates
    let maxArea = -1
    let largestPoly: Feature<Polygon> | null = null

    // Iterate through each polygon in the multipolygon
    coords.forEach((polyCoords: any) => {
      const polyFeature = polygon(polyCoords)
      const polyArea = area(polyFeature)
      if (polyArea > maxArea) {
        maxArea = polyArea
        largestPoly = polyFeature
      }
    })

    return largestPoly
  }

  return null
}

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
// Level 1: 0-50 km     (Yellow 2) -> 🤏
// Level 2: 50-250 km   (Yellow 1) -> 🟡
// Level 3: 250-750 km  (Orange 2) -> 🟠
// Level 4: 750-1500 km (Orange 1) -> 🟠
// Level 5: 1500-3000 km(Red 2)    -> 🔴
// Level 6: 3000+ km    (Red 1)    -> 🔴
function getDistanceLevel(distance: number): number {
  if (distance <= 50) return 1
  if (distance <= 250) return 2
  if (distance <= 750) return 3
  if (distance <= 1500) return 4
  if (distance <= 3000) return 5
  return 6
}

function getEmojiForLevel(level: number): string {
  switch (level) {
    case 1:
      return '🤏'
    case 2:
      return '🟡'
    case 3:
    case 4:
      return '🟠'
    case 5:
    case 6:
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
  const guessPoly = getLargestPolygon(guessFeature)
  const secretPoly = getLargestPolygon(secretFeature)

  if (!guessPoly || !secretPoly) return Infinity

  // Extract all vertices from both polygons
  const guessPoints = explode(guessPoly)
  const secretPoints = explode(secretPoly)

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

  const guessPoly = getLargestPolygon(guessFeature)
  const secretPoly = getLargestPolygon(secretFeature)

  // Check for intersection first
  if (guessPoly && secretPoly && booleanIntersects(guessPoly, secretPoly)) {
    dist = 0
  } else if (guessPoly && secretPoly) {
    // Calculate distance between nearest border points
    dist = nearestBorderDistance(guessPoly, secretPoly)
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
