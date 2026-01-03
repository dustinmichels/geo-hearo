<script setup lang="ts">
import gsap from 'gsap'
import { onMounted, ref } from 'vue'
import GuessPanel from '../components/GuessPanel.vue'
import Map from '../components/Map.vue'
import RadioPlayer from '../components/RadioPlayer.vue'

const isPlaying = ref(false)
const currentStation = ref(1)
const guessInput = ref('')
const guesses = ref<string[]>([])

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
    class="h-screen w-full overflow-hidden bg-cloud-white relative text-pencil-lead font-body p-6 flex gap-6"
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
              class="text-center text-pencil-lead text-3xl font-heading tracking-wider"
            >
              GeoHearo
            </h1>
            <span
              class="absolute left-full bottom-3 text-4xl ml-1 leading-[0.8] z-20 whitespace-nowrap rotate-[15deg]"
              >🎧</span
            >
          </div>
        </div>

        <!-- Radio Player -->
        <RadioPlayer
          :is-playing="isPlaying"
          :current-station="currentStation"
          @play-pause="handlePlayPause"
          @previous="handlePrevious"
          @next="handleNext"
        />
      </div>

      <!-- Guess Panel Card -->
      <div
        class="flex-1 bg-paper-white rounded-3xl border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] overflow-hidden flex flex-col relative"
      >
        <GuessPanel
          v-model="guessInput"
          :guesses="guesses"
          @add-guess="handleAddGuess"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No specific styles needed as we're using Tailwind utilities */
</style>
