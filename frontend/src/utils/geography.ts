// X,Y Grid Geography Implementation
// Treats the world as a simple Equirectangular projection (lat=y, lng=x)
// Distance is Euclidean distance in degrees.
// Bearing is standard vector angle converted to compass.

interface Coordinates {
  lat: number
  lng: number
}

// Result can just be the string because count is implicit in the dots,
// but we keep the structure compatible with what GuessDisplay might expect if it used 'count' for color.
// We will return count as the number of dots (1-4).
interface DirectionResult {
  arrows: string
  count: number
}

function toDeg(radians: number): number {
  return (radians * 180) / Math.PI
}

// 1. Euclidean Distance on a Grid (with Longitude Wrap)
export function getDistance(p1: Coordinates, p2: Coordinates): number {
  const dy = Math.abs(p2.lat - p1.lat)
  let dx = Math.abs(p2.lng - p1.lng)

  // Handle wrapping across the antimeridian (180/-180)
  // If the distance is greater than 180, going the other way is shorter.
  if (dx > 180) {
    dx = 360 - dx
  }

  // Simple Euclidean distance in "degrees"
  return Math.sqrt(dx * dx + dy * dy)
}

// 2. Simplified Bearing (Map Direction)
// - Wraps E/W (shortest longitudinal path)
// - Does NOT wrap N/S (shortest latitudinal difference)
// - Returns Compass Bearing (0=N, 90=E, 180=S, 270=W)
export function getBearing(p1: Coordinates, p2: Coordinates): number {
  const lat1 = p1.lat
  const lat2 = p2.lat
  const lng1 = p1.lng
  const lng2 = p2.lng

  // 1. dLat (North/South difference) -- Y axis
  // Positive = North, Negative = South
  const dy = lat2 - lat1

  // 2. dLng (East/West difference + Wrap) -- X axis
  // We want the shortest path E/W
  let dx = lng2 - lng1
  if (dx > 180) {
    dx -= 360
  } else if (dx < -180) {
    dx += 360
  }

  // 3. Angle calculation
  // Basic vector angle in the plane. No spherical corrections.
  // dy is Y component, dx is X component.
  const angleRad = Math.atan2(dy, dx)

  // 4. Convert to Compass Bearing
  // Math angle: 0 = East, 90 = North
  // Compass: 0 = North, 90 = East
  // Compass = 90 - Math
  const angleDeg = toDeg(angleRad)
  return (90 - angleDeg + 360) % 360
}

// 3. Snap Bearing to 8 Cardinal Directions
function getSnappingArrow(bearing: number): string {
  // 337.5° – 22.5° -> N
  // Shift by 22.5 to aline sectors starting at 0
  const adjusted = (bearing + 22.5) % 360
  const sector = Math.floor(adjusted / 45)

  switch (sector) {
    case 0:
      return '⬆️' // North
    case 1:
      return '↗️' // NE
    case 2:
      return '➡️' // East
    case 3:
      return '↘️' // SE
    case 4:
      return '⬇️' // South
    case 5:
      return '↙️' // SW
    case 6:
      return '⬅️' // West
    case 7:
      return '↖️' // NW
    default:
      return '⬆️' // Should not happen
  }
}

// 4. Arrow Magnitude Logic
// Distance is now in DEGREES.
// 0.5 deg ~= 55km (Very Close)
// 20 deg ~= 2220km (Close)
// 60 deg ~= 6660km (Far)
function getDotCount(distance: number): number {
  if (distance <= 0.5) return 0 // Correct / Very Close
  if (distance <= 20) return 1 // Close
  if (distance <= 60) return 2 // Closer
  return 3 // Far
}

export function getDirectionalArrows(
  guess: Coordinates,
  secret: Coordinates
): DirectionResult {
  const distance = getDistance(guess, secret)
  const bearing = getBearing(guess, secret)

  const arrow = getSnappingArrow(bearing)
  const count = getDotCount(distance)

  return {
    arrows: arrow,
    count: count,
  }
}
