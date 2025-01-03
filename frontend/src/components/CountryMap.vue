<template>
  <div id="map" ref="mapContainer"></div>
</template>

<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onMounted, ref } from 'vue'
// import countriesData from './countries.geojson' // Adjust the path to your GeoJSON file

const mapContainer = ref<HTMLDivElement | null>(null)

onMounted(() => {
  if (mapContainer.value) {
    // Initialize the map
    const map = L.map(mapContainer.value).setView([20, 0], 2)

    // Add a minimal basemap
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      }
    ).addTo(map)

    // Add country boundaries from GeoJSON
    // L.geoJSON(countriesData, {
    //   style: {
    //     color: '#3388ff', // Boundary color
    //     weight: 1.5, // Line thickness
    //     fillOpacity: 0.1, // Slight fill transparency
    //   },
    // }).addTo(map)
  }
})
</script>

<style>
/* Optional: Adjust map container styling */
#map {
  height: 100vh;
  width: 100%;
}
</style>
