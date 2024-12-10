import * as d3 from 'd3'
import L from 'leaflet'
import { Bearing, Centers, Country } from '../types'
import { loadCenters } from './load'

const MARGIN = 8
const COLORS = [
  '#ffffcc',
  '#d9f0a3',
  '#addd8e',
  '#78c679',
  '#31a354',
  '#006837',
]

export class MapUtil {
  centers: Centers

  constructor() {
    this.centers = loadCenters()
  }

  findCountryInCenters(country: Country) {
    const feat = this.centers.features.find(
      (feature) => feature.properties.AFF_ISO === country.two_code
    )
    if (!feat)
      throw new Error(
        `Country with two-letter code ${country.two_code} not found`
      )
    return feat
  }

  getLatLong = (country: Country) => {
    const feature = this.findCountryInCenters(country)
    const [lon, lat, _] = feature.geometry.coordinates
    return L.latLng(lat, lon)
  }

  // Get distance between points in km
  computeDistance(guessCountry: Country, targetCountry: Country) {
    const loc1 = this.getLatLong(guessCountry)
    const loc2 = this.getLatLong(targetCountry)
    return L.CRS.EPSG3857.distance(loc1, loc2) / 1000
  }

  // Return a bearing from guessCountry to targetCountry (eg, 'NW' or 'S')
  // If the guess is within MARGIN of the target, only a single direction is returned
  computeDirection(guessCountry: Country, targetCountry: Country): Bearing {
    const targetLoc = this.getLatLong(guessCountry)
    const guessLoc = this.getLatLong(targetCountry)

    let direction = ''

    const diffLat = targetLoc.lat - guessLoc.lat
    const diffLng = targetLoc.lng - guessLoc.lng

    // Add a N/S marker, if the difference is greater than MARGIN
    if (diffLat > MARGIN) {
      direction += 'S'
    } else if (diffLat < -MARGIN) {
      direction += 'N'
    }

    // Add a E/W marker, if the difference is greater than MARGIN
    if (diffLng > MARGIN) {
      direction += 'W'
    } else if (diffLng < -MARGIN) {
      direction += 'E'
    }

    // If the direction is still empty, add one marker (whichever is larger)
    if (direction === '') {
      if (Math.abs(diffLat) > Math.abs(diffLng)) {
        direction += diffLat > 0 ? 'S' : 'N'
      } else {
        direction += diffLng > 0 ? 'W' : 'E'
      }
    }

    return direction as Bearing
  }

  // helper function to getMaxDistance
  getCountries(): Country[] {
    return this.centers.features.map((feature) => {
      return {
        name: feature.properties.COUNTRYAFF,
        two_code: feature.properties.AFF_ISO,
        three_code: '',
      }
    })
  }

  // make an array of all distances between countries
  getDistancesArr() {
    const countries = this.getCountries()
    const distances = []
    for (let i = 0; i < countries.length; i++) {
      for (let j = 0; j < countries.length; j++) {
        if (i === j) continue
        distances.push(this.computeDistance(countries[i], countries[j]))
      }
    }
    return distances
  }

  // get quantiles [0.25, 0.5, 0.75] of all distances
  computeDistanceQuantiles() {
    const q = calculateQuantiles(this.getDistancesArr())
    return {
      min: Math.min(...this.getDistancesArr()),
      q1: q[0],
      median: q[1],
      q3: q[2],
      max: Math.max(...this.getDistancesArr()),
    }
  }

  computeQuantilesWithColors() {
    const q = this.computeDistanceQuantiles()
    return {
      min: { value: q.min, color: COLORS[0] },
      q1: { value: q.q1, color: COLORS[1] },
      median: { value: q.median, color: COLORS[2] },
      q3: { value: q.q3, color: COLORS[3] },
      max: { value: q.max, color: COLORS[4] },
    }
  }

  getColorFunction() {
    const q = this.computeDistanceQuantiles()
    console.log('quantiles', q)
    return d3.scaleLinear(
      [q.max, q.q3, q.median, q.q1, q.min],
      ['#ffffcc', '#d9f0a3', '#addd8e', '#78c679', '#31a354']
    )
  }

  getMaxDistance() {
    const countries = this.getCountries()
    let maxDistance = 0
    for (let i = 0; i < countries.length; i++) {
      for (let j = 0; j < countries.length; j++) {
        if (i === j) continue
        const dist = this.computeDistance(countries[i], countries[j])
        if (dist > maxDistance) {
          maxDistance = dist
        }
      }
    }
    return maxDistance
  }
}

export function directionToArrow(direction: Bearing) {
  const arrowMap = {
    N: '⬆️',
    NE: '↗️',
    E: '➡️',
    SE: '↘️',
    S: '⬇️',
    SW: '↙️',
    W: '⬅️',
    NW: '↖️',
  }
  return arrowMap[direction]
}

export function calculateQuantiles(
  arr: number[],
  quantiles: number[] = [0.25, 0.5, 0.75]
): number[] {
  // Sort the array in ascending order
  const sorted = [...arr].sort((a, b) => a - b)
  const n = sorted.length

  // Helper function to calculate a quantile
  const getQuantile = (q: number): number => {
    const pos = (n - 1) * q // Index position in the sorted array
    const base = Math.floor(pos) // Integer part
    const rest = pos - base // Fractional part

    // If the index is an integer, return the exact value
    if (rest === 0) {
      return sorted[base]
    } else {
      // Interpolate between the two surrounding values
      return sorted[base] + rest * (sorted[base + 1] - sorted[base])
    }
  }

  // Compute each quantile
  return quantiles.map(getQuantile)
}
