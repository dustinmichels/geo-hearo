<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import maplibregl, { LngLatBounds } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  Loader2,
  RefreshCw,
  Globe,
  Map as MapIcon,
  Minimize2,
} from 'lucide-vue-next'
import type { NeCountryProperties, RadioStation } from '../types/geo'

const props = defineProps<{
  guessedCountries?: string[] // List of ADMIN names
  guessColors?: Record<string, string> // ADMIN -> Color
  selectedCountry?: string // ADMIN name
  secretCountry?: string // ADMIN name
  defaultProjection?: 'globe' | 'mercator'
  stations?: RadioStation[]
  areStationsVisible?: boolean
  activeStationId?: string
}>()

const mapContainer = ref<HTMLElement | null>(null)
const map = shallowRef<maplibregl.Map | null>(null)
const loaded = ref(false)
const resizeObserver = shallowRef<ResizeObserver | null>(null)
const showReloadInfo = ref(false)
const isGlobe = ref(false)
let loadingTimeout: ReturnType<typeof setTimeout> | null = null
let spinFrameId: number | null = null
let lastSpinTime = 0
const SPIN_SPEED = 3 // degrees per second

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

// --- Radio Station Logic ---

const getPillarPolygon = (lat: number, lon: number, radiusKm: number) => {
  const dLat = radiusKm / 111.32
  const dLon = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))

  return [
    [
      [lon - dLon, lat - dLat],
      [lon + dLon, lat - dLat],
      [lon + dLon, lat + dLat],
      [lon - dLon, lat + dLat],
      [lon - dLon, lat - dLat],
    ],
  ]
}

const buildStationFeatures = (activeId?: string) => {
  if (!props.stations) return []

  // Group stations by location to detect overlaps
  const locationGroups = new Map<string, number[]>()
  props.stations.forEach((s, i) => {
    const key = `${s.geo_lat},${s.geo_lon}`
    if (!locationGroups.has(key)) locationGroups.set(key, [])
    locationGroups.get(key)!.push(i)
  })

  const features = props.stations.map((s, i) => {
    const baseHeight = 2000000
    const variableHeight = s.place_size
      ? Math.min(s.place_size * 500, 8000000)
      : 2000000
    const height = baseHeight + variableHeight

    // Offset co-located stations so each pillar is visible
    let lat = s.geo_lat
    let lon = s.geo_lon
    const key = `${s.geo_lat},${s.geo_lon}`
    const group = locationGroups.get(key)!
    if (group.length > 1) {
      const idx = group.indexOf(i)
      const angle = (2 * Math.PI * idx) / group.length
      const offsetKm = 20 // spread radius in km
      lat += (offsetKm / 111.32) * Math.sin(angle)
      lon +=
        (offsetKm / (111.32 * Math.cos((s.geo_lat * Math.PI) / 180))) *
        Math.cos(angle)
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: getPillarPolygon(lat, lon, 15),
      },
      properties: {
        name: s.channel_name,
        id: s.channel_id,
        height: height,
      },
    }
  })

  // Move the active station to the end so it renders on top
  if (activeId) {
    const activeIdx = features.findIndex((f) => f.properties.id === activeId)
    if (activeIdx > -1) {
      const [active] = features.splice(activeIdx, 1)
      if (active) {
        features.push(active)
      }
    }
  }

  return features
}

