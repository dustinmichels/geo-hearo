<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Loader2, RefreshCw, Globe, Map as MapIcon } from 'lucide-vue-next'
import type { NeCountryProperties } from '../types/geo'

const props = defineProps<{
  guessedCountries?: string[] // List of ADMIN names
  guessColors?: Record<string, string> // ADMIN -> Color
  selectedCountry?: string // ADMIN name
  secretCountry?: string // ADMIN name
}>()

const mapContainer = ref<HTMLElement | null>(null)
const map = shallowRef<maplibregl.Map | null>(null)
const loaded = ref(false)
const resizeObserver = shallowRef<ResizeObserver | null>(null)
const showReloadInfo = ref(false)
const isGlobe = ref(true)
let loadingTimeout: ReturnType<typeof setTimeout> | null = null

const emit = defineEmits<{
  (e: 'select-country', admin: string): void
}>()

// Update map filter when guesses change
watch(
  () => props.guessedCountries,
  (newGuesses) => {
    if (!map.value || !map.value.getLayer('countries-guessed')) return

    if (newGuesses && newGuesses.length > 0) {
      map.value.setFilter('countries-guessed', ['in', 'ADMIN', ...newGuesses])
    } else {
      map.value.setFilter('countries-guessed', ['in', 'ADMIN', '']) // Hide all
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
      const matchExpression: any[] = ['match', ['get', 'ADMIN']]
      for (const [countryAdmin, color] of Object.entries(newColors)) {
        matchExpression.push(countryAdmin, color)
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
      map.value.setFilter('countries-highlight', ['==', 'ADMIN', newSelected])
    } else {
      map.value.setFilter('countries-highlight', ['==', 'ADMIN', ''])
    }
  }
)

// Update secret highlight
watch(
  () => props.secretCountry,
  (newSecret) => {
    if (!map.value || !map.value.getLayer('countries-secret')) return

    if (newSecret) {
      map.value.setFilter('countries-secret', ['==', 'ADMIN', newSecret])
    } else {
      map.value.setFilter('countries-secret', ['==', 'ADMIN', ''])
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
        projection: { type: 'globe' },
        sources: {},
        layers: [],
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
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
        promoteId: 'ADMIN', // Use ADMIN as ID
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

  // Add satellite imagery source
  map.value.addSource('esri-satellite', {
    type: 'raster',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    ],
    tileSize: 256,
    attribution: 'Tiles &copy; Esri',
  })

  // Add satellite imagery layer
  map.value.addLayer({
    id: 'satellite',
    type: 'raster',
    source: 'esri-satellite',
  })

  // Add countries fill layer (grey)
  map.value.addLayer({
    id: 'countries-fill',
    type: 'fill',
    source: 'countries',
    paint: {
      'fill-color': '#cbd5e1', // slate-300
      'fill-opacity': 0,
    },
  })

  // Prepare initial match expression if colors exist
  let initialFillColor: any = '#86efac'
  if (props.guessColors && Object.keys(props.guessColors).length > 0) {
    const matchExpression: any[] = ['match', ['get', 'ADMIN']]
    for (const [countryAdmin, color] of Object.entries(props.guessColors)) {
      matchExpression.push(countryAdmin, color)
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
    filter: ['in', 'ADMIN', ...(props.guessedCountries || [])],
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
    filter: ['==', 'ADMIN', props.selectedCountry || ''],
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
    filter: ['==', 'ADMIN', props.secretCountry || ''],
  })

  // Add countries border layer
  map.value.addLayer({
    id: 'countries-border',
    type: 'line',
    source: 'countries',
    paint: {
      'line-color': '#e2e8f0', // slate-200
      'line-width': 1.5,
    },
  })

  // Add country labels
  map.value.addLayer({
    id: 'countries-label',
    type: 'symbol',
    source: 'countries',
    minzoom: 3,
    layout: {
      'text-field': ['get', 'ADMIN'],
      'text-font': ['Open Sans Semibold'],
      'text-size': 12,
      'text-variable-anchor': ['center'],
    },
    paint: {
      'text-color': '#f1f5f9', // slate-100
      'text-halo-color': '#0f172a', // slate-900 (dark halo for contrast)
      'text-halo-width': 1.5,
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

    const props = feature.properties as NeCountryProperties | undefined
    if (props && props.ADMIN) {
      emit('select-country', props.ADMIN)
    } else {
      console.warn('Click on country with no ADMIN property:', feature)
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

const toggleProjection = () => {
  if (!map.value) return
  isGlobe.value = !isGlobe.value
  map.value.setProjection({
    type: isGlobe.value ? 'globe' : 'mercator',
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

    <!-- Projection Toggle -->
    <button
      v-if="loaded"
      @click="toggleProjection"
      class="absolute top-4 left-4 z-[5] p-2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
      :title="isGlobe ? 'Switch to Flat Map' : 'Switch to Globe'"
    >
      <MapIcon v-if="isGlobe" class="w-5 h-5" />
      <Globe v-else class="w-5 h-5" />
    </button>
  </div>
</template>

<style scoped>
/* MapLibre attribution is kept visible for license compliance */
</style>
