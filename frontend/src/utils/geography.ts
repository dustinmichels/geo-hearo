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

// Earth radius in km
const R = 6371

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function toDeg(radians: number): number {
  return (radians * 180) / Math.PI
}

// 1. Haversine Distance
export function getDistance(p1: Coordinates, p2: Coordinates): number {
  const dLat = toRad(p2.lat - p1.lat)
  const dLon = toRad(p2.lng - p1.lng)
  const lat1 = toRad(p1.lat)
  const lat2 = toRad(p2.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// 2. Simplified Bearing (Map Direction)
// - Wraps E/W (shortest longitudinal path)
// - Does NOT wrap N/S (shortest latitudinal difference)
export function getBearing(p1: Coordinates, p2: Coordinates): number {
  const lat1 = p1.lat
  const lat2 = p2.lat
  const lng1 = p1.lng
  const lng2 = p2.lng

  // 1. dLat (North/South difference)
  // Positive = North, Negative = South
  const dLat = lat2 - lat1

  // 2. dLng (East/West difference + Wrap)
  // We want the shortest path E/W
  let dLng = lng2 - lng1
  if (dLng > 180) {
    dLng -= 360
  } else if (dLng < -180) {
    dLng += 360
  }

  // 3. Angle calculation
  // We use simple rectangular logic (Equirectangular projection style)
  // This avoids the "Great Circle" behavior where paths near poles directionally invert.
  // We scale dLng by cos(avgLat) to correct for the narrowing of longitude lines at poles.
  // This provides a "Physical Direction" approximation rather than a "Map Pixel Direction".
  const avgLatRad = toRad((lat1 + lat2) / 2)
  const angleRad = Math.atan2(dLat, dLng * Math.cos(avgLatRad))

  // 4. Convert to Compass Bearing (0 = N, 90 = E, 180 = S, 270 = W)
  // Math: 0 = E, 90 = N
  // Compass = 90 - Math
  const angleDeg = toDeg(angleRad)
  return (90 - angleDeg + 360) % 360
}

// 3. Snap Bearing to 8 Cardinal Directions
function getSnappingArrow(bearing: number): string {
  // 337.5° – 22.5° -> N (Adjust logic to handle wrap-around easily)
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

// 4. Arrow Magnitude Logic (3 = Far, 2 = Closer, 1 = Close, 0 = Correct)
function getDotCount(distance: number): number {
  if (distance <= 50) return 0 // Correct
  if (distance <= 2000) return 1 // Close
  if (distance <= 6000) return 2 // Closer
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
