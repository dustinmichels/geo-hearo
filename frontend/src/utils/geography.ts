import type { RadioStation } from '../composables/useRadio'

interface Coordinates {
  lat: number
  lng: number
}

interface DirectionResult {
  arrows: string
}

export function getCountryLocation(
  countryName: string,
  stations: RadioStation[]
): Coordinates | null {
  const station = stations.find((s) => s.country === countryName)
  if (!station || !station.center) return null
  // radio.json "center" is [lng, lat] based on the file content I saw earlier:
  // "center": [33.361435, 35.174778] (lng, lat) for Cyprus
  return {
    lng: station.center[0],
    lat: station.center[1],
  }
}

export function getDirectionalArrows(
  guess: Coordinates,
  secret: Coordinates
): DirectionResult {
  const latDiff = secret.lat - guess.lat
  let lngDiff = secret.lng - guess.lng

  // Handle wrapping for longitude
  if (lngDiff > 180) {
    lngDiff -= 360
  } else if (lngDiff < -180) {
    lngDiff += 360
  }

  let latArrows = ''
  let lngArrows = ''

  // Determine number of arrows based on thresholds
  // > 30: 3 arrows
  // > 10: 2 arrows
  // > 2:  1 arrow (below 2 is considered "very small" and gets 0 arrows initially)
  const getArrowCount = (diff: number) => {
    const abs = Math.abs(diff)
    if (abs > 30) return 3
    if (abs > 10) return 2
    if (abs > 2) return 1
    return 0
  }

  let latCount = getArrowCount(latDiff)
  let lngCount = getArrowCount(lngDiff)

  // Ensure at least one arrow is displayed
  // If both are 0, force the dominant direction to have 1 arrow
  if (latCount === 0 && lngCount === 0) {
    if (Math.abs(latDiff) >= Math.abs(lngDiff)) {
      latCount = 1
    } else {
      lngCount = 1
    }
  }

  // Construct arrow strings
  const latSymbol = latDiff > 0 ? '⬆️' : '⬇️'
  if (latCount > 0) {
    latArrows = latSymbol.repeat(latCount)
  }

  const lngSymbol = lngDiff > 0 ? '➡️' : '⬅️'
  if (lngCount > 0) {
    lngArrows = lngSymbol.repeat(lngCount)
  }

  let totalArrows = latArrows
  if (latArrows && lngArrows) {
    totalArrows += ' • '
  }
  totalArrows += lngArrows

  return {
    arrows: totalArrows,
  }
}
