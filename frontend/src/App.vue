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
      <SearchBar
        :countries="countries"
        :guessed="guessed"
        @searched="handleSearched"
      />

      <!-- Two Columns -->
      <div class="columns">
        <!-- Left Column: Map Component -->
        <div class="column is-two-thirds">
          <div class="box">
            <Map :guessed="guessed" />
          </div>
        </div>

        <!-- Right Column: Radio + Guesses Components -->
        <div class="column">
          <div class="box has-text-centered">
            <Radio msg="Radio" />
          </div>
          <GuessList :guessed="guessed" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Country } from './types'
import { getCountries, loadData } from './util/load'

// components
import GuessList from './components/GuessedList.vue'
import Map from './components/Map.vue'
import Radio from './components/Radio.vue'
import SearchBar from './components/SearchBar.vue'

const ALLOWED_GUESSES = 5

// guessed is type Country[]
let guessed = ref<Country[]>(
  Array(ALLOWED_GUESSES).fill({ name: '', two_code: '', three_code: '' })
)
let guessCount = 0

const radioData = loadData()
const countries = getCountries(radioData)

const handleSearched = (country: Country) => {
  guessed.value[guessCount] = country
  guessCount += 1
  if (guessCount == ALLOWED_GUESSES) {
    // wait a moment
    setTimeout(() => {
      gameOver()
    }, 200)
  }
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
</style>
