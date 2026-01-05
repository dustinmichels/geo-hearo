<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps<{
  guessedCountries?: string[]
  guessColors?: Record<string, string>
  selectedCountry?: string
  secretCountry?: string
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

// Update guessed countries colors
watch(
  () => props.guessColors,
  (newColors) => {
    if (!map.value || !map.value.getLayer('countries-guessed') || !newColors)
      return

    let fillColor: any = '#86efac'
    if (Object.keys(newColors).length > 0) {
      const matchExpression: any[] = ['match', ['get', 'NAME']]
      for (const [country, color] of Object.entries(newColors)) {
        matchExpression.push(country, color)
      }
      matchExpression.push('#86efac') // Default fallback color
      fillColor = matchExpression
    }

    map.value.setPaintProperty('countries-guessed', 'fill-color', fillColor)
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

// Update secret highlight
watch(
  () => props.secretCountry,
  (newSecret) => {
    if (!map.value || !map.value.getLayer('countries-secret')) return

    if (newSecret) {
      map.value.setFilter('countries-secret', ['==', 'NAME', newSecret])
    } else {
      map.value.setFilter('countries-secret', ['==', 'NAME', ''])
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
    keyboard: false,
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

    // Prepare initial match expression if colors exist
    let initialFillColor: any = '#86efac'
    if (props.guessColors && Object.keys(props.guessColors).length > 0) {
      const matchExpression: any[] = ['match', ['get', 'NAME']]
      for (const [country, color] of Object.entries(props.guessColors)) {
        matchExpression.push(country, color)
      }
      matchExpression.push('#86efac') // Default fallback
      initialFillColor = matchExpression
    }

    // Add guessed countries layer (colored) - initially hidden via filter
    map.value.addLayer({
      id: 'countries-guessed',
      type: 'fill',
      source: 'countries',
      paint: {
        'fill-color': initialFillColor,
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

    // Add secret debug layer (red fill) - initially hidden
    map.value.addLayer({
      id: 'countries-secret',
      type: 'fill',
      source: 'countries',
      paint: {
        'fill-color': '#ef4444', // red-500
        'fill-opacity': 1,
      },
      filter: ['==', 'NAME', props.secretCountry || ''],
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
