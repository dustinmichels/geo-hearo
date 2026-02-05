import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { RadioStation } from '../types/geo'

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

  // Getters
  const roundFinished = computed(() => {
    // Debug override
    if (import.meta.env.VITE_ROUND_FINISHED === 'true') return true

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

  function resetGame() {
    guesses.value = []
    secretCountry.value = ''
    currentStations.value = []
    currentStationIndex.value = 3
    currentSeed.value = null
    hasPlayedRadio.value = false
    hasSkippedStation.value = false
    // We explicitly DO NOT reset isDailyChallengeMode here as that is a mode switch
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

    // Getters
    roundFinished,

    // Actions
    setSecretCountry,
    addGuess,
    setStations,
    setStationIndex,
    setDailyChallengeMode,
    setSeed,
    resetGame,
  }
})
