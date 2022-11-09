<script setup lang="ts">
import { ref } from 'vue'

import AudioPlayer from './components/AudioPlayer/Player.vue'
import Map from './components/Map.vue'
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
  <div class="container mx-auto">
    <!-- SEARCH BAR -->
    <Search @add-to-history="handleAddToHistory" />

    <div class="grid grid-rows-3 grid-flow-col gap-4 pt-10">
      <div class="row-span-3 col-span-2">
        <!-- MAP -->
        <Map />
      </div>
      <div class="col-span-1">
        <!-- AUDIO PLAYER -->
        <AudioPlayer
          :option="{
            src: 'https://radio.garden/api/ara/content/listen/dKofB-bG/channel.mp3',
          }"
        />
      </div>
      <div class="row-span-2 col-span-1">
        <!-- GUESS LIST -->
        <!-- ui ... class="w-1/5 bg-slate-200 rounded border border-gray-300 px-4 py-2 space-y-1" -->
        <ul
          v-if="guessed.length > 1"
          class="bg-slate-200 rounded border border-gray-300 px-4 py-2 space-y-1"
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
    </div>
  </div>
</template>

<style scoped>
.container {
  border: 2px solid blue;
}

.col-span-1,
.col-span-2 {
  border: 2px solid red;
}

/* .guess::before {
  content: '\0274C  ';
} */
</style>
