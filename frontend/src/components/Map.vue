<template>
  <div class="">
    <div id="outer" class="max-w-screen-lg">
      <div id="container" ref="container"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Datamap from 'datamaps'
import { onMounted, watch } from 'vue'
import { Country } from '../types'

const props = defineProps<{
  guessed: Country[]
  secretCountry: Country
}>()

const mapBorder = '#ffffff'
const mapFill = '#D4D4D8'

let map: Datamap

// const projs = ['equirectangular', 'mercator', 'orthographic']

onMounted(() => {
  map = new window.Datamap({
    element: document.getElementById('container'),
    responsive: true,
    projection: 'mercator',
    geographyConfig: {
      hideAntarctica: true,
      hideHawaiiAndAlaska: false,
      borderWidth: 1,
      borderOpacity: 1,
      borderColor: mapBorder,
      popupOnHover: true,
      highlightOnHover: true,
      highlightFillColor: '#FC8D59',
      highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
      highlightBorderWidth: 2,
      highlightBorderOpacity: 1,
    },
    fills: {
      defaultFill: mapFill,
      wrong: '#ff0000',
      dot: '#000000',
    },
    done: function (map: Datamap) {
      // responsive
      window.addEventListener('resize', function () {
        map.resize()
      })

      // update map if secret country is set
      if (!props.secretCountry.three_code) {
        return
      }
      const updateObject: { [key: string]: string } = {}
      const code = props.secretCountry.three_code
      updateObject[code] = 'black'
      map.updateChoropleth(updateObject)
    },
  })
})

const updateMap = () => {
  if (!map) {
    return
  }
  props.guessed.forEach((country) => {
    if (!country.three_code) {
      return
    }
    if (country.name === 'Peru') {
      map.updateChoropleth({
        [country.three_code]: 'green',
      })
    } else {
      console.log(country)
      map.updateChoropleth({
        [country.three_code]: 'red',
      })
    }
  })
}

onMounted(() => {
  updateMap()
})

watch(
  () => props.guessed,
  () => {
    updateMap()
  },
  { deep: true }
)
</script>

<style scoped></style>
