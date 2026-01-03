<script setup lang="ts">
import {
  Button as VanButton,
  Field as VanField,
  FloatingPanel as VanFloatingPanel,
} from 'vant'
import { ref } from 'vue'
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
</script>

<template>
  <div
    class="h-screen w-full overflow-hidden bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 relative"
  >
    <!-- Fixed content area -->
    <div class="h-full w-full flex flex-col max-w-md mx-auto pb-[100px]">
      <!-- Title -->
      <div class="pt-4 pb-2 px-4">
        <h1 class="text-center text-gray-800 text-lg font-bold">GeoHearo</h1>
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
      :content-class="'rounded-t-[20px] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex flex-col'"
    >
      <div class="flex flex-col h-full w-full max-w-md mx-auto pt-3">
        <div class="px-4 pb-4 flex-1 overflow-y-auto flex flex-col gap-4">
          <!-- Input Area -->
          <div class="flex gap-2 items-center">
            <van-field
              v-model="guessInput"
              placeholder="Enter your guess..."
              :disabled="guesses.length >= 5"
              @keypress.enter="handleAddGuess"
              class="flex-1 border rounded-lg !py-2 !px-3 !text-[16px]"
              :border="false"
            />
            <van-button
              type="primary"
              size="small"
              @click="handleAddGuess"
              :disabled="!guessInput.trim() || guesses.length >= 5"
              class="!h-[40px] !px-6"
            >
              Guess
            </van-button>
          </div>

          <!-- Guesses Display -->
          <GuessDisplay :guesses="guesses" />
        </div>
      </div>
    </van-floating-panel>
  </div>
</template>

<style scoped>
:deep(.van-floating-panel) {
  background-color: #042a2b !important;
}

:deep(.van-floating-panel__header) {
  height: 48px !important; /* Larger hit area */
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: transparent !important;
}

:deep(.van-floating-panel__bar) {
  width: 64px !important; /* Wider handle */
  height: 6px !important; /* Thicker handle */
  background-color: #94a3b8 !important; /* Eraser Grey */
  border-radius: 999px !important;
}
</style>
