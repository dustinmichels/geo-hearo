interface Coordinates {
  lat: number
  lng: number
}

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

export function getDistance(p1: Coordinates, p2: Coordinates): number {
  const dLat = toRad(p2.lat - p1.lat)
  const dLon = toRad(p2.lng - p1.lng)
  const lat1 = toRad(p1.lat)
  const lat2 = toRad(p2.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

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

function getArrowDistribution(bearing: number, totalSlots: number) {
  const bearingRad = toRad(bearing)
  
  // Calculate weights
  const vertical = Math.abs(Math.cos(bearingRad))
  const horizontal = Math.abs(Math.sin(bearingRad))
  
  // Distribute slots
  const totalWeight = vertical + horizontal
  const verticalSlots = Math.round((totalSlots * vertical) / totalWeight)
  const horizontalSlots = totalSlots - verticalSlots

  return { verticalSlots, horizontalSlots }
}

export function getDirectionalArrows(
  guess: Coordinates,
  secret: Coordinates
): DirectionResult {
  // 1. Calculate Distance & Total Slots
  const distance = getDistance(guess, secret)
  
  let totalSlots = 2
  if (distance > 5000) {
    totalSlots = 6
  } else if (distance > 2000) {
    totalSlots = 4
  } else if (distance <= 500) {
    totalSlots = 1
  }

  // 2. Calculate Bearing
  const bearing = getBearing(guess, secret)
  
  // 3. Distribute Slots
  const { verticalSlots, horizontalSlots } = getArrowDistribution(bearing, totalSlots)
  
  // 4. Construct Arrow Strings
  // Determine direction components based on bearing
  // 0 is North, 90 East, 180 South, 270 West
  
  let latSymbol = ''
  // North: 315-45 (approx check logic: if cos is positive, it's North-ish)
  // Actually simpler: 
  // North-ish: bearing > 270 or < 90
  // South-ish: bearing > 90 and < 270
  if (bearing > 270 || bearing < 90) {
      latSymbol = '⬆️'
  } else {
      latSymbol = '⬇️'
  }
  
  let lngSymbol = ''
  // East-ish: 0-180
  // West-ish: 180-360
  if (bearing > 0 && bearing < 180) {
      lngSymbol = '➡️'
  } else {
      lngSymbol = '⬅️'
  }
  
  const latArrows = latSymbol.repeat(verticalSlots)
  const lngArrows = lngSymbol.repeat(horizontalSlots)
  
  // Combine arrows - no separator
  return {
    arrows: latArrows + lngArrows,
    count: totalSlots,
  }
}