const showRadioStations = () => {
  if (!map.value || !props.stations || props.stations.length === 0) return

  // Cleanup old layers if they exist (especially if type changed from circle)
  if (map.value.getLayer('stations-layer'))
    map.value.removeLayer('stations-layer')
  if (map.value.getSource('stations-source'))
    map.value.removeSource('stations-source')

  const sourceData = {
    type: 'FeatureCollection',
    features: buildStationFeatures(props.activeStationId),
  }

  // Add source
  map.value.addSource('stations-source', {
    type: 'geojson',
    data: sourceData as any,
  })

  // Add extrusions layer (Light Beams)
  map.value.addLayer({
    id: 'stations-layer',
    type: 'fill-extrusion',
    source: 'stations-source',
    paint: {
      'fill-extrusion-color': [
        'case',
        ['==', ['get', 'id'], props.activeStationId || ''],
        '#f472b6', // Active: Pink
        '#facc15', // Default: Yellow
      ],
      'fill-extrusion-height': [
        'case',
        ['==', ['get', 'id'], props.activeStationId || ''],
        ['*', ['get', 'height'], 1.5],
        ['get', 'height'],
      ],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.8,
    },
    layout: {
      visibility: 'visible',
    },
  })

  // Zoom to stations
  const bounds = new LngLatBounds()
  props.stations.forEach((s) => {
    bounds.extend([s.geo_lon, s.geo_lat])
  })

  // Pad bounds slightly
  // Push content up with larger bottom padding to leave empty space below (e.g. for UI overlays)
  map.value.fitBounds(bounds, {
    padding: { top: 50, bottom: 200, left: 50, right: 50 },
    maxZoom: 6,
    duration: 1500,
  })

  // Since we interacted, stop spinning
  stopSpinning()
}

const hideRadioStations = () => {
  if (!map.value || !map.value.getLayer('stations-layer')) return
  map.value.setLayoutProperty('stations-layer', 'visibility', 'none')
}

// Watch stations to show/update them
watch(
  () => props.stations,
  (newStations) => {
    if (
      newStations &&
      newStations.length > 0 &&
      props.areStationsVisible !== false
    ) {
      showRadioStations()
    } else if (!newStations || newStations.length === 0) {
      hideRadioStations()
    }
  },
  { deep: true }
)

// Watch visibility prop
watch(
  () => props.areStationsVisible,
  (isVisible) => {
    if (isVisible) {
      showRadioStations()
    } else {
      hideRadioStations()
    }
  }
)

// Watch active station to update colors and reorder so active is on top
watch(
  () => props.activeStationId,
  (newId) => {
    if (!map.value || !map.value.getLayer('stations-layer')) return

    map.value.setPaintProperty('stations-layer', 'fill-extrusion-color', [
      'case',
      ['==', ['get', 'id'], newId || ''],
      '#f472b6',
      '#facc15',
    ])

    // Make the active pillar taller
    map.value.setPaintProperty('stations-layer', 'fill-extrusion-height', [
      'case',
      ['==', ['get', 'id'], newId || ''],
      ['*', ['get', 'height'], 1.5],
      ['get', 'height'],
    ])

    // Reorder features so the active station renders on top
    const source = map.value.getSource('stations-source') as any
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: buildStationFeatures(newId),
      })
    }
  }
)

