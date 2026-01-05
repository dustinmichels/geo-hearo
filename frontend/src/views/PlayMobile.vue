<script setup lang="ts">
import gsap from 'gsap'
import { FloatingPanel as VanFloatingPanel } from 'vant'
import { computed, onMounted, ref } from 'vue'
import { useRadio } from '../composables/useRadio'
import AnimatedArrows from '../components/AnimatedArrows.vue'
import GameResultModal from '../components/GameResultModal.vue'
import GuessPanel from '../components/GuessPanel.vue'
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

// Vant Floating Panel setup
const anchors = [
  140, // Collapsed height (px)
  Math.round(window.innerHeight * 0.45), // Half-open
  Math.round(window.innerHeight * 0.9), // Fully open
]
const panelHeight = ref(anchors[0])

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
      message: `Correction! The country was ${selectedCountry.value}. Great job!`,
      buttonText: 'Play Again',
      isWin: true,
    }
    showModal.value = true
    return
  }

  // Add guess
  guesses.value.push(guess)
  guessInput.value = ''

  // Snap to fully open
  panelHeight.value = anchors[2]

  // Check loss
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

const handleArrowClick = () => {
  panelHeight.value = anchors[0]
}

// GSAP Animations and Refs
const blob1 = ref(null)
const blob2 = ref(null)

const isPanelFullHeight = computed(() => {
  const fullHeight = anchors[2]
  if (
    typeof fullHeight === 'undefined' ||
    typeof panelHeight.value === 'undefined'
  )
    return false
  return panelHeight.value >= fullHeight - 10
})

const overlayOpacity = computed(() => {
  const min = anchors[0]
  const max = anchors[2]
  const current = panelHeight.value

  if (
    typeof min === 'undefined' ||
    typeof max === 'undefined' ||
    typeof current === 'undefined'
  ) {
    return 0
  }

  const progress = (current - min) / (max - min)
  // Clamp between 0 and 1
  const clamped = Math.min(Math.max(progress, 0), 1)
  return clamped * 0.6 // Max opacity 0.6
})

onMounted(() => {
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
</script>

<template>
  <div
    class="h-screen w-full overflow-hidden bg-cloud-white relative text-pencil-lead font-body"
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

    <!-- Animated Arrows Hint -->
    <div class="relative z-50" v-show="isPanelFullHeight">
      <AnimatedArrows class="!top-9" @click="handleArrowClick" />
    </div>

    <!-- Fixed content area -->
    <div
      class="h-full w-full flex flex-col max-w-md mx-auto pb-[100px] relative z-10"
    >
      <!-- Title -->
      <div class="pt-6 px-4 flex justify-center">
        <div class="relative">
          <h1
            class="text-center text-pencil-lead text-3xl font-heading tracking-wider pb-3"
          >
            GeoHearo
          </h1>
          <span
            class="absolute left-full bottom-1 text-5xl ml-4 leading-[0.8] z-20 whitespace-nowrap transition-transform duration-700 ease-out"
            :class="isPlaying ? 'translate-y-0' : 'translate-y-16'"
            >🦸</span
          >
        </div>
      </div>

      <!-- Radio Player -->
      <div class="px-4 pb-2 relative z-30">
        <RadioPlayer
          :is-playing="isPlaying"
          :current-station="currentStation"
          :station-url="currentStationUrl"
          @play-pause="handlePlayPause"
          @previous="handlePrevious"
          @next="handleNext"
        />
      </div>

      <!-- Globe - takes remaining space -->
      <div class="flex-1 px-4 pb-2 min-h-0 relative">
        <Map
          @select-country="handleCountrySelect"
          :guessed-countries="guesses"
          :selected-country="guessInput"
        />
      </div>
    </div>

    <!-- Overlay for dimming effect -->
    <div
      class="fixed inset-0 bg-black pointer-events-none z-40"
      :style="{ opacity: overlayOpacity }"
    ></div>

    <!-- Vant Floating Panel -->
    <van-floating-panel
      v-model:height="panelHeight"
      :anchors="anchors"
      :content-class="'bg-paper-white rounded-t-[24px] border-t-3 border-l-3 border-r-3 border-pencil-lead shadow-[0_-4px_0_0_#334155] flex flex-col'"
      style="z-index: 50"
    >
      <GuessPanel
        v-model="guessInput"
        :guesses="guesses"
        @add-guess="handleAddGuess"
      />
    </van-floating-panel>

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
:deep(.van-floating-panel) {
  /* Remove dark background override, let Tailwind class handle it */
  background-color: transparent !important;
}

:deep(.van-floating-panel__header) {
  height: 48px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: transparent !important;
}

:deep(.van-floating-panel__bar) {
  width: 64px !important;
  height: 6px !important;
  background-color: #334155 !important; /* Pencil Lead */
  border-radius: 999px !important;
  opacity: 0.5; /* Slight transparency for softer look */
}
</style>
