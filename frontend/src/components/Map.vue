<template>
  <div class="">
    <div id="outer" class="max-w-screen-lg">
      <div id="container" ref="container"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

const mapBorder = '#ffffff'
const mapFill = '#D4D4D8'

onMounted(() => {
  const container = document.getElementById('container')
  const projs = ['equirectangular', 'mercator', 'orthographic']

  if (!container) {
    return
  }

  new Datamap({
    element: container,
    responsive: true,
    projection: projs[1],
    // setProjection: setProj,
    geographyConfig: {
      hideAntarctica: true,
      hideHawaiiAndAlaska: false,
      borderWidth: 1,
      borderOpacity: 1,
      borderColor: mapBorder,
      popupOnHover: true, // True to show the popup while hovering
      highlightOnHover: true,
      highlightFillColor: '#FC8D59',
      highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
      highlightBorderWidth: 2,
      highlightBorderOpacity: 1,
    },

    fills: {
      // defaultFill: '#D4D4D8',
      defaultFill: mapFill,
      wrong: '#ff0000',
      dot: '#000000',
    },
    done: function (map) {
      // map.graticule()

      // responsive
      window.addEventListener('resize', function () {
        map.resize()
      })

      map.updateChoropleth({
        PER: 'black',
      })

      // getCenters()
    },
  })
})
</script>

<style scoped></style>
