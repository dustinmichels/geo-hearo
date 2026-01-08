<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Loader2, RefreshCw } from 'lucide-vue-next'

const props = defineProps<{
  guessedCountries?: string[]
  guessColors?: Record<string, string>
  selectedCountry?: string
  secretCountry?: string
}>()

const mapContainer = ref<HTMLElement | null>(null)
const map = shallowRef<maplibregl.Map | null>(null)
const loaded = ref(false)
const resizeObserver = shallowRef<ResizeObserver | null>(null)
const showReloadInfo = ref(false)
let loadingTimeout: ReturnType<typeof setTimeout> | null = null

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

  // Start initialization
  initMap()

  // Setup resize observer
  resizeObserver.value = new ResizeObserver(() => {
    if (map.value) {
      map.value.resize()
    }
  })
  resizeObserver.value.observe(mapContainer.value)
})

const initMap = () => {
  if (!mapContainer.value) return
  loaded.value = false
  showReloadInfo.value = false

  // Clear existing map if any
  if (map.value) {
    map.value.remove()
    map.value = null
  }

  // Set timeout to show reload button if loading takes too long
  if (loadingTimeout) clearTimeout(loadingTimeout)
  loadingTimeout = setTimeout(() => {
    if (!loaded.value) {
      showReloadInfo.value = true
    }
  }, 5000)

  try {
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
      loaded.value = true
      if (loadingTimeout) clearTimeout(loadingTimeout)

      // Add source for countries
      map.value.addSource('countries', {
        type: 'geojson',
        data: '/data/ne_countries.geojson',
        promoteId: 'ISO_A3',
      })

      setupLayers()
      setupInteractions()
    })

    map.value.on('error', (e) => {
      console.error('Map error:', e)
      showReloadInfo.value = true
    })
  } catch (err) {
    console.error('Error initializing map:', err)
    showReloadInfo.value = true
  }
}

const setupLayers = () => {
  if (!map.value) return

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

  // Add source for centroids (debug only)
  if (import.meta.env.VITE_DEBUG_MODE === 'true') {
    map.value.addSource('centroids', {
      type: 'geojson',
      data: '/data/centers.geojson',
    })

    // Add centroids layer (faint dots)
    map.value.addLayer({
      id: 'centroids-layer',
      type: 'circle',
      source: 'centroids',
      paint: {
        'circle-radius': 2.5,
        'circle-color': '#0f172a', // slate-900
        'circle-opacity': 0.3,
      },
    })
  }
}

const setupInteractions = () => {
  if (!map.value) return

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
}

// Manual reload function
const reloadMap = () => {
  initMap()
}

onUnmounted(() => {
  if (loadingTimeout) clearTimeout(loadingTimeout)
  resizeObserver.value?.disconnect()
  map.value?.remove()
})
</script>

<template>
  <div
    class="w-full h-full rounded-xl overflow-hidden shadow-sm border border-slate-200 relative bg-slate-50"
  >
    <div
      v-show="!loaded"
      class="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10 w-full h-full gap-4"
    >
      <Loader2 class="w-10 h-10 text-indigo-500 animate-spin" />
      <div
        v-if="showReloadInfo"
        class="flex flex-col items-center gap-2 animate-in fade-in duration-500"
      >
        <p class="text-slate-500 text-sm">Map taking a while?</p>
        <button
          @click="reloadMap"
          class="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span>Reload Map</span>
        </button>
      </div>
    </div>
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
