import { ref } from 'vue'

/**
 * LCG Randomizer
 * A simple seeded random number generator (Linear Congruential Generator)
 * Ensures that for a specific date (seed), we always get the same "random" results.
 */
class SeededRandom {
  private state: number
  constructor(seed: number) {
    this.state = seed
  }

  nextInt(max: number): number {
    // Use BigInt to avoid precision loss with large numbers
    const nextState = (1103515245n * BigInt(this.state) + 12345n) % 2147483648n
    this.state = Number(nextState)
    return Math.abs(this.state % max)
  }
}

export interface RadioStation {
  place_name: string
  place_id: string
  channel_id: string
  channel_url: string
  channel_name: string
  channel_stream?: string
  channel_secure?: boolean
  place_size: number
  boost?: boolean
  country: string
  geo_lat: number
  geo_lon: number
  channel_resolved_url: string
  ADMIN: string
  ISO_A3: string
  ISO_A2_EH: string
  CONTINENT: string
}

interface IndexStructure {
  config: {
    line_length: number
  }
  countries: Record<string, { start: number; count: number }>
}

// State
const countriesIndex = ref<IndexStructure | null>(null)
const countryList = ref<string[]>([])
const secretCountry = ref<string>('')
const guesses = ref<string[]>([])
const currentStations = ref<RadioStation[]>([])
const currentStationIndex = ref(3)
const currentSeed = ref<number | null>(null)
const STORAGE_KEY = 'geo_hearo_state'
const isLoading = ref(false)

// Centers data
const adminToCenter = ref<Map<string, [number, number]>>(new Map()) // Maps ADMIN -> coords

