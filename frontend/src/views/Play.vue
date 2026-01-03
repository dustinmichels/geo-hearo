<script setup lang="ts">
import { Field as VanField, FloatingPanel as VanFloatingPanel } from 'vant'
import { ref, onMounted } from 'vue'
import gsap from 'gsap'
import GuessDisplay from '../components/GuessDisplay.vue'
import Map from '../components/Map.vue'
import RadioPlayer from '../components/RadioPlayer.vue'

const isPlaying = ref(false)
const currentStation = ref(1)
const guessInput = ref('')
const guesses = ref<string[]>([])

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
  if (guessInput.value.trim() && guesses.value.length < 5) {
    guesses.value.push(guessInput.value.trim())
    guessInput.value = ''
    // Snap to fully open
    panelHeight.value = anchors[2]
  }
}

const handleCountrySelect = (name: string) => {
  guessInput.value = name
}

// GSAP Animations and Refs
const blob1 = ref(null)
const blob2 = ref(null)

onMounted(() => {
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

    <!-- Fixed content area -->
    <div
      class="h-full w-full flex flex-col max-w-md mx-auto pb-[100px] relative z-10"
    >
      <!-- Title -->
      <div class="pt-6 pb-2 px-4 flex justify-center">
        <h1
          class="text-center text-pencil-lead text-3xl font-heading tracking-tight"
        >
          GeoHearo
        </h1>
      </div>

      <!-- Radio Player -->
      <div class="px-4 pb-2">
        <RadioPlayer
          :is-playing="isPlaying"
          :current-station="currentStation"
          @play-pause="handlePlayPause"
          @previous="handlePrevious"
          @next="handleNext"
        />
      </div>

      <!-- Globe - takes remaining space -->
      <div class="flex-1 px-4 pb-2 min-h-0 relative">
        <Map @select-country="handleCountrySelect" />
      </div>
    </div>

    <!-- Vant Floating Panel -->
    <van-floating-panel
      v-model:height="panelHeight"
      :anchors="anchors"
      :content-class="'bg-paper-white rounded-t-[24px] border-t-3 border-l-3 border-r-3 border-pencil-lead shadow-[0_-4px_0_0_#334155] flex flex-col'"
    >
      <div class="flex flex-col h-full w-full max-w-md mx-auto pt-3">
        <div class="px-4 pb-4 flex-1 overflow-y-auto flex flex-col gap-6">
          <!-- Input Area -->
          <div class="flex gap-3 items-center">
            <van-field
              v-model="guessInput"
              placeholder="Enter your guess..."
              :disabled="guesses.length >= 5"
              @keypress.enter="handleAddGuess"
              class="flex-1 !border-3 !border-pencil-lead !rounded-2xl !py-3 !px-4 !text-[18px] font-body text-pencil-lead placeholder:text-eraser-grey bg-white"
              :border="false"
            />
            <button
              @click="handleAddGuess"
              :disabled="!guessInput.trim() || guesses.length >= 5"
              class="btn-pressable bg-yuzu-yellow h-[52px] px-6 rounded-xl font-heading text-lg text-pencil-lead uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guess
            </button>
          </div>

          <!-- Guesses Display -->
          <GuessDisplay :guesses="guesses" />

          <!-- Back to Home Link -->
          <div class="mt-auto pt-6 pb-4 text-center">
            <RouterLink
              to="/"
              class="text-lg font-heading text-eraser-grey hover:text-bubblegum-pop transition-colors flex items-center justify-center gap-2"
            >
              <span>←</span> Back to Home
            </RouterLink>
          </div>
        </div>
      </div>
    </van-floating-panel>
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
