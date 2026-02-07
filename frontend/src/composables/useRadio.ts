import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useGameStore } from '../stores/game'
import type { IndexStructure, RadioStation } from '../types/geo'

export interface GameHistoryItem {
  country: string
  score: string
  date: string
  mode: 'daily' | 'free'
}

/**
 * LCG Randomizer
 * A simple seeded random number generator (Linear Congruential Generator)
 * Ensures that for a specific date (seed), we always get the same "random" results.
 */
export class SeededRandom {
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

// Data Cache (kept local as it is resource data, not game state)
const countriesIndex = ref<IndexStructure | null>(null)
const countryList = ref<string[]>([])
const isLoading = ref(false)

const STORAGE_KEY = 'geo_hearo_state'
const STORAGE_KEY_DAILY_DATE = 'dailyChallengeDate'

export function useRadio() {
  const store = useGameStore()
  const {
    secretCountry,
    guesses,
    currentStations,
    currentStationIndex,
    currentSeed,
    isDailyChallengeMode,
    dailyChallengeNumber,
  } = storeToRefs(store)

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

      // State restoration is handled by the caller (useGamePlay)
      // after daily challenge mode is determined
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
        gameStage: store.gameStage,
      })
    )
  }

  const clearState = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    store.resetGame()
  }

  /**
   * Core logic: use a seed to deterministically pick a country and fetch its stations.
   * Does NOT save to sessionStorage — callers decide when to persist.
   */
  const loadCountryBySeed = async (seed: number) => {
    if (!countriesIndex.value) return

    const rng = new SeededRandom(seed)
    store.setSeed(seed)

    const idx = countriesIndex.value
    const countries = idx.countries
    const names = countryList.value
    if (names.length === 0) {
      console.warn('No countries found in index')
      isLoading.value = false
      return
    }

    const envCountry = import.meta.env.VITE_SECRET_COUNTRY
    const countryName =
      envCountry && names.includes(envCountry)
        ? envCountry
        : names[rng.nextInt(names.length)]

    if (!countryName) {
      console.error('Failed to select country')
      isLoading.value = false
      return
    }

    store.guesses = []
    store.setSecretCountry(countryName)
    store.setStationIndex(3)

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

      store.setStations(stations)
      updatePreconnectLinks(stations)
    } catch (err) {
      console.error('Error fetching stations:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Start a new round: pick a country (optionally from a seed) and persist to sessionStorage.
   */
  const selectRandomCountry = async (seedInput?: number | string) => {
    let seed: number
    if (typeof seedInput === 'number') {
      seed = seedInput
    } else if (typeof seedInput === 'string') {
      seed = parseInt(seedInput, 10)
    } else {
      seed = Math.floor(Math.random() * 10000000)
    }

    await loadCountryBySeed(seed)
    saveState()
  }

  const updatePreconnectLinks = (stations: RadioStation[]) => {
    // 1. Clear old preconnects specific to our app
    document
      .querySelectorAll('link[data-gh-preconnect]')
      .forEach((el) => el.remove())

    // 2. Add new ones
    stations.forEach((station) => {
      try {
        const url = new URL(station.channel_resolved_url)
        // Only preconnect to the origin (protocol + domain)
        const origin = url.origin

        // Avoid duplicates if multiple stations share an origin
        if (document.head.querySelector(`link[href="${origin}"]`)) return

        const link = document.createElement('link')
        link.rel = 'preconnect'
        link.href = origin
        link.crossOrigin = 'anonymous' // Audio is often CORS-enabled
        link.dataset.ghPreconnect = 'true'
        document.head.appendChild(link)
      } catch (e) {
        // Ignore invalid URLs
      }
    })
  }

  const restoreState = async (): Promise<boolean> => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const { seed, guesses: g, stationIndex: si, gameStage: gs } = JSON.parse(stored)

        // Re-fetch country + stations from the seed without saving state
        if (typeof seed === 'number') {
          await loadCountryBySeed(seed)
        }

        // Restore game progress AFTER loadCountryBySeed, which resets guesses/stationIndex
        if (g) store.guesses = g
        if (typeof si === 'number') store.setStationIndex(si)
        if (gs) store.setGameStage(gs)

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
      store.addGuess(guessAdmin)
      saveState()
    }
  }

  const checkGuess = (guessAdmin: string): boolean => {
    if (!guessAdmin) return false

    // Direct match check (ADMIN === ADMIN)
    if (guessAdmin === secretCountry.value) return true

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
      store.setDailyChallengeMode(false)
    } else {
      store.setDailyChallengeMode(true, getDailyChallengeNumber())
      // Clear history on new daily challenge start
      store.clearHistory()
    }
  }

  const completeDailyChallenge = () => {
    localStorage.setItem(STORAGE_KEY_DAILY_DATE, new Date().toDateString())
    store.setDailyChallengeMode(false)
  }

  return {
    currentStations,
    countryList, // Exposed if needed for autocomplete
    secretCountry,
    currentStationIndex,
    currentSeed,
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
