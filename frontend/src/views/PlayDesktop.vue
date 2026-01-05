<script setup lang="ts">
import gsap from 'gsap'
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useRadio } from '../composables/useRadio'
import GameResultModal from '../components/GameResultModal.vue'
import GuessPanel from '../components/GuessPanel.vue'
import Footer from '../components/Footer.vue'
import Map from '../components/Map.vue'
import RadioPlayer from '../components/RadioPlayer.vue'

const isPlaying = ref(false)
const currentStation = ref(1)
const guessInput = ref('')
const guesses = ref<string[]>([])

// Game State
const showModal = ref(false)
const modalConfig = ref({
  title: '',
  message: '',
  buttonText: '',
  isWin: false,
})

const { loadStations, selectRandomCountry, currentStations, selectedCountry } =
  useRadio()

const currentStationUrl = computed(() => {
  return currentStations.value[currentStation.value - 1]?.channel_resolved_url
})

const handlePlayPause = () => {
  isPlaying.value = !isPlaying.value
}

const handlePrevious = () => {
  currentStation.value = currentStation.value > 1 ? currentStation.value - 1 : 5
}

const handleNext = () => {
  currentStation.value = currentStation.value < 5 ? currentStation.value + 1 : 1
}

const handleAddGuess = () => {
  const guess = guessInput.value.trim()
  if (!guess || guesses.value.length >= 5) return

  // Check if won
  if (guess.toLowerCase() === selectedCountry.value.toLowerCase()) {
    modalConfig.value = {
      title: 'You got it!',
      message: `Wooo! The country was ${selectedCountry.value}. Great job!`,
      buttonText: 'Play Again',
      isWin: true,
    }
    showModal.value = true
    return
  }

  // Add guess and check loss
  guesses.value.push(guess)
  guessInput.value = ''

  if (guesses.value.length >= 5) {
    modalConfig.value = {
      title: 'Game Over',
      message: `Better luck next time. The country was ${selectedCountry.value}. Play again?`,
      buttonText: 'Try Again',
      isWin: false,
    }
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
  // Ignore if user is typing in an input text field
  const target = e.target as HTMLElement
  if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return

  switch (e.code) {
    case 'Space':
      e.preventDefault()
      handlePlayPause()
      break
    case 'ArrowLeft':
      e.preventDefault() // Prevent map panning
      handlePrevious()
      break
    case 'ArrowRight':
      e.preventDefault() // Prevent map panning
      handleNext()
      break
    case 'Enter':
      e.preventDefault()
      handleAddGuess()
      break
  }
}

// GSAP Animations and Refs
const blob1 = ref(null)
const blob2 = ref(null)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)

  loadStations().then(() => {
    if (!selectedCountry.value) {
      selectRandomCountry()
    }
  })

  // Move blobs around
  gsap.to(blob1.value, {
    x: 50,
    y: 30,
    scale: 1.1,
    duration: 8,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
  })

  gsap.to(blob2.value, {
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
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    class="h-screen w-full overflow-hidden bg-cloud-white relative text-pencil-lead font-body px-6 pt-6 pb-2 flex flex-col gap-4"
  >
    <!-- Decorative Background Shapes -->
    <div
      ref="blob1"
      class="absolute top-10 right-[-5%] w-64 h-64 bg-bubblegum-pop/5 rounded-full blur-3xl pointer-events-none"
    ></div>
    <div
      ref="blob2"
      class="absolute bottom-10 left-[-5%] w-80 h-80 bg-gumball-blue/5 rounded-full blur-3xl pointer-events-none"
    ></div>

    <!-- Main Content Area -->
    <div class="flex-1 flex gap-6 min-h-0 relative z-10">
      <!-- Left: Map Area -->
      <div
        class="flex-1 bg-sea-blue/10 rounded-3xl border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] overflow-hidden relative z-10"
      >
        <Map
          @select-country="handleCountrySelect"
          :guessed-countries="guesses"
          :selected-country="guessInput"
        />
      </div>

      <!-- Right: Sidebar -->
      <div class="w-[400px] flex flex-col gap-6 relative z-10 shrink-0">
        <!-- Header & Player Card -->
        <div
          class="bg-paper-white rounded-3xl border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] p-6"
        >
          <!-- Title -->
          <div class="flex justify-center mb-6">
            <div class="relative">
              <h1
                class="text-center text-pencil-lead text-3xl font-heading tracking-wider pb-3"
              >
                GeoHearo
              </h1>
              <span
                class="absolute left-full bottom-[-1.5rem] text-5xl ml-4 leading-[0.8] z-20 whitespace-nowrap transition-transform duration-700 ease-out"
                :class="isPlaying ? 'translate-y-0' : 'translate-y-16'"
                >🦸</span
              >
            </div>
          </div>

          <!-- Radio Player -->
          <div class="relative z-30">
            <RadioPlayer
              :is-playing="isPlaying"
              :current-station="currentStation"
              :station-url="currentStationUrl"
              @play-pause="handlePlayPause"
              @previous="handlePrevious"
              @next="handleNext"
            />
          </div>
        </div>

        <!-- Guess Panel Card -->
        <div
          class="flex-1 bg-paper-white rounded-3xl border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] overflow-hidden flex flex-col relative"
        >
          <GuessPanel
            v-model="guessInput"
            :guesses="guesses"
            @add-guess="handleAddGuess"
            :with-footer="false"
          />
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="relative z-10">
      <Footer class="!py-0 text-xs" />
    </div>

    <!-- Game Result Modal -->
    <GameResultModal
      :show="showModal"
      :title="modalConfig.title"
      :message="modalConfig.message"
      :button-text="modalConfig.buttonText"
      :is-win="modalConfig.isWin"
      @confirm="handleModalConfirm"
    />
  </div>
</template>

<style scoped>
/* No specific styles needed as we're using Tailwind utilities */
</style>
