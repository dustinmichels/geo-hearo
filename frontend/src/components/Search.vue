<template>
  <div class="flex justify-center items-center">
    <div class="w-1/2 relative space-y-3">
      <input
        type="text"
        id="search"
        v-model="searchTerm"
        placeholder="Guess a country..."
        class="p-3 mb-0.5 w-full border border-gray-300 rounded"
      />

      <ul
        v-if="searchCountries.length"
        class="w-full rounded bg-white border border-gray-300 px-4 py-2 space-y-1 absolute z-10"
      >
        <li
          v-for="country in searchCountries"
          :key="country.id"
          @click="selectCountry(country.properties.name)"
          class="cursor-pointer hover:bg-gray-100 p-1"
        >
          {{ country.properties.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import data from '../assets/data/datamaps.json'
import { DatamapsJson } from '../util/geo/datamaps'

const countries = data as DatamapsJson[]

const emit = defineEmits(['addToHistory'])

let searchTerm = ref('')
let selectedCountry = ref('')

const searchCountries = computed(() => {
  if (searchTerm.value === '') {
    return []
  }
  let matches = 0
  return countries.filter((country) => {
    if (
      country.properties.name
        .toLowerCase()
        .includes(searchTerm.value.toLowerCase()) &&
      matches < 10
    ) {
      matches++
      return country
    }
  })
})

const selectCountry = (country: string) => {
  selectedCountry.value = country
  emit('addToHistory', country)
  searchTerm.value = ''
}
</script>
