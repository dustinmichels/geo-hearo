import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { GameHistoryItem, GamePhase, RadioStation } from '../types/geo'

export const useGameStore = defineStore('game', () => {
  // State
  const secretCountry = ref<string>('')
  const guesses = ref<string[]>([])
  const currentStations = ref<RadioStation[]>([])
  const isDailyChallengeMode = ref(false)
  const dailyChallengeNumber = ref<number | undefined>(undefined)
  const currentSeed = ref<number | null>(null)
  const currentStationIndex = ref(3)
  const hasPlayedRadio = ref(false)
  const hasSkippedStation = ref(false)
  const gameStage = ref<GamePhase>('guessing')
  const gameHistory = ref<GameHistoryItem[]>([])
  const STORAGE_KEY_HISTORY = 'geo_hearo_history'

  // Getters
  const roundFinished = computed(() => {
    // Debug override
    const debugStage = import.meta.env.VITE_GAME_STAGE
    if (debugStage === 'seeResults' || debugStage === 'listening') return true

    return (
      guesses.value.length >= 5 ||
      guesses.value.some(
        (g) => g.toLowerCase() === secretCountry.value?.toLowerCase()
      )
    )
  })

  // Actions
  function setSecretCountry(country: string) {
    secretCountry.value = country
  }

  function addGuess(guess: string) {
    if (!guesses.value.includes(guess)) {
      guesses.value.push(guess)
    }
  }

  function setStations(stations: RadioStation[]) {
    currentStations.value = stations
  }

  function setStationIndex(index: number) {
    currentStationIndex.value = index
  }

  function setDailyChallengeMode(isDaily: boolean, dayNumber?: number) {
    isDailyChallengeMode.value = isDaily
    dailyChallengeNumber.value = dayNumber
  }

  function setSeed(seed: number | null) {
    currentSeed.value = seed
  }

  function setGameStage(stage: GamePhase) {
    gameStage.value = stage
  }

  function resetGame() {
    guesses.value = []
    secretCountry.value = ''
    currentStations.value = []
    currentStationIndex.value = 3
    currentSeed.value = null
    hasPlayedRadio.value = false
    hasSkippedStation.value = false
    gameStage.value = 'guessing'
    // We explicitly DO NOT reset isDailyChallengeMode here as that is a mode switch
  }

  function loadHistory() {
    const stored = localStorage.getItem(STORAGE_KEY_HISTORY)
    if (stored) {
      try {
        gameHistory.value = JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse history', e)
      }
    }
  }

  function addToHistory(item: GameHistoryItem) {
    loadHistory() // Ensure latest
    gameHistory.value.push(item)
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(gameHistory.value))
  }

  function clearHistory() {
    gameHistory.value = []
    localStorage.removeItem(STORAGE_KEY_HISTORY)
  }

  return {
    // State
    secretCountry,
    guesses,
    currentStations,
    isDailyChallengeMode,
    dailyChallengeNumber,
    currentSeed,
    currentStationIndex,
    hasPlayedRadio,
    hasSkippedStation,
    gameStage,
    gameHistory,

    // Getters
    roundFinished,

    // Actions
    setSecretCountry,
    setGameStage,
    addGuess,
    setStations,
    setStationIndex,
    setDailyChallengeMode,
    setSeed,
    resetGame,
    loadHistory,
    addToHistory,
    clearHistory,
  }
})
