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
        class="w-full rounded border border-gray-300 bg-white px-4 py-2 space-y-1 absolute z-10"
      >
        <li
          v-for="country in searchCountries"
          :key="country.three_code"
          @click="selectCountry(country)"
          class="cursor-pointer hover:bg-gray-100 p-1"
        >
          {{ country.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { SourceData, loadSourceData } from '../util/data'

const countries = loadSourceData()

const emit = defineEmits(['searched'])

let searchTerm = ref('')
let selectedCountry = ref('')

const searchCountries = computed(() => {
  if (searchTerm.value === '') {
    return []
  }
  let matches = 0
  return countries.filter((country) => {
    if (
      country.name.toLowerCase().includes(searchTerm.value.toLowerCase()) &&
      matches < 10
    ) {
      matches++
      return country
    }
  })
})

const selectCountry = (country: SourceData) => {
  // Does this do anything?
  selectedCountry.value = country.name
  emit('searched', country)
  searchTerm.value = ''
}
</script>
