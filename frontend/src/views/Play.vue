<script setup lang="ts">
import { ref } from 'vue'
import { DrawerRoot, DrawerPortal, DrawerContent, DrawerTitle } from 'vaul-vue'
import Globe from '../components/Globe.vue'
import RadioPlayer from '../components/RadioPlayer.vue'
import GuessDisplay from '../components/GuessDisplay.vue'
import Input from '../components/ui/Input.vue'
import Button from '../components/ui/Button.vue'

const isPlaying = ref(false)
const currentStation = ref(1)
const guessInput = ref('')
const guesses = ref<string[]>([])
const isOpen = ref(true)
const snapPoints = ['220px', 1]
const activeSnapPoint = ref<number | string | null>('220px')

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
    // Optionally expand drawer on guess add?
    // activeSnapPoint.value = 1
  }
}

const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleAddGuess()
  }
}
</script>

<template>
  <DrawerRoot
    v-model:open="isOpen"
    :snap-points="snapPoints"
    v-model:active-snap-point="activeSnapPoint"
    :modal="false"
    :dismissible="false"
  >
    <div
      class="h-screen w-full overflow-hidden bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 relative"
    >
      <!-- Fixed content area -->
      <div class="h-full w-full flex flex-col max-w-md mx-auto">
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

      <!-- Drawer Portal -->
      <DrawerPortal>
        <DrawerContent
          class="bg-white flex flex-col rounded-t-[10px] fixed bottom-0 left-0 right-0 z-50 h-full max-h-[96%] max-w-md mx-auto outline-none shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-gray-200"
        >
          <!-- Handle/Grabber visual -->
          <!-- Handle/Grabber visual -->
          <div
            class="mx-auto mt-4 h-4 w-32 rounded-full bg-gray-400 mb-4 hover:bg-gray-500 transition-colors"
          />

          <div class="p-4 space-y-4 overflow-y-auto flex-1">
            <!-- Title/Header for Drawer -->
            <DrawerTitle class="sr-only"> Make a Guess </DrawerTitle>

            <!-- Text Input -->
            <div class="flex gap-2">
              <Input
                type="text"
                placeholder="Enter your guess..."
                v-model="guessInput"
                @keypress="handleKeyPress"
                class="flex-1"
                :disabled="guesses.length >= 5"
              />
              <Button
                @click="handleAddGuess"
                :disabled="!guessInput.trim() || guesses.length >= 5"
              >
                Add
              </Button>
            </div>

            <!-- Guesses Display -->
            <GuessDisplay :guesses="guesses" />
          </div>
        </DrawerContent>
      </DrawerPortal>
    </div>
  </DrawerRoot>
</template>
