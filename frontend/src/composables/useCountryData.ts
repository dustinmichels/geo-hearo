import { ref } from 'vue'
import type { CenterProperties, NeCountryProperties } from '../types/geo'
import type { Feature, Geometry } from 'geojson'

// State
// Maps ADMIN name -> [lon, lat]
const adminToCenter = ref<Map<string, [number, number]>>(new Map())
// Maps ADMIN name -> GeoJSON Feature
const adminToFeature = ref<Map<string, Feature<Geometry, NeCountryProperties>>>(
  new Map()
)
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useCountryData() {
  const loadCenters = async () => {
    // If already loaded, skip
    if (adminToCenter.value.size > 0) return

    isLoading.value = true
    error.value = null
    try {
      const centersResponse = await fetch('/data/centers.geojson')
      if (!centersResponse.ok) throw new Error('Failed to load centers')
      const centersData = await centersResponse.json()

      const adminToC = new Map<string, [number, number]>()

      if (centersData.features) {
        centersData.features.forEach((feature: any) => {
          const props = feature.properties as CenterProperties
          const geom = feature.geometry
          if (props && geom?.coordinates) {
            const coords = geom.coordinates as [number, number]
            // Store strictly by ADMIN
            if (props.ADMIN) {
              adminToC.set(props.ADMIN, coords)
            }
          }
        })
      }
      adminToCenter.value = adminToC

      // Load Country Geometries
      const countriesResponse = await fetch('/data/ne_countries.geojson')
      if (!countriesResponse.ok) throw new Error('Failed to load countries')
      const countriesData = await countriesResponse.json()

      const adminToF = new Map<string, Feature<Geometry, NeCountryProperties>>()

      if (countriesData.features) {
        countriesData.features.forEach((feature: any) => {
          const props = feature.properties as NeCountryProperties
          if (props && props.ADMIN) {
            adminToF.set(props.ADMIN, feature)
          }
        })
      }
      adminToFeature.value = adminToF
    } catch (e: any) {
      console.error('Failed to load country data:', e)
      error.value = e.message || 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  const getCoordinates = (
    countryAdmin: string
  ): { lat: number; lng: number } | null => {
    const coords = adminToCenter.value.get(countryAdmin)
    if (coords) return { lng: coords[0], lat: coords[1] }
    return null
  }

  const getFeature = (
    countryAdmin: string
  ): Feature<Geometry, NeCountryProperties> | undefined => {
    return adminToFeature.value.get(countryAdmin)
  }

  return {
    isLoading,
    error,
    loadCenters,
    getCoordinates,
    getFeature,
  }
}
