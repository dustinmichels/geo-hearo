import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '../stores/game'
import { getColorForDistanceLevel } from '../utils/colors'
import { getDistanceHint } from '../utils/geography'
import { useCountryData } from './useCountryData'
import { useRadio } from './useRadio'

interface GamePlayOptions {
  onGuessAdded?: () => void
  onNewGame?: () => void
  setupKeyboardShortcuts?: boolean
}

export function useGamePlay(options: GamePlayOptions) {
  const isPlaying = ref(false)
  const guessInput = ref('')
  const guessColors = ref<Record<string, string>>({})

  const showModal = ref(false)
  const modalConfig = ref({
    isWin: false,
    shareText: undefined as string | undefined, // text to copy to clipboard
    resultsGrid: undefined as string | undefined,
    secretCountry: undefined as string | undefined,
    dailyChallengeNumber: undefined as number | undefined,
  })

  // State
  const store = useGameStore()
  const { roundFinished } = storeToRefs(store)

  // Hooking up radio logic
  const {
    loadStations,
    selectRandomCountry,
    currentStations,
    secretCountry,
    guesses,
    addGuess,
    clearState,
    currentStationIndex: currentStation,
    currentSeed,
    saveState,
    checkGuess,
    restoreState,
    // Daily Challenge
    initDailyChallenge,
    isDailyChallengeMode,
    completeDailyChallenge,
    getDailyChallengeSeed,
    dailyChallengeNumber,
  } = useRadio()

  // Watch for round completion to fill in the secret country
  watch(roundFinished, (finished) => {
    if (finished && secretCountry.value) {
      guessInput.value = secretCountry.value
    }
  })

  // Hooking up country data
  const { loadCountryData, getFeature } = useCountryData()

  const currentStationUrl = computed(() => {
    return currentStations.value[currentStation.value - 1]?.channel_resolved_url
  })

  const debugCountry = computed(() => {
    return import.meta.env.VITE_DEBUG_MODE === 'true'
      ? secretCountry.value
      : undefined
  })

  const handlePlayPause = () => {
    isPlaying.value = !isPlaying.value
  }

  const handlePrevious = () => {
    currentStation.value =
      currentStation.value > 1 ? currentStation.value - 1 : 5
    saveState()
  }

  const handleNext = () => {
    currentStation.value =
      currentStation.value < 5 ? currentStation.value + 1 : 1
    saveState()
  }

  const populateGuessColors = () => {
    guesses.value.forEach((guess) => {
      if (guessColors.value[guess]) return

      // Explicit check for exact match (Win) -> Green
      if (guess.toLowerCase() === secretCountry.value?.toLowerCase()) {
        guessColors.value[guess] = '#4ade80' // Green-400
        return
      }

      const secretFeature = getFeature(secretCountry.value)
      const guessFeature = getFeature(guess)

      if (secretFeature && guessFeature) {
        const { level } = getDistanceHint(guessFeature, secretFeature)
        const color = getColorForDistanceLevel(level)
        guessColors.value[guess] = color
      } else {
        guessColors.value[guess] = '#FB923C'
      }
    })
  }

  const generateEmojiString = () => {
    // Clone guesses to avoid modifying the reactive array during this operation if needed
    const currentGuesses = [...guesses.value]

    let emojiLine = ''
    currentGuesses.forEach((guess) => {
      // Check for win
      if (guess.toLowerCase() === secretCountry.value?.toLowerCase()) {
        emojiLine += '🟢'
        return
      }

      const secretFeature = getFeature(secretCountry.value)
      const guessFeature = getFeature(guess)

      if (secretFeature && guessFeature) {
        const { emoji } = getDistanceHint(guessFeature, secretFeature)
        emojiLine += emoji
      } else {
        emojiLine += '⬜' // Fallback
      }
    })
    return emojiLine
  }

  const generateShareText = (dayNumber: number) => {
    const lines = [`GeoHearo | #${dayNumber}`, 'https://geohearo.com/']

    const emojiLine = generateEmojiString()
    lines.push(emojiLine)
    return lines.join('\n')
  }

  const handleAddGuess = () => {
    const guess = guessInput.value.trim()
    if (!guess || guesses.value.length >= 5 || roundFinished.value) return

    if (checkGuess(guess)) {
      addGuess(guess) // Ensure winning guess is added to state
      if (isDailyChallengeMode.value) {
        const dayNumber = dailyChallengeNumber.value || 0
        completeDailyChallenge() // Mark as done for today

        const shareText = generateShareText(dayNumber)
        const resultsGrid = generateEmojiString()

        modalConfig.value = {
          isWin: true,
          shareText,
          resultsGrid,
          secretCountry: secretCountry.value,
          dailyChallengeNumber: dayNumber,
        }
      } else {
        const resultsGrid = generateEmojiString()
        modalConfig.value = {
          isWin: true,
          shareText: undefined,
          resultsGrid,
          secretCountry: secretCountry.value,
          dailyChallengeNumber: undefined,
        }
      }
      // clearState() <-- REMOVED
      showModal.value = true
      return
    }

    const secretFeature = getFeature(secretCountry.value)
    const guessFeature = getFeature(guess)

    // Check for exact match first (Win condition color)
    if (guess.toLowerCase() === secretCountry.value?.toLowerCase()) {
      guessColors.value[guess] = '#4ade80'
    } else if (secretFeature && guessFeature) {
      const { level } = getDistanceHint(guessFeature, secretFeature)
      const color = getColorForDistanceLevel(level)
      guessColors.value[guess] = color
    } else {
      guessColors.value[guess] = '#FB923C'
    }

    addGuess(guess)
    guessInput.value = ''

    options.onGuessAdded?.()

    if (guesses.value.length >= 5) {
      if (isDailyChallengeMode.value) {
        const dayNumber = dailyChallengeNumber.value || 0
        completeDailyChallenge()

        const shareText = generateShareText(dayNumber)
        const resultsGrid = generateEmojiString()

        modalConfig.value = {
          isWin: false,
          shareText,
          resultsGrid,
          secretCountry: secretCountry.value,
          dailyChallengeNumber: dayNumber,
        }
      } else {
        const resultsGrid = generateEmojiString()
        modalConfig.value = {
          isWin: false,
          shareText: undefined,
          resultsGrid,
          secretCountry: secretCountry.value,
          dailyChallengeNumber: undefined,
        }
      }
      // clearState() <-- REMOVED
      showModal.value = true
    }
  }

  const handleModalConfirm = () => {
    clearState()
    guessInput.value = ''
    guessColors.value = {}
    isPlaying.value = false
    showModal.value = false
    options.onNewGame?.()
    selectRandomCountry()
  }

  const handleCountrySelect = (name: string) => {
    guessInput.value = name
  }

  const handleKeydown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return

    switch (e.code) {
      case 'Space':
        e.preventDefault()
        handlePlayPause()
        break
      case 'ArrowLeft':
        e.preventDefault()
        handlePrevious()
        break
      case 'ArrowRight':
        e.preventDefault()
        handleNext()
        break
      case 'Enter':
        e.preventDefault()
        handleAddGuess()
        break
    }
  }

  onMounted(() => {
    if (options.setupKeyboardShortcuts) {
      window.addEventListener('keydown', handleKeydown)
    }

    // Load both stations (for audio) and country data (for map/distance)
    Promise.all([loadStations(), loadCountryData()]).then(async () => {
      // Initialize Daily Challenge Logic
      initDailyChallenge()

      if (isDailyChallengeMode.value) {
        const dailySeed = getDailyChallengeSeed()
        // Try restoring session state, but only keep it if it matches today's seed
        const restored = await restoreState()
        if (restored && currentSeed.value === dailySeed) {
          populateGuessColors()
        } else {
          clearState()
          selectRandomCountry(dailySeed)
        }
      } else {
        // Free play or already completed daily challenge
        const restored = await restoreState()
        if (restored && secretCountry.value) {
          populateGuessColors()
        } else {
          selectRandomCountry()
        }
      }
    })
  })

  onUnmounted(() => {
    if (options.setupKeyboardShortcuts) {
      window.removeEventListener('keydown', handleKeydown)
    }
  })

  return {
    isPlaying,
    guessInput,
    guessColors,
    showModal,
    modalConfig,
    guesses,
    currentStation,
    currentStations,
    currentStationUrl,
    secretCountry,
    debugCountry,
    roundFinished,
    handlePlayPause,
    handlePrevious,
    handleNext,
    handleAddGuess,
    handleModalConfirm,
    handleCountrySelect,
    handleNewGame: () => {
      clearState()
      guessInput.value = ''
      guessColors.value = {}
      isPlaying.value = false
      showModal.value = false
      options.onNewGame?.()
      selectRandomCountry()
    },
    handleShare: async () => {
      const text = generateShareText(dailyChallengeNumber.value || 0)
      try {
        await navigator.clipboard.writeText(text)
        // Could add toast notification here
      } catch (err) {
        console.error('Failed to copy results', err)
      }
    },
  }
}
