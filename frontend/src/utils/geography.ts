// Imports from Turf.js
import area from '@turf/area'
import booleanIntersects from '@turf/boolean-intersects'
import distance from '@turf/distance'
import explode from '@turf/explode'
import { polygon } from '@turf/helpers'
import type { Feature, Geometry, Polygon } from 'geojson'

// Helper: Extract major landmasses from a MultiPolygon or FeatureCollection
// We calculate the total area of the country and include any polygon
// that contributes at least 20% to the total area.
function getMajorLandmasses(feature: Feature<Geometry>): Feature<Polygon>[] {
  if (!feature || !feature.geometry) return []

  const type = feature.geometry.type

  if (type === 'Polygon') {
    return [feature as Feature<Polygon>]
  }

  if (type === 'MultiPolygon') {
    const coords = (feature.geometry as any).coordinates
    const polygons: { feature: Feature<Polygon>; area: number }[] = []
    let totalArea = 0

    // 1. Calculate areas for all polygons
    coords.forEach((polyCoords: any) => {
      const polyFeature = polygon(polyCoords)
      const polyArea = area(polyFeature)
      totalArea += polyArea
      polygons.push({ feature: polyFeature, area: polyArea })
    })

    // 2. Filter for polygons >= 20% of total area
    const threshold = totalArea * 0.2
    return polygons.filter((p) => p.area >= threshold).map((p) => p.feature)
  }

  return []
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
  const guessPolys = getMajorLandmasses(guessFeature)
  const secretPolys = getMajorLandmasses(secretFeature)

  if (guessPolys.length === 0 || secretPolys.length === 0) return Infinity

  let globalMinDistance = Infinity

  // Compare every major guess polygon to every major secret polygon
  for (const guessPoly of guessPolys) {
    const guessPoints = explode(guessPoly)

    for (const secretPoly of secretPolys) {
      const secretPoints = explode(secretPoly)

      // Find minimum distance between this pair of polygons
      guessPoints.features.forEach((guessPoint) => {
        secretPoints.features.forEach((secretPoint) => {
          const d = distance(guessPoint, secretPoint, { units: 'kilometers' })
          if (d < globalMinDistance) {
            globalMinDistance = d
          }
        })
      })
    }
  }

  return globalMinDistance
}

export function getDistanceHint(
  guessFeature: Feature<Geometry>,
  secretFeature: Feature<Geometry>
): DistanceHintResult {
  let dist: number

  const guessPolys = getMajorLandmasses(guessFeature)
  const secretPolys = getMajorLandmasses(secretFeature)

  // Check for intersection first (any pair)
  let intersects = false
  for (const gPoly of guessPolys) {
    for (const sPoly of secretPolys) {
      if (booleanIntersects(gPoly, sPoly)) {
        intersects = true
        break
      }
    }
    if (intersects) break
  }

  if (intersects) {
    dist = 0
  } else if (guessPolys.length > 0 && secretPolys.length > 0) {
    // Calculate distance between nearest border points of major landmasses
    dist = nearestBorderDistance(guessFeature, secretFeature)
  } else {
    // Fallback if features are missing
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
