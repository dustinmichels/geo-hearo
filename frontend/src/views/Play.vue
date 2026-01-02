<script setup lang="ts">
import { ref } from 'vue'
import {
  FloatingPanel as VanFloatingPanel,
  Field as VanField,
  Button as VanButton,
} from 'vant'
import Globe from '../components/Globe.vue'
import RadioPlayer from '../components/RadioPlayer.vue'
import GuessDisplay from '../components/GuessDisplay.vue'

const isPlaying = ref(false)
const currentStation = ref(1)
const guessInput = ref('')
const guesses = ref<string[]>([])

// Vant Floating Panel setup
const anchors = [
  100, // Collapsed height (px)
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
    // Auto-expand slightly on add? Not strictly needed but UX choice
  }
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
        <Globe />
      </div>
    </div>

    <!-- Vant Floating Panel -->
    <van-floating-panel
      v-model:height="panelHeight"
      :anchors="anchors"
      :content-class="'bg-white rounded-t-[20px] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex flex-col'"
    >
      <div class="flex flex-col h-full w-full max-w-md mx-auto pt-8">
        <div class="px-4 pb-4 flex-1 overflow-y-auto flex flex-col gap-4">
          <!-- Input Area -->
          <div class="flex gap-2 items-center">
            <van-field
              v-model="guessInput"
              placeholder="Enter your guess..."
              :disabled="guesses.length >= 5"
              @keypress.enter="handleAddGuess"
              class="flex-1 border rounded-lg !py-2 !px-3"
              :border="false"
            />
            <van-button
              type="primary"
              size="small"
              @click="handleAddGuess"
              :disabled="!guessInput.trim() || guesses.length >= 5"
              class="!h-[40px] !px-6"
            >
              Add
            </van-button>
          </div>

          <!-- Guesses Display -->
          <GuessDisplay :guesses="guesses" />
        </div>
      </div>
    </van-floating-panel>
  </div>
</template>
