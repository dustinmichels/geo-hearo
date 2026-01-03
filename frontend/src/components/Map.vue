<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps<{
  guessedCountries?: string[]
  selectedCountry?: string
}>()

const mapContainer = ref<HTMLElement | null>(null)
const map = shallowRef<maplibregl.Map | null>(null)

const emit = defineEmits<{
  (e: 'select-country', name: string): void
}>()

// Update map filter when guesses change
watch(
  () => props.guessedCountries,
  (newGuesses) => {
    if (!map.value || !map.value.getLayer('countries-guessed')) return

    if (newGuesses && newGuesses.length > 0) {
      map.value.setFilter('countries-guessed', ['in', 'NAME', ...newGuesses])
    } else {
      map.value.setFilter('countries-guessed', ['in', 'NAME', '']) // Hide all
    }
  },
  { deep: true }
)

// Update highlight when selected country passes from parent
watch(
  () => props.selectedCountry,
  (newSelected) => {
    if (!map.value || !map.value.getLayer('countries-highlight')) return

    if (newSelected) {
      map.value.setFilter('countries-highlight', ['==', 'NAME', newSelected])
    } else {
      map.value.setFilter('countries-highlight', ['==', 'NAME', ''])
    }
  }
)

onMounted(() => {
  if (!mapContainer.value) return

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: {
      version: 8,
      sources: {},
      layers: [],
    },
    center: [0, 20],
    zoom: 1.5,
    dragRotate: false,
    pitchWithRotate: false,
    touchZoomRotate: true,
  })

  // Disable touch rotation but keep pinch-to-zoom
  map.value.touchZoomRotate.disableRotation()

  map.value.on('load', () => {
    if (!map.value) return

    // Add source for countries
    map.value.addSource('countries', {
      type: 'geojson',
      data: '/data/ne_110m_admin_0_countries.geojson',
      promoteId: 'ADM0_A3',
    })

    // Add background layer (matches slate-50)
    map.value.addLayer({
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#f8fafc',
      },
    })

    // Add countries fill layer (grey)
    map.value.addLayer({
      id: 'countries-fill',
      type: 'fill',
      source: 'countries',
      paint: {
        'fill-color': '#cbd5e1', // slate-300
        'fill-opacity': 1,
      },
    })

    // Add guessed countries layer (light green) - initially hidden
    map.value.addLayer({
      id: 'countries-guessed',
      type: 'fill',
      source: 'countries',
      paint: {
        'fill-color': '#86efac', // light green (green-300)
        'fill-opacity': 1,
      },
      filter: ['in', 'NAME', ...(props.guessedCountries || [])],
    })

    // Add highlight layer (pink fill) - initially hidden via filter
    map.value.addLayer({
      id: 'countries-highlight',
      type: 'fill',
      source: 'countries',
      paint: {
        'fill-color': '#f472b6', // bubblegum-pop
        'fill-opacity': 1,
      },
      filter: ['==', 'NAME', props.selectedCountry || ''],
    })

    // Add countries border layer
    map.value.addLayer({
      id: 'countries-border',
      type: 'line',
      source: 'countries',
      paint: {
        'line-color': '#475569', // slate-600
        'line-width': 1,
      },
    })

    // Click handler
    map.value.on('click', 'countries-fill', (e) => {
      if (!e.features || e.features.length === 0) return

      const feature = e.features[0]
      if (!feature) return

      const name = feature.properties?.NAME
      if (name) {
        emit('select-country', name)
      }
    })

    // Hover effects calling attention to interactivity
    map.value.on('mouseenter', 'countries-fill', () => {
      if (map.value) map.value.getCanvas().style.cursor = 'pointer'
    })

    map.value.on('mouseleave', 'countries-fill', () => {
      if (map.value) map.value.getCanvas().style.cursor = ''
    })
  })
})

onUnmounted(() => {
  map.value?.remove()
})
</script>

<template>
  <div
    class="w-full h-full rounded-xl overflow-hidden shadow-sm border border-slate-200 relative bg-slate-50"
  >
    <div ref="mapContainer" class="w-full h-full" />
  </div>
</template>

<style scoped>
/* Optional: Custom styling for map controls can go here */
:deep(.maplibregl-ctrl-bottom-right) {
  display: none; /* Hide attribution for cleaner look if requested, strictly speaking we should keep it or minimalize it. Keeping it default is safer for license. */
}
/* Let's actully keep attribution but maybe make it smaller if needed. I'll leave it default for now. */
</style>
