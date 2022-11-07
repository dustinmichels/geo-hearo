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
          :key="country.name"
          @click="selectCountry(country.name)"
          class="cursor-pointer hover:bg-gray-100 p-1"
        >
          {{ country.name }}
        </li>
      </ul>

      <p v-if="selectedCountry" class="text-lg pt-2 absolute">
        You have selected:
        <span class="font-semibold">{{ selectedCountry }}</span>
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'

import countries from '../assets/data/countries.json'

export default defineComponent({
  emits: {
    addBook(payload: { bookName: string }) {
      // perform runtime validation
      return payload.bookName.length > 0
    },
  },

  setup(props, context) {
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

    const selectCountry = (country: string) => {
      selectedCountry.value = country
      searchTerm.value = ''
    }

    return {
      countries,
      searchTerm,
      searchCountries,
      selectCountry,
      selectedCountry,
    }
  },
})
</script>
