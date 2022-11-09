<script setup>
// import { schemeYlGn } from 'd3-scale-chromatic'
import { geoPath } from 'd3-geo'
import { geoAiry, geoAitoff, geoArmadillo, geoFahey } from 'd3-geo-projection'
import colors from 'tailwindcss/colors'

import * as d3 from 'd3'
import { onMounted } from 'vue'

import { MapUtil } from '../util/geo/geo'

let map, util, centers

const mapFill = colors.stone[300]
const mapBorder = colors.stone[400]

const LEFT_ARROW = '⬅️'
const RIGHT_ARROW = '➡️'
const UP_ARROW = '⬆️'
const DOWN_ARROW = '⬇️'

const proj = geoAitoff()

const getColor = d3
  .scaleLinear()
  .domain([19969, 10])
  .range(['Linen', 'darkseagreen'])

const getCodeForCountry = (name) => {
  const countries = Datamap.prototype.worldTopo.objects.world.geometries
  const code = countries.find((x) => x.properties.name === name).id
  return code
}

// const getAllCodes = () => {
//   const countries = Datamap.prototype.worldTopo.objects.world.geometries
//   const codes = countries.map((x) => x.id)
//   return codes
// }

const getCustomLabels = () => {
  const labels = {}
  const countries = Datamap.prototype.worldTopo.objects.world.geometries
  countries.forEach((x) => (labels[x.id] = ' '))
  return labels
}

const customLabels = getCustomLabels()

const getCenters = async () => {
  // const resp = await fetch(
  //   'https://cdn.jsdelivr.net/gh/gavinr/world-countries-centroids@v1.0.0/dist/countries.geojson'
  // )
  const resp = await fetch('/data/centers.geojson')
  const data = await resp.json()

  centers = data.features.map((x) => {
    return {
      name: x.properties.COUNTRY,
      radius: 20,
      latitude: x.geometry.coordinates[1],
      longitude: x.geometry.coordinates[0],
      fillKey: 'dot',
    }
  })

  const guessedCenters = centers.filter(
    (x) => x.name === 'China' || x.name === 'France' || x.name === 'Mexico'
  )

  // map.bubbles(guessedCenters, {})

  // const newLabels = { USA: '⬅️', CHN: '<-', AUS: ' ' }

  // console.log(customLabels)

  map.labels({
    customLabelText: customLabels,
    labelColor: 'blue',
    fontSize: 22,
  })

  // console.log(map)

  util = new MapUtil(data)
}

function makeGuess(guess) {
  console.log('makeGuess')

  const target = 'Peru'

  const dist = util.getDistance(guess, target)
  console.log(dist)

  const color = getColor(dist)
  console.log(color)

  const code = getCodeForCountry(guess)
  const d = {}
  d[code] = color
  map.updateChoropleth(d)

  // TODO: look at updateChoropleth code to match transition/animation
  setTimeout(() => {
    customLabels[code] = LEFT_ARROW
    map.labels({
      customLabelText: customLabels,
      labelColor: 'blue',
      fontSize: 22,
    })
  }, 500)
}

// Set projection
function setProj(element) {
  const width = element.offsetWidth
  const height = element.offsetHeight
  var projection = proj
    .scale((width + 1) / 1.6 / Math.PI)
    .translate([width / 2.5, height / 1.7])
  var path = geoPath().projection(projection)
  return { path, projection }
}

onMounted(() => {
  const container = document.getElementById('container')

  const projs = ['equirectangular', 'mercator', 'orthographic']

  map = new Datamap({
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

      getCenters()
    },
  })
})
</script>

<template>
  <!-- <div>
    Target: Peru <br />

    <button
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      @click="makeGuess('China')"
    >
      China
    </button>

    <button
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      @click="makeGuess('France')"
    >
      France
    </button>

    <button
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      @click="makeGuess('Mexico')"
    >
      Mexico
    </button>
  </div> -->

  <div class="">
    <div id="outer" class="max-w-screen-lg">
      <!-- <div
        id="container"
        ref="container"
        class="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-[100px]"
      ></div> -->
      <div id="container" ref="container"></div>
    </div>
  </div>
</template>

<style>
#container {
  border: 2px solid #ccc;
}
</style>
