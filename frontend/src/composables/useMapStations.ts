import type { ShallowRef } from 'vue'
import { watch } from 'vue'
import type maplibregl from 'maplibre-gl'
import { type GeoJSONSource, LngLatBounds } from 'maplibre-gl'
import type { RadioStation } from '../types/geo'

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

interface StationProps {
  stations?: RadioStation[]
  activeStationId?: string
  areStationsVisible?: boolean
}

interface StationCallbacks {
  stopSpinning: () => void
}

export function useMapStations(
  map: ShallowRef<maplibregl.Map | null>,
  props: StationProps,
  callbacks: StationCallbacks
) {
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
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
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

  const handleStationZoom = () => {
    if (!map.value || !map.value.getSource('stations-source')) return
    const zoom = map.value.getZoom()
    const source = map.value.getSource('stations-source') as GeoJSONSource
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: buildStationFeatures(props.activeStationId, zoom),
      })
    }
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
      type: 'FeatureCollection' as const,
      features: buildStationFeatures(props.activeStationId, zoom),
    }

    map.value.addSource('stations-source', {
      type: 'geojson',
      data: sourceData,
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
      callbacks.stopSpinning()
    }

  }

  // Register zoom handler once — it early-returns when there's no source
  let zoomHandlerRegistered = false
  const ensureZoomHandler = () => {
    if (zoomHandlerRegistered || !map.value) return
    map.value.on('zoom', handleStationZoom)
    zoomHandlerRegistered = true
  }

  // Watch stations data to rebuild the layer
  watch(
    () => props.stations,
    (newStations) => {
      if (newStations && newStations.length > 0) {
        updateStationsLayer()
        ensureZoomHandler()
      } else {
        setStationsVisibility(false)
      }
    }
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

      // Reorder features so the active station renders on top
      const source = map.value.getSource('stations-source') as GeoJSONSource
      if (source) {
        const zoom = map.value.getZoom()
        source.setData({
          type: 'FeatureCollection',
          features: buildStationFeatures(newId, zoom),
        })
      }
    }
  )

  const cleanup = () => {
    map.value?.off('zoom', handleStationZoom)
  }

  return { updateStationsLayer, cleanup }
}
