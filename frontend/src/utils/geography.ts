// Imports from Turf.js
import area from "@turf/area";
import booleanIntersects from "@turf/boolean-intersects";
import distance from "@turf/distance";
import explode from "@turf/explode";
import { polygon } from "@turf/helpers";
import type { Feature, Geometry, Polygon } from "geojson";

// Helper: Extract major landmasses from a MultiPolygon or FeatureCollection
// We calculate the total area of the country and include any polygon
// that contributes at least 20% to the total area.
function getMajorLandmasses(feature: Feature<Geometry>): Feature<Polygon>[] {
  const geometry = feature?.geometry;
  if (!geometry) return [];

  if (geometry.type === "Polygon") {
    return [feature as Feature<Polygon>];
  }

  if (geometry.type === "MultiPolygon") {
    const polygons: { feature: Feature<Polygon>; area: number }[] = [];
    let totalArea = 0;

    // Calculate areas for all polygons
    for (const polyCoords of geometry.coordinates) {
      const polyFeature = polygon(polyCoords);
      const polyArea = area(polyFeature);
      totalArea += polyArea;
      polygons.push({ feature: polyFeature, area: polyArea });
    }

    // Keep polygons >= 20% of total area
    const threshold = totalArea * 0.2;
    return polygons.filter((p) => p.area >= threshold).map((p) => p.feature);
  }

  return [];
}

// Distance Hint Result
// emoji: one hint emoji for the level (🤏 🟡 🟠 🔴)
// level: 1-6 scale (1=closest, 6=farthest)
// distance: nearest-border distance in km (0 if touching, Infinity if a feature is missing)
interface DistanceHintResult {
  emoji: string;
  level: number;
  distance: number;
}

// Distance Magnitude Logic
// Distance is in KILOMETERS.
// Level 1: 0-50 km     (Yellow 2) -> 🤏
// Level 2: 50-250 km   (Yellow 1) -> 🟡
// Level 3: 250-750 km  (Orange 2) -> 🟠
// Level 4: 750-1500 km (Orange 1) -> 🟠
// Level 5: 1500-3000 km(Red 2)    -> 🔴
// Level 6: 3000+ km    (Red 1)    -> 🔴
function getDistanceLevel(distance: number): number {
  if (distance <= 50) return 1;
  if (distance <= 250) return 2;
  if (distance <= 750) return 3;
  if (distance <= 1500) return 4;
  if (distance <= 3000) return 5;
  return 6;
}

// Hint emoji per level, indexed by level - 1
const LEVEL_EMOJIS = ["🤏", "🟡", "🟠", "🟠", "🔴", "🔴"];

// Minimum vertex-to-vertex distance (km) between two sets of landmass polygons
function minPolygonDistance(
  guessPolys: Feature<Polygon>[],
  secretPolys: Feature<Polygon>[],
): number {
  let globalMinDistance = Infinity;

  // Compare every major guess polygon to every major secret polygon
  for (const guessPoly of guessPolys) {
    const guessPoints = explode(guessPoly);

    for (const secretPoly of secretPolys) {
      const secretPoints = explode(secretPoly);

      // Find minimum distance between this pair of polygons
      guessPoints.features.forEach((guessPoint) => {
        secretPoints.features.forEach((secretPoint) => {
          const d = distance(guessPoint, secretPoint, { units: "kilometers" });
          if (d < globalMinDistance) {
            globalMinDistance = d;
          }
        });
      });
    }
  }

  return globalMinDistance;
}

// Border Distance Logic
export function nearestBorderDistance(
  guessFeature: Feature<Geometry>,
  secretFeature: Feature<Geometry>,
): number {
  return minPolygonDistance(getMajorLandmasses(guessFeature), getMajorLandmasses(secretFeature));
}

export function getDistanceHint(
  guessFeature: Feature<Geometry>,
  secretFeature: Feature<Geometry>,
): DistanceHintResult {
  let dist: number;

  const guessPolys = getMajorLandmasses(guessFeature);
  const secretPolys = getMajorLandmasses(secretFeature);

  // Check for intersection first (any pair)
  let intersects = false;
  for (const gPoly of guessPolys) {
    for (const sPoly of secretPolys) {
      if (booleanIntersects(gPoly, sPoly)) {
        intersects = true;
        break;
      }
    }
    if (intersects) break;
  }

  if (intersects) {
    dist = 0;
  } else if (guessPolys.length > 0 && secretPolys.length > 0) {
    // Calculate distance between nearest border points of major landmasses
    dist = minPolygonDistance(guessPolys, secretPolys);
  } else {
    // Fallback if features are missing
    dist = Infinity;
  }

  const level = getDistanceLevel(dist);
  const emoji = LEVEL_EMOJIS[level - 1] ?? "🔴";

  return {
    emoji,
    level,
    distance: dist,
  };
}
