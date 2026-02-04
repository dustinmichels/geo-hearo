<script setup lang="ts">
import {
  Globe,
  Loader2,
  Map as MapIcon,
  Minimize2,
  RefreshCw,
} from 'lucide-vue-next'
import maplibregl, { LngLatBounds } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
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
  showTiles?: boolean
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
      if (map.value.getLayer('countries-guessed-border'))
        map.value.setFilter('countries-guessed-border', [
          'in',
          'ADMIN',
          ...newGuesses,
        ])
    } else {
      map.value.setFilter('countries-guessed', ['in', 'ADMIN', '']) // Hide all
      if (map.value.getLayer('countries-guessed-border'))
        map.value.setFilter('countries-guessed-border', ['in', 'ADMIN', ''])
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
      if (map.value.getLayer('countries-highlight-border'))
        map.value.setFilter('countries-highlight-border', [
          '==',
          'ADMIN',
          newSelected,
        ])
    } else {
      map.value.setFilter('countries-highlight', ['==', 'ADMIN', ''])
      if (map.value.getLayer('countries-highlight-border'))
        map.value.setFilter('countries-highlight-border', ['==', 'ADMIN', ''])
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
      if (map.value.getLayer('countries-secret-border'))
        map.value.setFilter('countries-secret-border', [
          '==',
          'ADMIN',
          newSecret,
        ])
    } else {
      map.value.setFilter('countries-secret', ['==', 'ADMIN', ''])
      if (map.value.getLayer('countries-secret-border'))
        map.value.setFilter('countries-secret-border', ['==', 'ADMIN', ''])
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

const getZoomScaleFactor = (zoom: number): number => {
  // At zoom 3 (globe/continent view), scale = 1 (current size)
  // Halves for each zoom level increase, doubles for each decrease
  return Math.pow(2, 3 - zoom)
}

// zoomHeightExpression removed - height scaling is now handled in buildStationFeatures

const buildStationFeatures = (activeId?: string, zoom?: number) => {
  if (!props.stations) return []

  const scale = zoom != null ? getZoomScaleFactor(zoom) : 1
  const scaledRadius = Math.max(15 * scale, 1.5)
  const scaledOffset = Math.max(20 * scale, 3.5)

  // Group stations by location to detect overlaps
  const locationGroups = new Map<string, number[]>()
  props.stations.forEach((s, i) => {
    const key = `${s.geo_lat},${s.geo_lon}`
    if (!locationGroups.has(key)) locationGroups.set(key, [])
    locationGroups.get(key)!.push(i)
  })

  const features = props.stations.map((s, i) => {
    const baseHeight = 600000
    const variableHeight = s.place_size
      ? Math.min(s.place_size * 100, 2000000)
      : 600000
    let height = (baseHeight + variableHeight) * scale

    if (activeId && s.channel_id === activeId) {
      height *= 1.5
    }

    // Offset co-located stations so each pillar is visible
    let lat = s.geo_lat
    let lon = s.geo_lon
    const key = `${s.geo_lat},${s.geo_lon}`
    const group = locationGroups.get(key)!
    if (group.length > 1) {
      const idx = group.indexOf(i)
      const angle = (2 * Math.PI * idx) / group.length
      const offsetKm = scaledOffset
      lat += (offsetKm / 111.32) * Math.sin(angle)
      lon +=
        (offsetKm / (111.32 * Math.cos((s.geo_lat * Math.PI) / 180))) *
        Math.cos(angle)
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: getPillarPolygon(lat, lon, scaledRadius),
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

const updateStationsLayer = () => {
  if (!map.value || !props.stations || props.stations.length === 0) return

  // Remove old layer/source if they exist
  if (map.value.getLayer('stations-layer'))
    map.value.removeLayer('stations-layer')
  if (map.value.getSource('stations-source'))
    map.value.removeSource('stations-source')

  const zoom = map.value.getZoom()
  const sourceData = {
    type: 'FeatureCollection',
    features: buildStationFeatures(props.activeStationId, zoom),
  }

  map.value.addSource('stations-source', {
    type: 'geojson',
    data: sourceData as any,
  })

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
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.8,
    },
    layout: {
      visibility: props.areStationsVisible !== false ? 'visible' : 'none',
    },
  })

  // Zoom to stations if visible
  if (props.areStationsVisible !== false) {
    zoomToStations()
    stopSpinning()
  }

  // Register zoom handler to scale pillar width with zoom
  map.value.off('zoom', handleStationZoom)
  map.value.on('zoom', handleStationZoom)
}

const handleStationZoom = () => {
  if (!map.value || !map.value.getSource('stations-source')) return
  const zoom = map.value.getZoom()
  const source = map.value.getSource('stations-source') as any
  if (source) {
    source.setData({
      type: 'FeatureCollection',
      features: buildStationFeatures(props.activeStationId, zoom),
    })
  }
}

const zoomToStations = () => {
  if (!map.value || !props.stations || props.stations.length === 0) return
  const bounds = new LngLatBounds()
  props.stations.forEach((s) => bounds.extend([s.geo_lon, s.geo_lat]))

  // Use a pitch to make the 3D pillars visible
  // Increase padding to ensure they aren't cut off at the edges
  map.value.fitBounds(bounds, {
    padding: { top: 200, bottom: 200, left: 100, right: 100 },
    maxZoom: 8,
    pitch: 60,
  })
}

const setStationsVisibility = (visible: boolean) => {
  if (!map.value || !map.value.getLayer('stations-layer')) return
  map.value.setLayoutProperty(
    'stations-layer',
    'visibility',
    visible ? 'visible' : 'none'
  )
}

const setTilesVisibility = (visible: boolean) => {
  if (!map.value) return

  // Helper to safely set visibility
  const setLayerVisibility = (layerId: string, isVisible: boolean) => {
    if (map.value && map.value.getLayer(layerId)) {
      map.value.setLayoutProperty(
        layerId,
        'visibility',
        isVisible ? 'visible' : 'none'
      )
    }
  }

  // Toggle terrain tiles
  if (map.value.getLayer('esri-terrain-layer')) {
    map.value.setLayoutProperty(
      'esri-terrain-layer',
      'visibility',
      visible ? 'visible' : 'none'
    )
  }

  // Hide base country fill
  setLayerVisibility('countries-fill', !visible)

  // Hide global country borders
  setLayerVisibility('countries-border', !visible)

  // Hide labels when tiles are shown
  setLayerVisibility('countries-label', !visible)

  // Hide guessed countries polygons
  setLayerVisibility('countries-guessed', !visible)
  setLayerVisibility('countries-guessed-border', !visible)

  // Hide highlighted (selected) country
  setLayerVisibility('countries-highlight', !visible)
  setLayerVisibility('countries-highlight-border', !visible)

  // Secret Country Styling
  if (map.value.getLayer('countries-secret')) {
    // Transparent fill when finished (visible=true), Green fill otherwise
    map.value.setPaintProperty(
      'countries-secret',
      'fill-opacity',
      visible ? 0 : 1
    )
  }

  if (map.value.getLayer('countries-secret-border')) {
    // Green border when finished, White otherwise
    map.value.setPaintProperty(
      'countries-secret-border',
      'line-color',
      visible ? '#4ade80' : '#ffffff'
    )
    // Ensure the border width is visible enough
    map.value.setPaintProperty(
      'countries-secret-border',
      'line-width',
      visible ? 3 : 1.5
    )
  }
}

// Watch tiles visibility prop
watch(
  () => props.showTiles,
  (isVisible) => {
    setTilesVisibility(!!isVisible)
  }
)

// Watch stations data to rebuild the layer
watch(
  () => props.stations,
  (newStations) => {
    if (newStations && newStations.length > 0) {
      updateStationsLayer()
    } else {
      setStationsVisibility(false)
    }
  },
  { deep: true }
)

// Watch visibility prop to toggle layer visibility and zoom to stations
watch(
  () => props.areStationsVisible,
  (isVisible) => {
    setStationsVisibility(!!isVisible)
    if (isVisible) {
      zoomToStations()
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

    // Height is now handled in buildStationFeatures and updated via setData below

    // Reorder features so the active station renders on top
    const source = map.value.getSource('stations-source') as any
    if (source) {
      const zoom = map.value.getZoom()
      source.setData({
        type: 'FeatureCollection',
        features: buildStationFeatures(newId, zoom),
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
      if (props.stations && props.stations.length > 0) {
        updateStationsLayer()
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

  // Add ESRI Terrain Source
  map.value.addSource('esri-terrain', {
    type: 'raster',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    ],
    tileSize: 256,
    attribution: 'Tiles © Esri',
  })

  // Add ESRI Terrain Layer (initially hidden)
  map.value.addLayer({
    id: 'esri-terrain-layer',
    type: 'raster',
    source: 'esri-terrain',
    minzoom: 0,
    maxzoom: 22,
    layout: {
      visibility: props.showTiles ? 'visible' : 'none',
    },
    paint: {
      'raster-opacity': 1,
    },
  })

  // Add countries fill layer (grey)
  map.value.addLayer({
    id: 'countries-fill',
    type: 'fill',
    source: 'countries',
    paint: {
      'fill-color': '#cbd5e1', // slate-300
      'fill-opacity': props.showTiles ? 0 : 1,
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
      'fill-color': '#4ade80',
      'fill-opacity': 1,
    },
    filter: ['==', 'ADMIN', props.secretCountry || ''],
  })

  // Add countries border layer (default: muted border)
  map.value.addLayer({
    id: 'countries-border',
    type: 'line',
    source: 'countries',
    paint: {
      'line-color': isGlobe.value ? '#94a3b8' : '#64748b', // slate-400 for globe, slate-500 for flat
      'line-width': 1.5,
      'line-color-transition': { duration: 500 },
    },
  })

  // White border for guessed countries
  map.value.addLayer({
    id: 'countries-guessed-border',
    type: 'line',
    source: 'countries',
    paint: {
      'line-color': '#ffffff',
      'line-width': 1.5,
    },
    filter: ['in', 'ADMIN', ...(props.guessedCountries || [])],
  })

  // White border for highlighted (selected) country
  map.value.addLayer({
    id: 'countries-highlight-border',
    type: 'line',
    source: 'countries',
    paint: {
      'line-color': '#ffffff',
      'line-width': 1.5,
    },
    filter: ['==', 'ADMIN', props.selectedCountry || ''],
  })

  // White border for secret debug country
  map.value.addLayer({
    id: 'countries-secret-border',
    type: 'line',
    source: 'countries',
    paint: {
      'line-color': '#ffffff',
      'line-width': 1.5,
    },
    filter: ['==', 'ADMIN', props.secretCountry || ''],
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

  // Apply initial visibility state
  setTilesVisibility(!!props.showTiles)
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
      isGlobe.value ? '#94a3b8' : '#64748b'
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
      map.value.setPaintProperty('countries-border', 'line-color', '#94a3b8')
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
    pitch: 0,
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
  map.value?.off('zoom', handleStationZoom)
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
        background: isGlobe ? 'transparent' : '#ffffff',
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
