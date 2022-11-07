<script setup lang="ts">
import { ref } from 'vue'

import AudioPlayer from './components/AudioPlayer/Player.vue'
import Search from './components/Search.vue'

const NUM_GUESS = 7

// let guessed = ref(['Germany', 'Switzerland', 'Austria'])
let guessed = ref(Array(NUM_GUESS).fill(''))

let guessCount = 1

const handleAddToHistory = (country: string) => {
  guessed.value[guessCount] = country
  guessCount += 1
  if (guessCount == NUM_GUESS) {
    alert('Game over!')
  }
}
</script>

<template>
  <AudioPlayer
    :option="{
      src: 'https://radio.garden/api/ara/content/listen/dKofB-bG/channel.mp3',
    }"
  />

  <Search @add-to-history="handleAddToHistory" />

  <!-- Guesses -->
  <div class="flex justify-center items-center pt-20">
    <ul
      v-if="guessed.length > 1"
      class="w-1/5 bg-slate-200 rounded border border-gray-300 px-4 py-2 space-y-1"
    >
      <template v-for="(item, index) in guessed">
        <li
          v-if="index > 0"
          :key="index"
          class="guess border-b border-gray-300"
        >
          {{ index }}. {{ item }}
        </li>
      </template>
    </ul>
  </div>
</template>

<style scoped>
/* .guess::before {
  content: '\0274C  ';
} */
</style>
