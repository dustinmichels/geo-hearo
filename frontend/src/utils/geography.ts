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

// 2. Forward Azimuth Bearing
export function getBearing(p1: Coordinates, p2: Coordinates): number {
  const lat1 = toRad(p1.lat)
  const lat2 = toRad(p2.lat)
  const dLon = toRad(p2.lng - p1.lng)

  const y = Math.sin(dLon) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

  const theta = Math.atan2(y, x)
  return (toDeg(theta) + 360) % 360
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

// 4. Dot Magnitude Logic
function getDotCount(distance: number): number {
  if (distance <= 1000) return 1
  if (distance <= 3500) return 2
  if (distance <= 8000) return 3
  return 4
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
