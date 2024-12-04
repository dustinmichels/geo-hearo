<template>
  <div>
    <!-- Search Bar -->
    <section class="section">
      <div class="container">
        <SearchBar
          :countries="countries"
          :guessed="guessed"
          @searched="handleSearched"
        />
      </div>
    </section>

    <!-- Two Columns -->
    <section class="section">
      <div class="container">
        <div class="columns">
          <!-- Left Column: Map Component -->
          <div class="column is-two-thirds">
            <div class="box">
              <Map msg="Map" />
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
  </div>
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

let guessed = ref(Array(ALLOWED_GUESSES).fill(''))
let guessCount = 0

const radioData = loadData()
const countries = getCountries(radioData)

const handleSearched = (country: Country) => {
  guessed.value[guessCount] = country.name
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

<style scoped></style>
