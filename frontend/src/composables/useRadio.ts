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
const guesses = ref<string[]>([])
const currentStations = ref<RadioStation[]>([])
const currentStationIndex = ref(3)
const STORAGE_KEY = 'geo_hearo_state'
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
               nToI.set(name.toLowerCase(), iso)
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

      // If we have a restored secretCountry but no stations yet, sync them now
      if (secretCountry.value && currentStations.value.length === 0) {
        const countryStations = allStations.value.filter(
          (s) => s.country === secretCountry.value,
        )
        currentStations.value = countryStations.slice(0, 5)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      isLoading.value = false
    }
  }

  const saveState = () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        secretCountry: secretCountry.value,
        guesses: guesses.value,
        stationIndex: currentStationIndex.value,
      }),
    )
  }

  const clearState = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    guesses.value = []
    secretCountry.value = ''
    currentStations.value = []
    currentStationIndex.value = 3
  }

  const restoreState = () => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const { secretCountry: s, guesses: g, stationIndex: si } = JSON.parse(stored)
        if (s) secretCountry.value = s
        if (g) guesses.value = g
        if (typeof si === 'number') currentStationIndex.value = si
        return true
      } catch (e) {
        console.error('Failed to parse stored state', e)
        return false
      }
    }
    return false
  }

  const addGuess = (guess: string) => {
    guesses.value.push(guess)
    saveState()
  }

  const selectRandomCountry = () => {
    if (countries.value.length === 0) return

    const randomIndex = Math.floor(Math.random() * countries.value.length)
    const country = countries.value[randomIndex]
    if (country) {
      // Clear previous game state
      guesses.value = []
      secretCountry.value = country
      currentStationIndex.value = 3

      // Filter stations for this country
      const countryStations = allStations.value.filter(
        (s) => s.country === secretCountry.value,
      )

      // We want 5 stations. If less, take all. If more, shuffle or take first 5.
      currentStations.value = countryStations.slice(0, 5)
      saveState()
    }
  }
  
  const getCoordinates = (countryName: string): { lat: number, lng: number } | null => {
    const iso = getCountryIso(countryName)
    
    if (iso) {
      const center = isoToCenter.value.get(iso)
      if (center) {
        return { lng: center[0], lat: center[1] }
      }
    }
    return null
  }

  const getCountryIso = (countryName: string): string | null => {
    // 1. Try to find by name in our centers map
    let iso = nameToIso.value.get(countryName.toLowerCase())
    
    // 2. If not found, check radio stations
    if (!iso) {
      const station = allStations.value.find(
        (s) => s.country.toLowerCase() === countryName.toLowerCase(),
      )
      if (station?.ISO_A2) {
        iso = station.ISO_A2
      }
    }
    return iso || null
  }

  const checkGuess = (guessInput: string): boolean => {
    if (!guessInput) return false
    // Direct match check first
    if (guessInput.toLowerCase() === secretCountry.value.toLowerCase()) return true
    
    const guessIso = getCountryIso(guessInput)
    const secretIso = getCountryIso(secretCountry.value)
    
    if (guessIso && secretIso) {
      return guessIso === secretIso
    }
    
    return false
  }

  const resetData = () => {
    allStations.value = []
    countries.value = []
    secretCountry.value = ''
    guesses.value = []
    currentStations.value = []
    currentStationIndex.value = 3
    nameToIso.value = new Map()
    isoToCenter.value = new Map()
  }

  return {
    allStations,
    countries,
    secretCountry,
    currentStations,
    currentStationIndex,
    isLoading,
    loadStations,
    selectRandomCountry,
    getCoordinates,
    getCountryIso,
    guesses,
    addGuess,
    saveState,
    clearState,
    restoreState,
    checkGuess,
    resetData,
  }
}
