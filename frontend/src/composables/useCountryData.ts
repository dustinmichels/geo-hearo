import { ref } from 'vue'
import type { NeCountryProperties } from '../types/geo'
import type { Feature, Geometry } from 'geojson'

// State
// Maps ADMIN name -> GeoJSON Feature
const adminToFeature = ref<Map<string, Feature<Geometry, NeCountryProperties>>>(
  new Map()
)
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useCountryData() {
  const loadCountryData = async () => {
    // If already loaded, skip
    if (adminToFeature.value.size > 0) return

    isLoading.value = true
    error.value = null
    try {
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

  const getFeature = (
    countryAdmin: string
  ): Feature<Geometry, NeCountryProperties> | undefined => {
    return adminToFeature.value.get(countryAdmin)
  }

  return {
    isLoading,
    error,
    loadCountryData,
    getFeature,
  }
}
