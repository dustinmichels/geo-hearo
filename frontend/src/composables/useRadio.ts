import { ref } from 'vue'

export interface RadioStation {
  place_name: string
  place_id: string
  channel_id: string
  channel_url: string
  channel_name: string
  channel_stream: string
  channel_secure: boolean
  place_size: number
  boost: boolean
  country: string
  geo_lat: number
  geo_lon: number
  channel_resolved_url: string
  center: [number, number]
  ISO_A2?: string
}

const allStations = ref<RadioStation[]>([])
const countries = ref<string[]>([])
const secretCountry = ref<string>('')
const currentStations = ref<RadioStation[]>([])
const isLoading = ref(false)

// Centers data
const nameToIso = ref<Map<string, string>>(new Map())
const isoToCenter = ref<Map<string, [number, number]>>(new Map())

export function useRadio() {
  const loadStations = async () => {
    if (allStations.value.length > 0) return // Already loaded

    isLoading.value = true
    try {
      // Load radio stations
      const radioResponse = await fetch('/data/radio.json')
      const radioData = await radioResponse.json()
      allStations.value = radioData

      // Load centers data
      const centersResponse = await fetch('/data/centers.geojson')
      const centersData = await centersResponse.json()
      
      // Process centers
      const nToI = new Map<string, string>()
      const iToC = new Map<string, [number, number]>()
      
      if (centersData.features) {
        centersData.features.forEach((feature: any) => {
          if (feature.properties?.iso_a2 && feature.geometry?.coordinates) {
             const iso = feature.properties.iso_a2
             const name = feature.properties.name
             const coords = feature.geometry.coordinates as [number, number]
             
             iToC.set(iso, coords)
             if (name) {
               nToI.set(name, iso)
             }
          }
        })
      }
      nameToIso.value = nToI
      isoToCenter.value = iToC

      // Extract unique countries based on radio data
      const uniqueCountries = new Set<string>()
      radioData.forEach((station: RadioStation) => {
        if (station.country) uniqueCountries.add(station.country)
      })
      countries.value = Array.from(uniqueCountries)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      isLoading.value = false
    }
  }

  const selectRandomCountry = () => {
    if (countries.value.length === 0) return

    const randomIndex = Math.floor(Math.random() * countries.value.length)
    const country = countries.value[randomIndex]
    if (country) {
      secretCountry.value = country

      // Filter stations for this country
      const countryStations = allStations.value.filter(
        (s) => s.country === secretCountry.value,
      )

      // We want 5 stations. If less, take all. If more, shuffle or take first 5.
      currentStations.value = countryStations.slice(0, 5)
    }
  }
  
  const getCoordinates = (countryName: string): { lat: number, lng: number } | null => {
    // 1. Try to find by name in our centers map
    let iso = nameToIso.value.get(countryName)
    
    // 2. If not found, it might be the secret country from radio data, 
    // try to find ISO from radio stations
    if (!iso) {
      const station = allStations.value.find(s => s.country === countryName)
      if (station?.ISO_A2) {
        iso = station.ISO_A2
      }
    }
    
    if (iso) {
      const center = isoToCenter.value.get(iso)
      if (center) {
        return { lng: center[0], lat: center[1] }
      }
    }
    return null
  }

  return {
    allStations,
    countries,
    secretCountry,
    currentStations,
    isLoading,
    loadStations,
    selectRandomCountry,
    getCoordinates,
  }
}
