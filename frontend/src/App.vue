<template>
  <section class="hero is-small is-info">
    <div class="hero-body">
      <div class="container has-text-centered">
        <h1 class="title">🌍 GeoHearo 🦸</h1>
        <h2 class="subtitle">Guess the country by its radio</h2>
      </div>
    </div>
  </section>

  <section>
    <!-- Search Bar -->
    <div class="container mt-2">
      <div class="box has-text-centered">
        <Radio :radioStations="radioStations" />
      </div>

      <!-- Two Columns -->
      <div class="columns">
        <!-- Left Column: Map Component -->
        <div class="column is-two-thirds">
          <div class="box">
            <Map :guessed="guessed" :secretCountry="secretCountry" />
          </div>
        </div>

        <!-- Right Column: Radio + Guesses Components -->
        <div class="column">
          <SearchBar
            :countries="countries"
            :guessed="guessed"
            @searched="handleSearched"
          />
          <GuessList :guessed="guessed" />
        </div>
      </div>
    </div>
  </section>

  <h3>
    <span style="background-color: lightcoral"
      >Secret country: {{ secretCountry.name }}</span
    >
  </h3>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Country, CountryWithDistance } from './types'
import { MapUtil } from './util/geo'
import { getCountries, loadData } from './util/load'

import { addStreamingUrl } from './util/radio'
import { getRandomCountry, pickRadioStations } from './util/random'

// components
import GuessList from './components/GuessedList.vue'
import Map from './components/Map.vue'
import Radio from './components/Radio.vue'
import SearchBar from './components/SearchBar.vue'

const ALLOWED_GUESSES = 5
const NUM_STATIONS = 5

// guessed is type Country[]
let guessed = ref<CountryWithDistance[]>(
  Array(ALLOWED_GUESSES).fill({ name: '', two_code: '', three_code: '' })
)
let guessCount = 0

const radioData = loadData()
const countries = getCountries(radioData)
const mapUtil = new MapUtil()

// SETUP
const secretCountry = getRandomCountry(countries)
const radioStations = addStreamingUrl(
  pickRadioStations(radioData, secretCountry, NUM_STATIONS)
)

const handleSearched = (country: Country) => {
  // compute distance
  const distance = mapUtil.computeDistance(country, secretCountry)
  console.log('Distance:', distance)

  // compute direction
  const direction = mapUtil.computeDirection(country, secretCountry)
  console.log('Direction:', direction)

  // add guess to list
  guessed.value[guessCount] = { ...country, distance, direction }
  guessCount += 1

  if (country.three_code === secretCountry.three_code) {
    gameWon()
  } else {
    if (guessCount == ALLOWED_GUESSES) {
      // wait a moment
      setTimeout(() => {
        gameOver()
      }, 200)
    }
  }
}

const gameWon = () => {
  alert('Perfect! You won!')
  resetGame()
}

const gameOver = () => {
  alert('Game over!')
  resetGame()
}

const resetGame = () => {
  guessed.value = Array(ALLOWED_GUESSES).fill('')
  guessCount = 0
}
</script>

<style scoped>
.no-padding {
  padding: 0 !important;
}

.knewave-regular {
  font-family: 'Knewave', system-ui;
  font-weight: 400;
  font-style: normal;
}

.hero.is-info .title {
  font-family: 'Knewave', system-ui;
  font-weight: 400;
  font-style: normal;
}
</style>
