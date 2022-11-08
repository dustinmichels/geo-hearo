import L from 'leaflet'

import { Centers, FeaturesEntity } from './types'

const MAX_DISTANCE = 19968.927678453987

export class MapUtil {
  geoData: Centers

  constructor(centers: Centers) {
    this.geoData = centers
  }

  getCountries() {
    return this.geoData.features.map((feature) => feature.properties.COUNTRY)
  }

  getFeatureByCountry(country: string): FeaturesEntity {
    const feat = this.geoData.features.find(
      (feature) => feature.properties.COUNTRY === country
    )
    if (!feat) throw new Error(`Country ${country} not found`)
    return feat
  }

  getDistance(guessCountry: string, targetCountry: string) {
    const getLatLong = (countryName: string) => {
      const feature = this.getFeatureByCountry(countryName)

      const lon = feature.geometry.coordinates[0]
      const lat = feature.geometry.coordinates[1]

      // console.log({
      //   countryName,
      //   lat,
      //   lon,
      // })

      return L.latLng(lat, lon)
    }
    const loc1 = getLatLong(guessCountry)
    const loc2 = getLatLong(targetCountry)
    return L.CRS.EPSG3857.distance(loc1, loc2) / 1000
  }

  getMaxDistance() {
    const countries = this.getCountries()
    let maxDistance = 0
    for (let i = 0; i < countries.length; i++) {
      for (let j = 0; j < countries.length; j++) {
        if (i === j) continue
        const dist = this.getDistance(countries[i], countries[j])
        if (dist > maxDistance) {
          maxDistance = dist
        }
      }
    }
    return maxDistance
  }
}