onMounted(() => {
  if (!mapContainer.value) return

  // Default to globe on mobile, flat map on desktop
  if (props.defaultProjection) {
    isGlobe.value = props.defaultProjection === 'globe'
  } else {
    isGlobe.value = window.innerWidth < 768
  }

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
        projection: { type: isGlobe.value ? 'globe' : 'mercator' },
        sources: {},
        layers: [],
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sky: isGlobe.value
          ? {
              'atmosphere-blend': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                1,
                5,
                1,
                7,
                0,
              ],
            }
          : {},
      },
      center: [0, 20],
      zoom: 1.5,
      minZoom: isGlobe.value ? 1.5 : undefined,
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

      // If stations already exist on load
      if (
        props.stations &&
        props.stations.length > 0 &&
        props.areStationsVisible !== false
      ) {
        showRadioStations()
      }
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

  // Add background layer (handles oceans and space)
  map.value.addLayer({
    id: 'background',
    type: 'background',
    paint: {
      'background-color': isGlobe.value ? '#0f172a' : '#ffffff', // Navy for globe, White for flat
      'background-color-transition': { duration: 200 },
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

  // Add secret debug layer - initially hidden
  map.value.addLayer({
    id: 'countries-secret',
    type: 'fill',
    source: 'countries',
    paint: {
      'fill-color': '#00ffff',
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
      'line-color': isGlobe.value ? '#e2e8f0' : '#000000', // Light for globe, Black for flat
      'line-width': 1.5,
      'line-color-transition': { duration: 500 },
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

  // Stop spin permanently on first user interaction
  map.value.on('mousedown', stopSpinning)
  map.value.on('touchstart', stopSpinning)
  map.value.on('wheel', stopSpinning)

  // Start idle spin
  startSpinning()
}

// --- Idle globe spin ---
const spinGlobe = (timestamp: number) => {
  if (!map.value || !isGlobe.value) {
    spinFrameId = null
    return
  }

  if (lastSpinTime === 0) lastSpinTime = timestamp
  const delta = (timestamp - lastSpinTime) / 1000 // seconds
  lastSpinTime = timestamp

  const center = map.value.getCenter()
  center.lng -= SPIN_SPEED * delta
  map.value.setCenter(center)

  spinFrameId = requestAnimationFrame(spinGlobe)
}

const startSpinning = () => {
  if (!isGlobe.value || spinFrameId != null) return
  lastSpinTime = 0
  spinFrameId = requestAnimationFrame(spinGlobe)
}

const stopSpinning = () => {
  if (spinFrameId != null) {
    cancelAnimationFrame(spinFrameId)
    spinFrameId = null
  }
}

const toggleProjection = () => {
  if (!map.value) return
  stopSpinning()
  isGlobe.value = !isGlobe.value
  map.value.setProjection({
    type: isGlobe.value ? 'globe' : 'mercator',
  })

  // Update styles based on projection
  if (map.value.getLayer('background')) {
    map.value.setPaintProperty(
      'background',
      'background-color',
      isGlobe.value ? '#0f172a' : '#ffffff'
    )
  }

  if (map.value.getLayer('countries-border')) {
    map.value.setPaintProperty(
      'countries-border',
      'line-color',
      isGlobe.value ? '#e2e8f0' : '#000000'
    )
  }

  // Toggle atmosphere
  map.value.setSky(
    isGlobe.value
      ? {
          'atmosphere-blend': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            1,
            5,
            1,
            7,
            0,
          ],
        }
      : {}
  )
}

const resetView = () => {
  if (!map.value) return
  stopSpinning()

  // Switch to globe if not already
  if (!isGlobe.value) {
    isGlobe.value = true
    map.value.setProjection({ type: 'globe' })
    if (map.value.getLayer('background')) {
      map.value.setPaintProperty('background', 'background-color', '#0f172a')
    }
    if (map.value.getLayer('countries-border')) {
      map.value.setPaintProperty('countries-border', 'line-color', '#e2e8f0')
    }
    map.value.setSky({
      'atmosphere-blend': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0,
        1,
        5,
        1,
        7,
        0,
      ],
    })
  }

  map.value.easeTo({
    center: [0, 20],
    zoom: 1.5,
    duration: 800,
  })

  map.value.once('moveend', () => {
    startSpinning()
  })
}

// Manual reload function
const reloadMap = () => {
  initMap()
}

defineExpose({ resetView })

onUnmounted(() => {
  stopSpinning()
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
      class="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10 w-full h-full gap-3"
    >
      <div class="flex items-center gap-2 text-slate-500">
        <Loader2 class="w-5 h-5 animate-spin" />
        <span class="text-sm font-body">Map loading</span>
      </div>
      <div
        v-if="showReloadInfo"
        class="flex flex-col items-center gap-2 animate-in fade-in duration-500"
      >
        <p class="text-slate-400 text-xs">Taking a while?</p>
        <button
          @click="reloadMap"
          class="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span>Reload</span>
        </button>
      </div>
    </div>
    <div
      ref="mapContainer"
      class="w-full h-full"
      :style="{
        background: isGlobe
          ? 'radial-gradient(ellipse at 50% 50%, #1e2d4a 0%, #111827 40%, #070b14 100%)'
          : '#ffffff',
      }"
    />

    <!-- Map Controls -->
    <div v-if="loaded" class="absolute top-4 left-4 z-[5] flex flex-col gap-2">
      <button
        @click="toggleProjection"
        class="p-2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
        :title="isGlobe ? 'Switch to Flat Map' : 'Switch to Globe'"
      >
        <MapIcon v-if="isGlobe" class="w-5 h-5" />
        <Globe v-else class="w-5 h-5" />
      </button>
      <button
        @click="resetView"
        class="p-2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
        title="Zoom out"
      >
        <Minimize2 class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* MapLibre attribution is kept visible for license compliance */
</style>
