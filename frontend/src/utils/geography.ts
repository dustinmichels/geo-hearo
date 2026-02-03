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

// 2. Distance Magnitude Logic
// Distance is in DEGREES.
// Level 1: <= 20  (Close / Correct)    -> 🟡
// Level 2: <= 60  (Medium)             -> 🟠🟠
// Level 3: > 60   (Far)                -> 🔴🔴🔴
function getDistanceLevel(distance: number): number {
  if (distance <= 20) return 1
  if (distance <= 60) return 2
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
