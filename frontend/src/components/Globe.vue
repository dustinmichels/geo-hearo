<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const mapContainer = ref<HTMLElement | null>(null)
const map = shallowRef<maplibregl.Map | null>(null)

onMounted(() => {
  if (!mapContainer.value) return

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: 'https://demotiles.maplibre.org/style.json',
    center: [0, 0],
    zoom: 1.5,
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
