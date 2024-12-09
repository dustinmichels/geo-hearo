import L from 'leaflet'
import { Bearing, Centers, Country } from '../types'
import { loadCenters } from './load'

const MARGIN = 8

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
    N: '↑',
    NE: '↗',
    E: '→',
    SE: '↘',
    S: '↓',
    SW: '↙️',
    W: '←',
    NW: '↖',
  }
  return arrowMap[direction]
}
