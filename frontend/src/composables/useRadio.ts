import { ref } from 'vue'
import type { IndexStructure, RadioStation } from '../types/geo'

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

// State
const countriesIndex = ref<IndexStructure | null>(null)
const countryList = ref<string[]>([])
const secretCountry = ref<string>('') // This is the ADMIN name
const guesses = ref<string[]>([]) // Array of ADMIN names
const currentStations = ref<RadioStation[]>([])
const currentStationIndex = ref(3)
const currentSeed = ref<number | null>(null)
const STORAGE_KEY = 'geo_hearo_state'
const isLoading = ref(false)

// Daily Challenge State
const isDailyChallengeMode = ref(false)
const dailyChallengeNumber = ref(0)
const STORAGE_KEY_DAILY_DATE = 'dailyChallengeDate'

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
    return JSON.parse(text.trim()) as RadioStation
  }

  const loadStations = async () => {
    if (countriesIndex.value) return // Already loaded index

    isLoading.value = true
    try {
      // 1. Load Index
      const indexResponse = await fetch('/data/index.json')
      const indexData: IndexStructure = await indexResponse.json()
      countriesIndex.value = indexData
      // The keys in index.json are ADMIN names
      countryList.value = Object.keys(indexData.countries).sort()

      // 3. Restore state if available
      await restoreState()
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

    // 1. Pick a Random Country (key is ADMIN)
    const idx = countriesIndex.value
    const countries = idx.countries
    const names = countryList.value
    if (names.length === 0) {
      console.warn('No countries found in index')
      isLoading.value = false
      return
    }

    const countryName = names[rng.nextInt(names.length)]

    if (!countryName) {
      console.error('Failed to select country')
      isLoading.value = false
      return
    }

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
      const selectedIndex = pool.splice(poolIdx, 1)[0]
      if (selectedIndex !== undefined) {
        selectedIndices.push(selectedIndex)
      }
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

  const restoreState = async (): Promise<boolean> => {
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
          await selectRandomCountry(seed)
        }
        return true
      } catch (e) {
        console.error('Failed to parse stored state', e)
        return false
      }
    }
    return false
  }

  const addGuess = (guessAdmin: string) => {
    if (!guessAdmin) return
    // Avoid duplicates
    if (!guesses.value.includes(guessAdmin)) {
      guesses.value.push(guessAdmin)
      saveState()
    }
  }

  const checkGuess = (guessAdmin: string): boolean => {
    if (!guessAdmin) return false

    // Direct match check (ADMIN === ADMIN)
    if (guessAdmin === secretCountry.value) return true

    // Fallback: Check strictly by coordinates if names differ but represent same place?
    // In our new clean data regime, ADMIN should be unique and sufficient.
    // If ADMIN strings match, we are good.
    // We can also double check via coordinates just in case of slight string variations if data isn't perfectly normalized?
    // But data prep should handle that. Let's rely on strict string equality first.
    // And for logic "linked by ADMIN", string equality is the way.

    return false
  }

  const resetData = () => {
    // Resetting mostly for testing or hard restart
    clearState()
    countriesIndex.value = null
    countryList.value = []
  }

  // --- Daily Challenge Logic ---

  // Refactor note: we use local '2026-02-02' construction in getDailyChallengeNumber directly.

  /**
   * Calculates the Day # based on user's LOCAL time relative to Feb 2, 2026.
   * Day 1 is Feb 2, 2026.
   */
  const getDailyChallengeNumber = (): number => {
    const now = new Date()
    // Reset hours to compare dates only
    const current = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const start = new Date(2026, 1, 2) // Month is 0-indexed: 1 = Feb

    const diffTime = current.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // Day 1 is the start date itself, so +1
    return diffDays + 1
  }

  const getDailyChallengeSeed = (): number => {
    const now = new Date()
    // Create a unique integer from YYYYMMDD
    return (
      now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
    )
  }

  const initDailyChallenge = () => {
    const todayStr = new Date().toDateString()
    const lastCompleted = localStorage.getItem(STORAGE_KEY_DAILY_DATE)

    if (lastCompleted === todayStr) {
      isDailyChallengeMode.value = false
    } else {
      isDailyChallengeMode.value = true
      dailyChallengeNumber.value = getDailyChallengeNumber()
    }
  }

  const completeDailyChallenge = () => {
    localStorage.setItem(STORAGE_KEY_DAILY_DATE, new Date().toDateString())
    isDailyChallengeMode.value = false
  }

  return {
    currentStations,
    countryList, // Exposed if needed for autocomplete
    secretCountry,
    currentStationIndex,
    isLoading,
    loadStations,
    selectRandomCountry,
    guesses,
    addGuess,
    saveState,
    clearState,
    restoreState,
    checkGuess,
    resetData,
    // Daily Challenge
    isDailyChallengeMode,
    dailyChallengeNumber,
    initDailyChallenge,
    completeDailyChallenge,
    getDailyChallengeSeed,
  }
}
