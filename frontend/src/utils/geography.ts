interface Coordinates {
  lat: number
  lng: number
}

// Distance Hint Result
// emoji: The visual hint string (e.g., 🟣🟣🟣🟣)
// level: 1-4 scale (1=closest/yellow, 4=farthest/purple)
interface DistanceHintResult {
  emoji: string
  level: number
}

// 1. Haversine Formula (Great Circle Distance)
// Returns distance in kilometers
export function getDistance(p1: Coordinates, p2: Coordinates): number {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(p2.lat - p1.lat)
  const dLng = deg2rad(p2.lng - p1.lng)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(p1.lat)) *
      Math.cos(deg2rad(p2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

// 2. Distance Magnitude Logic
// Distance is in KILOMETERS.
// Level 1: <= 2000 km  (Close)              -> 🟡
// Level 2: <= 6000 km  (Medium)             -> 🟠🟠
// Level 3: > 6000 km   (Far)                -> 🔴🔴🔴
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
      return '🟠🟠'
    case 3:
      return '🔴🔴🔴'
    default:
      return '🔴🔴🔴'
  }
}

export function getDistanceHint(
  guess: Coordinates,
  secret: Coordinates
): DistanceHintResult {
  const distance = getDistance(guess, secret)
  const level = getDistanceLevel(distance)
  const emoji = getEmojiForLevel(level)

  return {
    emoji,
    level,
  }
}
