import gsap from 'gsap'
import type { Ref } from 'vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getColorForArrowCount } from '../utils/colors'
import { getDirectionalArrows } from '../utils/geography'
import { useCountryData } from './useCountryData'
import { useRadio } from './useRadio'

interface GamePlayOptions {
  blob1: Ref<HTMLElement | null>
  blob2: Ref<HTMLElement | null>
  onGuessAdded?: () => void
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
  } = useRadio()

  // Hooking up country coordinates
  const { loadCenters, getCoordinates } = useCountryData()

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
      const secretCoords = getCoordinates(secretCountry.value)
      const guessCoords = getCoordinates(guess)

      if (secretCoords && guessCoords) {
        const { count } = getDirectionalArrows(guessCoords, secretCoords)
        const color = getColorForArrowCount(count)
        guessColors.value[guess] = color
      } else {
        guessColors.value[guess] = '#FB923C'
      }
    })
  }

  const handleAddGuess = () => {
    const guess = guessInput.value.trim()
    if (!guess || guesses.value.length >= 5) return

    if (checkGuess(guess)) {
      modalConfig.value = {
        title: 'You got it!',
        message: `Wooo! The country was ${secretCountry.value}. Great job!`,
        buttonText: 'Play Again',
        isWin: true,
      }
      clearState()
      showModal.value = true
      return
    }

    const secretCoords = getCoordinates(secretCountry.value)
    const guessCoords = getCoordinates(guess)

    if (secretCoords && guessCoords) {
      const { count } = getDirectionalArrows(guessCoords, secretCoords)
      const color = getColorForArrowCount(count)
      guessColors.value[guess] = color
    } else {
      guessColors.value[guess] = '#FB923C'
    }

    addGuess(guess)
    guessInput.value = ''

    options.onGuessAdded?.()

    if (guesses.value.length >= 5) {
      modalConfig.value = {
        title: 'Game Over',
        message: `Better luck next time. The country was ${secretCountry.value}. Play again?`,
        buttonText: 'Try Again',
        isWin: false,
      }
      clearState()
      showModal.value = true
    }
  }

  const handleModalConfirm = () => {
    window.location.reload()
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

    // Load both stations (for audio) and centers (for map/distance)
    Promise.all([loadStations(), loadCenters()]).then(() => {
      if (!secretCountry.value) {
        selectRandomCountry()
      } else {
        populateGuessColors()
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
    currentStationUrl,
    debugCountry,
    handlePlayPause,
    handlePrevious,
    handleNext,
    handleAddGuess,
    handleModalConfirm,
    handleCountrySelect,
  }
}
