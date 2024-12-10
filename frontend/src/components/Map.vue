<template>
  <div class="">
    <div id="outer" class="">
      <div id="container" ref="container"></div>
      <div class="overlay-text is-pulled-right">
        Wrong
        <div style="background-color: #ffffcc" class="square"></div>
        <div style="background-color: #d9f0a3" class="square"></div>
        <div style="background-color: #addd8e" class="square"></div>
        <div style="background-color: #78c679" class="square"></div>
        <div style="background-color: #31a354" class="square"></div>
        <div style="background-color: #006837" class="square"></div>
        Right
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Datamap from 'datamaps'
import { onMounted, watch } from 'vue'
import { Country, CountryGuessed } from '../types'

const props = defineProps<{
  guessed: CountryGuessed[]
  secretCountry: Country
  isGameOver: boolean
  colorFcn: Function
}>()

const mapBorder = '#ffffff'
const mapFill = '#D4D4D8'

let map: Datamap

// const proj = geoAitoff()

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
      if (!props.secretCountry.three_code) return
      const updateObject: { [key: string]: string } = {}
      const code = props.secretCountry.three_code
      updateObject[code] = 'black'
      // map.updateChoropleth(updateObject)
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
    let fillColor = props.colorFcn(country.distance)
    if (country.name === props.secretCountry.name) {
      map.updateChoropleth({
        [country.three_code]: '#006837',
      })
    } else {
      console.log(country)
      map.updateChoropleth({
        [country.three_code]: fillColor,
      })
    }
  })

  if (props.isGameOver) {
    map.updateChoropleth({
      [props.secretCountry.three_code]: '#006837',
    })
  }
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

watch(
  () => props.isGameOver,
  () => {
    updateMap()
  },
  { deep: true }
)
</script>

<style scoped>
.svg-container {
  position: relative;
  display: inline-block;
  width: 300px; /* Match your SVG width */
  height: 200px; /* Match your SVG height */
}

.overlay-text {
  /* position: absolute; */
  bottom: 10px;
  left: 10px;
  font-family: Arial, sans-serif;
  font-size: 16px;
  color: black;
  background: rgba(255, 255, 255, 0.7); /* Optional: Background for contrast */
  padding: 2px 5px; /* Optional: Padding for the text */
  border-radius: 4px; /* Optional: Rounded corners */
}

.square {
  width: 10px; /* Width of the square */
  height: 10px; /* Height of the square */
  display: inline-block; /* Ensures it behaves like a block element */
}
</style>
