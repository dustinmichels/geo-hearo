<template>
  <div class="field">
    <p class="control has-icons-left">
      <input
        class="input"
        type="text"
        v-model="searchTerm"
        placeholder="Guess a country..."
      />
      <span class="icon is-left">
        <i class="fas fa-search"></i>
      </span>
    </p>
    <div :class="['dropdown', { 'is-active': filteredCountries.length > 0 }]">
      <div class="dropdown-menu" id="dropdown-menu" role="menu">
        <div class="dropdown-content">
          <a
            v-for="country in filteredCountries"
            :key="country.three_code"
            href="#"
            class="dropdown-item"
            v-html="highlightMatch(country.name)"
            @click.prevent="selectCountry(country)"
          ></a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Country } from '../types'

const props = defineProps<{
  countries: Country[]
}>()

const emit = defineEmits(['searched'])

let searchTerm = ref('')

// Return the first n countries that match the search term, sorted to ensure those that start with the search term come first
const filteredCountries = computed(() => {
  if (searchTerm.value === '') {
    return []
  }
  return props.countries
    .filter((country) =>
      country.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
    .sort((a, b) => {
      const searchTermLower = searchTerm.value.toLowerCase()
      const aStartsWith = a.name.toLowerCase().startsWith(searchTermLower)
      const bStartsWith = b.name.toLowerCase().startsWith(searchTermLower)
      if (aStartsWith && !bStartsWith) {
        return -1
      }
      if (!aStartsWith && bStartsWith) {
        return 1
      }
      return a.name.localeCompare(b.name)
    })
    .slice(0, 20)
})

const selectCountry = (country: Country) => {
  console.log('selected!!!', country)
  emit('searched', country)
  searchTerm.value = ''
}

// Display the country name with the search term highlighted
function highlightMatch(name: string) {
  const searchTermLower = searchTerm.value.toLowerCase()
  const index = name.toLowerCase().indexOf(searchTermLower)
  if (index === -1) {
    return name
  }
  const beforeMatch = name.slice(0, index)
  const match = name.slice(index, index + searchTerm.value.length)
  const afterMatch = name.slice(index + searchTerm.value.length)
  return `${beforeMatch}<strong>${match}</strong>${afterMatch}`
}
</script>

<style scoped></style>
