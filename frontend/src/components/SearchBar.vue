<template>
  <div class="field mb-0">
    <p class="control has-icons-left">
      <input
        class="input"
        type="text"
        autocomplete="off"
        v-model="searchTerm"
        placeholder="Guess a country..."
        @focus="scrollToSearchBar"
        @keydown.down.prevent="highlightNext"
        @keydown.up.prevent="highlightPrev"
        @keydown.enter.prevent="selectHighlighted"
        ref="searchInput"
      />
      <span class="icon is-small is-left">
        <i class="fas fa-search"></i>
      </span>
    </p>
    <div :class="['dropdown', { 'is-active': filteredCountries.length > 0 }]">
      <div class="dropdown-menu" id="dropdown-menu" role="menu">
        <div class="dropdown-content">
          <p
            v-for="(country, index) in filteredCountries"
            :key="country.three_code"
            href="#"
            class="dropdown-item"
            :class="{ 'is-active': index === highlightedIndex }"
            v-html="displayFormatted(country.name)"
            @click.prevent="selectCountry(country)"
          ></p>
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
  guessed: Country[]
}>()

const emit = defineEmits(['searched'])

let searchTerm = ref('')
let highlightedIndex = ref(-1)

// todo: is it working?
const searchInput = ref<HTMLInputElement | null>(null)

const filteredCountries = computed(() => {
  if (searchTerm.value === '') {
    highlightedIndex.value = -1
    return []
  }
  const results = props.countries
    .filter(
      (country) =>
        country.name.toLowerCase().includes(searchTerm.value.toLowerCase()) &&
        !props.guessed.some(
          (guessedCountry) => guessedCountry.name === country.name
        )
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
    .slice(0, 10)
  highlightedIndex.value = results.length > 0 ? 0 : -1
  return results
})

function displayFormatted(name: string) {
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

function selectCountry(country: Country) {
  searchTerm.value = ''
  highlightedIndex.value = -1
  console.log('Selected:', country)
  emit('searched', country)
}

// Down arrow key
function highlightNext() {
  if (highlightedIndex.value < filteredCountries.value.length - 1) {
    highlightedIndex.value++
  }
}

// Up arrow key
function highlightPrev() {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
}

// Enter key
function selectHighlighted() {
  if (
    highlightedIndex.value >= 0 &&
    highlightedIndex.value < filteredCountries.value.length
  ) {
    selectCountry(filteredCountries.value[highlightedIndex.value])
  }
}

// use ref to scroll when touched.
// todo: is it working?
function scrollToSearchBar() {
  if (searchInput.value) {
    searchInput.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
</script>

<style scoped>
.dropdown-item.is-active {
  background-color: #f5f5f5;
}
</style>
