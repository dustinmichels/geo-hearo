import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useGameStore } from '../stores/game'
import type { GamePhase } from '../types/geo'
import { getColorForDistanceLevel } from '../utils/colors'
import { getDistanceHint } from '../utils/geography'
import { useCountryData } from './useCountryData'
import { useRadio } from './useRadio'

interface GamePlayOptions {
  onGuessAdded?: () => void
  onNewGame?: () => void
  onModalClose?: () => void
  setupKeyboardShortcuts?: boolean
}

export function useGamePlay(options: GamePlayOptions) {
  const isPlaying = ref(false)
  const guessInput = ref('')
  const guessColors = ref<Record<string, string>>({})

  const modalConfig = ref({
    isWin: false,
    shareText: undefined as string | undefined, // text to copy to clipboard
    resultsGrid: undefined as string | undefined,
    secretCountry: undefined as string | undefined,
    dailyChallengeNumber: undefined as number | undefined,
  })

  // State
  const store = useGameStore()
  const { roundFinished, gameHistory, gameStage } = storeToRefs(store)
  const { addToHistory, loadHistory } = store

  const showModal = computed(() => gameStage.value === 'seeResults')

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
    if (!guess || guesses.value.length >= 5) return

    if (checkGuess(guess)) {
      addGuess(guess) // Ensure winning guess is added to state

      const resultsGrid = generateEmojiString()
      let shareText: string | undefined
      let dayNumber: number | undefined

      if (isDailyChallengeMode.value) {
        dayNumber = dailyChallengeNumber.value || 0
        completeDailyChallenge() // Mark as done for today
        shareText = generateShareText(dayNumber)
      }

      modalConfig.value = {
        isWin: true,
        shareText,
        resultsGrid,
        secretCountry: secretCountry.value,
        dailyChallengeNumber: dayNumber,
      }

      addToHistory({
        country: secretCountry.value || 'Unknown',
        score: resultsGrid,
        numericScore: 6 - guesses.value.length,
        date: new Date().toISOString(),
        mode: isDailyChallengeMode.value ? 'daily' : 'free',
      })

      // clearState() <-- REMOVED
      store.setGameStage('seeResults')
      saveState()
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
      const resultsGrid = generateEmojiString()
      let shareText: string | undefined
      let dayNumber: number | undefined

      if (isDailyChallengeMode.value) {
        dayNumber = dailyChallengeNumber.value || 0
        completeDailyChallenge()
        shareText = generateShareText(dayNumber)
      }

      modalConfig.value = {
        isWin: false,
        shareText,
        resultsGrid,
        secretCountry: secretCountry.value,
        dailyChallengeNumber: dayNumber,
      }

      addToHistory({
        country: secretCountry.value || 'Unknown',
        score: resultsGrid,
        numericScore: 0, // 0 for a loss
        date: new Date().toISOString(),
        mode: isDailyChallengeMode.value ? 'daily' : 'free',
      })

      // clearState() <-- REMOVED
      store.setGameStage('seeResults')
      saveState()
    }
  }

  const handleModalClose = () => {
    store.setGameStage('listening')
    saveState()
    options.onModalClose?.()
  }

  const handleModalConfirm = () => {
    clearState()
    guessInput.value = ''
    guessColors.value = {}
    isPlaying.value = false
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

    loadHistory()

    // Load both stations (for audio) and country data (for map/distance)
    Promise.all([loadStations(), loadCountryData()]).then(async () => {
      // Initialize Daily Challenge Logic
      initDailyChallenge()

      const debugStage = import.meta.env.VITE_GAME_STAGE as GamePhase | undefined
      if (debugStage === 'seeResults' || debugStage === 'listening') {
        // Debug mode: Skip to specified stage

        // Try to restore existing session state first so refreshing doesn't change the country
        const restored = await restoreState()
        if (!restored) {
          await selectRandomCountry()
        }

        modalConfig.value = {
          isWin: false,
          shareText: undefined,
          resultsGrid: undefined,
          secretCountry: secretCountry.value,
          dailyChallengeNumber: undefined,
        }
        store.setGameStage(debugStage)
      } else if (isDailyChallengeMode.value) {
        const dailySeed = getDailyChallengeSeed()
        // Try restoring session state, but only keep it if it matches today's seed
        const restored = await restoreState()
        if (restored && currentSeed.value === dailySeed) {
          populateGuessColors()
          // Re-populate modal config if we're restoring into seeResults
          if (gameStage.value === 'seeResults') {
            modalConfig.value = {
              isWin: roundFinished.value && guesses.value.some(
                (g) => g.toLowerCase() === secretCountry.value?.toLowerCase()
              ),
              shareText: undefined,
              resultsGrid: undefined,
              secretCountry: secretCountry.value,
              dailyChallengeNumber: dailyChallengeNumber.value,
            }
          }
        } else {
          clearState()
          selectRandomCountry(dailySeed)
        }
      } else {
        // Free play or already completed daily challenge
        const restored = await restoreState()
        if (restored && secretCountry.value) {
          populateGuessColors()
          // Re-populate modal config if we're restoring into seeResults
          if (gameStage.value === 'seeResults') {
            modalConfig.value = {
              isWin: roundFinished.value && guesses.value.some(
                (g) => g.toLowerCase() === secretCountry.value?.toLowerCase()
              ),
              shareText: undefined,
              resultsGrid: undefined,
              secretCountry: secretCountry.value,
              dailyChallengeNumber: undefined,
            }
          }
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
    gameHistory,
    guesses,
    currentStation,
    currentStations,
    currentStationUrl,
    secretCountry,
    debugCountry,
    gameStage,
    handlePlayPause,
    handlePrevious,
    handleNext,
    handleAddGuess,
    handleModalClose,
    handleModalConfirm,
    handleCountrySelect,
    handleNewGame: () => {
      clearState()
      guessInput.value = ''
      guessColors.value = {}
      isPlaying.value = false
      options.onNewGame?.()
      selectRandomCountry().then(() => {
        // Debug override: Skip to specified stage on new game
        const debugStage = import.meta.env.VITE_GAME_STAGE as GamePhase | undefined
        if (debugStage === 'seeResults' || debugStage === 'listening') {
          modalConfig.value = {
            isWin: false,
            shareText: undefined,
            resultsGrid: undefined,
            secretCountry: secretCountry.value,
            dailyChallengeNumber: undefined,
          }
          store.setGameStage(debugStage)
        }
      })
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
