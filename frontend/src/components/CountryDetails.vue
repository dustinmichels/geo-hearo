<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  countryName: string
}>()

interface PexelsData {
  url: string
  photographer: string
  photographer_url: string
  src: {
    large: string
    medium: string
    small: string
  }
  alt: string
}

interface CountryDetail {
  country: string
  iso_a3: string
  official_languages: string
  regional_languages: string
  minority_languages: string
  local_image_path?: string
  pexels_data: PexelsData
}

const allCountryDetails = ref<CountryDetail[]>([])
const imageError = ref(false)

onMounted(async () => {
  try {
    const response = await fetch('/data/country_details_with_pics.json')
    if (response.ok) {
      allCountryDetails.value = await response.json()
    }
  } catch (e) {
    console.error('Failed to load country details', e)
  }
})

const currentCountry = computed(() => {
  if (!allCountryDetails.value.length) return null
  return allCountryDetails.value.find(
    (c) => c.country.toLowerCase() === props.countryName.toLowerCase()
  )
})

const imageUrl = computed(() => {
  if (!currentCountry.value) return null
  if (currentCountry.value.local_image_path) {
    return '/' + currentCountry.value.local_image_path
  }
  return currentCountry.value.pexels_data?.src?.medium ?? null
})

// Reset error state when URL changes
watch(imageUrl, () => {
  imageError.value = false
})
</script>

<template>
  <div class="p-4 flex flex-col items-center gap-4 text-center">
    <h2 class="text-2xl font-heading text-pencil-lead tracking-wide">
      {{ countryName }}
    </h2>

    <div v-if="currentCountry" class="flex flex-col items-center gap-4 w-full">
      <!-- Languages -->
      <div class="text-sm text-pencil-lead/80 flex flex-col gap-1">
        <div v-if="currentCountry.official_languages">
          <span
            class="font-bold uppercase text-xs tracking-wider text-eraser-grey"
            >Official:</span
          >
          {{ currentCountry.official_languages }}
        </div>

        <div v-if="currentCountry.minority_languages">
          <span
            class="font-bold uppercase text-xs tracking-wider text-eraser-grey"
            >Minority:</span
          >
          {{ currentCountry.minority_languages }}
        </div>
      </div>

      <!-- Image from Pexels -->
      <a
        v-if="currentCountry.pexels_data"
        :href="currentCountry.pexels_data.url"
        target="_blank"
        rel="noopener noreferrer"
        class="block w-full max-w-xs aspect-video rounded-2xl border-3 border-pencil-lead overflow-hidden shadow-sm hover:opacity-95 transition-opacity relative group bg-sea-blue/10"
      >
        <!-- Image -->
        <img
          v-if="imageUrl && !imageError"
          :src="imageUrl"
          :alt="currentCountry.pexels_data.alt"
          referrerpolicy="no-referrer"
          @error="
            (e: Event) => {
              console.error('Pexels image failed to load:', imageUrl, e)
              imageError = true
            }
          "
          class="w-full h-full object-cover"
        />

        <!-- Error State / Fallback -->
        <div
          v-if="imageError || !imageUrl"
          class="absolute inset-0 flex items-center justify-center bg-gray-200"
        >
          <span class="text-eraser-grey text-xs">Image unavailable</span>
        </div>

        <div
          class="absolute bottom-0 left-0 right-0 bg-pencil-lead/70 text-paper-white text-[10px] p-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity truncate"
        >
          Photo by {{ currentCountry.pexels_data.photographer }} on Pexels
        </div>
      </a>
    </div>

    <!-- Fallback if no country data -->
    <div
      v-else
      class="w-full max-w-xs aspect-video rounded-2xl border-3 border-pencil-lead bg-sea-blue/10 flex items-center justify-center"
    >
      <span class="text-eraser-grey text-sm font-bold uppercase tracking-wider">
        Image coming soon
      </span>
    </div>
  </div>
</template>
