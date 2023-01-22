<script setup lang="ts">
import { ref } from 'vue'

import AudioPlayer from './components/AudioPlayer/Player.vue'
import Map from './components/Map.vue'
import Search from './components/Search.vue'
import { SourceData, getRandomCountry, loadSourceData } from './util/data'
import {
  getStationUrls,
  getStationsByCountry,
  getStreamingUrlFromStationId,
} from './util/radio'

const ALLOWED_GUESSES = 3

// const radioData = loadRadioData()
const sourceData = loadSourceData()

const secretCountry = getRandomCountry()

const stations = getStationsByCountry(secretCountry)
const stationUrls = getStationUrls(stations)
// const firstStationUrl = getStreamingUrlFromStationId(stations[0].id)

// let guessed = ref(['Germany', 'Switzerland', 'Austria'])
let guessed = ref(Array(ALLOWED_GUESSES).fill(''))

let guessCount = 1

const handleSearched = (country: SourceData) => {
  guessed.value[guessCount] = country.name
  guessCount += 1
  if (guessCount == ALLOWED_GUESSES) {
    alert('Game over!')
  }
}
</script>

<template>
  <div class="container mx-auto">
    <p>
      <span style="font-weight: bold">Secret country:</span> {{ secretCountry }}
    </p>
    <p>
      <span style="font-weight: bold">First Radio URL:</span>
      {{ stationUrls[0] }}
    </p>

    <!-- SEARCH BAR -->
    <Search @searched="handleSearched" />

    <div class="grid grid-rows-3 grid-flow-col gap-4 pt-10">
      <div class="row-span-3 col-span-2">
        <!-- MAP -->
        <Map />
      </div>
      <div class="col-span-1">
        <!-- AUDIO PLAYER -->
        <AudioPlayer
          :option="{
            src: stationUrls[0],
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
