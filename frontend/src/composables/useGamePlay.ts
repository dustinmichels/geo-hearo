import gsap from 'gsap'
import type { Ref } from 'vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getColorForDistanceLevel } from '../utils/colors'
import { getDistanceHint } from '../utils/geography'
import { useCountryData } from './useCountryData'
import { useRadio } from './useRadio'

interface GamePlayOptions {
  blob1: Ref<HTMLElement | null>
  blob2: Ref<HTMLElement | null>
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
    title: '',
    message: '',
    buttonText: '',
    isWin: false,
    shareText: undefined as string | undefined, // text to copy to clipboard
    resultsGrid: undefined as string | undefined,
    secretCountry: undefined as string | undefined,
    dailyChallengeNumber: undefined as number | undefined,
  })

  const roundFinished = computed(() => {
    return (
      guesses.value.length >= 5 ||
      guesses.value.some(
        (g) => g.toLowerCase() === secretCountry.value?.toLowerCase()
      )
    )
  })

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
    saveState,
    checkGuess,
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

  const generateEmojiString = (winningGuess?: string) => {
    // Clone guesses to avoid modifying the reactive array during this operation if needed
    const currentGuesses = [...guesses.value]
    if (winningGuess) {
      currentGuesses.push(winningGuess)
    }

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

  const generateShareText = (winningGuess?: string) => {
    const dayNumber = dailyChallengeNumber.value
    const lines = [`GeoHearo | #${dayNumber}`, 'https://geohearo.com/']

    const emojiLine = generateEmojiString(winningGuess)
    lines.push(emojiLine)
    return lines.join('\n')
  }

  const handleAddGuess = () => {
    const guess = guessInput.value.trim()
    if (!guess || guesses.value.length >= 5 || roundFinished.value) return

    if (checkGuess(guess)) {
      addGuess(guess) // Ensure winning guess is added to state
      if (isDailyChallengeMode.value) {
        completeDailyChallenge() // Mark as done for today

        const shareText = generateShareText()
        const resultsGrid = generateEmojiString()

        modalConfig.value = {
          title: 'Daily Challenge Complete!',
          message: `It was ${secretCountry.value}! Come back tomorrow for a new challenge.`,
          buttonText: 'Play Free Mode',
          isWin: true,
          shareText,
          resultsGrid,
          secretCountry: secretCountry.value,
          dailyChallengeNumber: dailyChallengeNumber.value,
        }
      } else {
        const resultsGrid = generateEmojiString()
        modalConfig.value = {
          title: 'You got it!',
          message: `Wooo! The country was ${secretCountry.value}. Great job!`,
          buttonText: 'Play Again',
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
        completeDailyChallenge()

        const shareText = generateShareText()
        const resultsGrid = generateEmojiString()

        modalConfig.value = {
          title: 'Game Over',
          message: `Better luck next time. The country was ${secretCountry.value}.`,
          buttonText: 'Keep Playing',
          isWin: false,
          shareText,
          resultsGrid,
          secretCountry: secretCountry.value,
          dailyChallengeNumber: dailyChallengeNumber.value,
        }
      } else {
        const resultsGrid = generateEmojiString()
        modalConfig.value = {
          title: 'Game Over',
          message: `The secret country was ${secretCountry.value}.`,
          buttonText: 'Try Again',
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
    Promise.all([loadStations(), loadCountryData()]).then(() => {
      // Initialize Daily Challenge Logic
      initDailyChallenge()

      if (secretCountry.value) {
        // State was restored from session storage — just repopulate colors
        populateGuessColors()
      } else if (isDailyChallengeMode.value) {
        // Fresh daily challenge
        selectRandomCountry(getDailyChallengeSeed())
      } else {
        // Normal free play random start
        selectRandomCountry()
      }
    })

    gsap.to(options.blob1.value, {
      x: 50,
      y: 30,
      scale: 1.1,
      duration: 8,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    })

    gsap.to(options.blob2.value, {
      x: -30,
      y: -40,
      scale: 1.2,
      duration: 10,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
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
      const text = generateShareText()
      try {
        await navigator.clipboard.writeText(text)
        // Could add toast notification here
      } catch (err) {
        console.error('Failed to copy results', err)
      }
    },
  }
}
