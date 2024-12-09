<template>
  <section class="hero is-small is-info">
    <div class="hero-body">
      <div class="container has-text-centered">
        <h1 class="title">🌍 GeoHearo 🦸</h1>
        <h2 class="subtitle">Guess the country from its radio</h2>
      </div>
    </div>
  </section>

  <section>
    <!-- Search Bar -->
    <div class="container mt-2">
      <div class="box has-text-centered">
        <Radio :radioStations="radioStations" :isGameOver="isGameOver" />
      </div>

      <!-- Two Columns -->
      <div class="columns">
        <!-- Left Column: Radio + Guesses Components -->
        <div class="column has-text-centered">
          <SearchBar
            :countries="countries"
            :guessed="guessed"
            @searched="handleSearched"
          />
          <GuessList :guessed="guessed" />
          <button
            class="button is-warning"
            v-show="isGameOver"
            @click="resetGame"
          >
            Reset
          </button>
        </div>

        <!-- Right Column: Map Component -->
        <div class="column is-two-thirds">
          <div class="box">
            <Map
              :guessed="guessed"
              :secretCountry="secretCountry"
              :isGameOver="isGameOver"
            />
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- for debug -->
  <h3 style="display: None">
    <span style="background-color: lightcoral"
      >Secret country: {{ secretCountry.name }}</span
    >
  </h3>

  <footer class="footer">
    <div class="content has-text-centered">
      <p>
        Made by <a href="https://dustinmichels.com/">Dustin Michels</a>.
        Inspired by <a href="https://worldle.teuteuf.fr">worldle.teuteuf</a>.
        See
        <a href="https://github.com/dustinmichels/geo-hearo">GitHub.</a>
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Country, CountryGuessed } from './types'
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

const radioData = loadData()
const countries = getCountries(radioData)
const mapUtil = new MapUtil()

// SETUP
let guessed = ref<CountryGuessed[]>(
  Array(ALLOWED_GUESSES).fill({ name: '', two_code: '', three_code: '' })
)
let guessCount = 0
const isGameOver = ref(false)
let secretCountry = getRandomCountry(countries)
let radioStations = addStreamingUrl(
  pickRadioStations(radioData, secretCountry, NUM_STATIONS)
)

const handleSearched = (country: Country) => {
  // compute distance & direction
  const distance = mapUtil.computeDistance(country, secretCountry)
  const direction = mapUtil.computeDirection(country, secretCountry)
  const isCorrect = country.three_code === secretCountry.three_code

  // add guess to list
  guessed.value[guessCount] = {
    ...country,
    distance,
    direction,
    isCorrect,
  }
  guessCount += 1

  if (isCorrect === true) {
    gameWon()
  } else {
    if (guessCount === ALLOWED_GUESSES) {
      gameOver()
    }
  }
}

const gameWon = () => {
  isGameOver.value = true
  alert('Perfect! You won!')
}

const gameOver = () => {
  isGameOver.value = true
  // wait a moment before showing alert
  setTimeout(() => {
    alert('Game over!')
  }, 200)
}

const resetGame = () => {
  // guessed.value = Array(ALLOWED_GUESSES).fill('')
  // guessCount = 0
  // secretCountry = getRandomCountry(countries)
  // radioStations = addStreamingUrl(
  // pickRadioStations(radioData, secretCountry, NUM_STATIONS)
  // )
  location.reload()
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
