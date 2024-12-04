import L from 'leaflet'

import json from '../../assets/data/centers.json'
import { SourceData, loadSourceData } from '../data'

// ----- TYPES -----
export interface Centers {
  type: string
  crs: {
    type: string
    properties: {
      name: string
    }
  }
  features: Feature[]
}

interface Feature {
  type: string
  properties: {
    COUNTRYAFF: string
    AFF_ISO: string
  }
  geometry: {
    type: string
    coordinates: number[]
  }
}

// export const loadCentersData = () => {
//   return json as Centers
// }

const data = json as Centers

export function getFeatureByCountry(country: SourceData): Feature {
  const feat = data.features.find(
    (feature) => feature.properties.AFF_ISO === country.two_code
  )
  if (!feat)
    throw new Error(
      `Country with two-letter code ${country.two_code} not found`
    )
  return feat
}

export function getDistance(
  guessCountry: SourceData,
  targetCountry: SourceData
) {
  // helper function to get lat/long from a country
  const getLatLong = (country: SourceData) => {
    const feature = getFeatureByCountry(country)
    const [lon, lat, _] = feature.geometry.coordinates
    return L.latLng(lat, lon)
  }
  const loc1 = getLatLong(guessCountry)
  const loc2 = getLatLong(targetCountry)
  return L.CRS.EPSG3857.distance(loc1, loc2) / 1000
}

// export function getCountryCodes() {
//   return data.features.map((feature) => feature.properties.COUNTRYAFF)
// }

export function getMaxDistance() {
  const data = loadSourceData()
  let maxDistance = 0
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data.length; j++) {
      if (i === j) continue
      const dist = getDistance(data[i], data[j])
      if (dist > maxDistance) {
        maxDistance = dist
      }
    }
  }
  return maxDistance
}
