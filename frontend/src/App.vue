<template>
  <div>
    <!-- Search Bar -->
    <section class="section">
      <div class="container">
        <SearchBar />
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
            <div class="box has-text-centered">
              <GuessList msg="GuessList" />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import GuessList from './components/GuessList.vue'
import Map from './components/Map.vue'
import Radio from './components/Radio.vue'
import SearchBar from './components/SearchBar.vue'

import { getCountries, loadData } from './util/load'

const radioData = loadData()
const countries = getCountries(radioData)
</script>

<style>
/* Optional custom styles */
</style>