export function useRadio() {
  /**
   * Fetches a single record from the JSONL file using a byte range
   */
  const fetchStationAt = async (
    url: string,
    startByte: number,
    lineLength: number
  ): Promise<RadioStation> => {
    const endByte = startByte + lineLength - 1

    const response = await fetch(url, {
      headers: { Range: `bytes=${startByte}-${endByte}` },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch byte range ${startByte}-${endByte}`)
    }

    const text = await response.text()
    // .trim() removes the padding spaces added for fixed-width alignment
    return JSON.parse(text.trim())
  }

  const loadStations = async () => {
    if (countriesIndex.value) return // Already loaded index

    isLoading.value = true
    try {
      // 1. Load Index
      const indexResponse = await fetch('/data/index.json')
      const indexData: IndexStructure = await indexResponse.json()
      countriesIndex.value = indexData
      countryList.value = Object.keys(indexData.countries).sort()

      // 2. Load Centers Data
      const centersResponse = await fetch('/data/centers.geojson')
      const centersData = await centersResponse.json()

      // Process centers
      const adminToC = new Map<string, [number, number]>()

      if (centersData.features) {
        centersData.features.forEach((feature: any) => {
          const props = feature.properties
          const geom = feature.geometry
          if (props && geom?.coordinates) {
            const coords = geom.coordinates as [number, number]

            // Store by ADMIN (primary link for new data)
            if (props.ADMIN) {
              adminToC.set(props.ADMIN, coords)
            }
          }
        })
      }
      adminToCenter.value = adminToC

      // 3. Restore state if available
      restoreState()
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      isLoading.value = false
    }
  }

  const saveState = () => {
    if (currentSeed.value === null) return

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        seed: currentSeed.value,
        secretCountry: secretCountry.value,
        guesses: guesses.value,
        stationIndex: currentStationIndex.value,
      })
    )
  }

  const clearState = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    guesses.value = []
    secretCountry.value = ''
    currentStations.value = []
    currentStationIndex.value = 3
    currentSeed.value = null
  }

  const selectRandomCountry = async (seedInput?: number | string) => {
    if (!countriesIndex.value) return

    // Determine seed
    let seed: number
    if (typeof seedInput === 'number') {
      seed = seedInput
    } else if (typeof seedInput === 'string') {
      seed = parseInt(seedInput, 10)
    } else {
      // Random seed if none provided
      seed = Math.floor(Math.random() * 10000000)
    }

    // Initialize RNG
    const rng = new SeededRandom(seed)
    currentSeed.value = seed

    // 1. Pick a Random Country
    const idx = countriesIndex.value
    const countries = idx.countries
    const names = countryList.value
    const countryName = names[rng.nextInt(names.length)]

    // Clear previous game state (except seed which we just set)
    guesses.value = []
    secretCountry.value = countryName
    currentStationIndex.value = 3

    // 2. Determine which unique indices to fetch (up to 5)
    // Validate country data availability to satisfy TypeScript
    const countryData = countries[countryName]
    if (!countryData) {
      console.error(`Missing data for country: ${countryName}`)
      isLoading.value = false
      return
    }

    const { start, count } = countryData
    const targetCount = Math.min(5, count)
    const selectedIndices: number[] = []
    const pool = Array.from({ length: count }, (_, i) => i)

    for (let i = 0; i < targetCount; i++) {
      const poolIdx = rng.nextInt(pool.length)
      selectedIndices.push(pool.splice(poolIdx, 1)[0])
    }

    // 3. Fetch specific stations
    isLoading.value = true
    try {
      const lineLength = idx.config.line_length
      const DATA_URL = '/data/stations.jsonl'

      const stations = await Promise.all(
        selectedIndices.map((offsetIdx) => {
          const stationOffset = start + offsetIdx * lineLength
          return fetchStationAt(DATA_URL, stationOffset, lineLength)
        })
      )

      currentStations.value = stations
      saveState()
    } catch (err) {
      console.error('Error fetching stations:', err)
    } finally {
      isLoading.value = false
    }
  }

  const restoreState = () => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const {
          seed,
          secretCountry: s,
          guesses: g,
          stationIndex: si,
        } = JSON.parse(stored)

        if (g) guesses.value = g
        if (typeof si === 'number') currentStationIndex.value = si
        if (s) secretCountry.value = s

        // If we have a seed, re-run selection to fetch data (idempotent)
        if (typeof seed === 'number') {
          selectRandomCountry(seed)
        }
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

  const getCoordinates = (
    countryName: string
  ): { lat: number; lng: number } | null => {
    // 1. Try ADMIN map first (best for new data)
    let coords = adminToCenter.value.get(countryName)
    if (coords) return { lng: coords[0], lat: coords[1] }

    // 2. Fallback: Check currently loaded stations (last resort for obscure name match)
    // NOTE: This only works if the station is currently loaded!
    const station = currentStations.value.find(
      (s) => s.country === countryName || s.ADMIN === countryName
    )
    if (station) {
      // We might not have geometric center in station, but we have lat/lon of station
      // The station interface has geo_lat/geo_lon.
      // But maybe we want the country center.
      // If we can't find the country center, returning station loc is better than nothing?
      // Let's stick to returning null if we can't find the country center to avoid confusion.
      // Actually, let's try to match via ADMIN if station has it
      if (station.ADMIN) {
        coords = adminToCenter.value.get(station.ADMIN)
        if (coords) return { lng: coords[0], lat: coords[1] }
      }
    }

    return null
  }

  const checkGuess = (guessInput: string): boolean => {
    if (!guessInput) return false
    // Direct match check
    if (guessInput.toLowerCase() === secretCountry.value.toLowerCase())
      return true

    // ADMIN match check
    // Simplest strategy:
    // 1. Resolve guess to coordinates
    const guessCoords = getCoordinates(guessInput)
    // 2. Resolve secret to coordinates
    const secretCoords = getCoordinates(secretCountry.value)

    if (guessCoords && secretCoords) {
      // Compare coords (approximate match to handle precision diffs?)
      // Or just strict equality if they come from the same map entry
      return (
        guessCoords.lat === secretCoords.lat &&
        guessCoords.lng === secretCoords.lng
      )
    }

    return false
  }

  const resetData = () => {
    // Resetting mostly for testing or hard restart
    clearState()
    countriesIndex.value = null
    countryList.value = []
    adminToCenter.value = new Map()
  }

  return {
    currentStations,
    countryList, // Exposed if needed for autocomplete
    secretCountry,
    currentStationIndex,
    isLoading,
    loadStations,
    selectRandomCountry,
    getCoordinates,
    guesses,
    addGuess,
    saveState,
    clearState,
    restoreState,
    checkGuess,
    resetData,
  }
}
