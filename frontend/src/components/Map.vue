<script setup>
// import { schemeYlGn } from 'd3-scale-chromatic'
import * as d3 from 'd3'
import { onMounted } from 'vue'

import { MapUtil } from '../util/geo'

let map, util

const getColor = d3
  .scaleLinear()
  .domain([19969, 10])
  .range(['Linen', 'darkseagreen'])

const getCenters = async () => {
  // const resp = await fetch(
  //   'https://cdn.jsdelivr.net/gh/gavinr/world-countries-centroids@v1.0.0/dist/countries.geojson'
  // )
  const resp = await fetch('/data/centers.geojson')
  const data = await resp.json()

  // const centers = data.features.map((x) => {
  //   return {
  //     name: x.properties.COUNTRY,
  //     radius: 5,
  //     latitude: x.geometry.coordinates[1],
  //     longitude: x.geometry.coordinates[0],
  //     fillKey: 'dot',
  //   }
  // })

  util = new MapUtil(data)

  // console.log(util.getCountries())
  // console.log(util.getMaxDistance())

  // map.bubbles(centers, {})
}

function makeGuess(guess) {
  console.log('makeGuess')

  const target = 'Peru'

  const codes = {
    China: 'CHN',
    France: 'FRA',
    Peru: 'PER',
    Mexico: 'MEX',
  }

  const dist = util.getDistance(guess, target)
  console.log(dist)

  const color = getColor(dist)
  console.log(color)

  const code = codes[guess]
  const d = {}
  d[code] = color

  map.updateChoropleth(d)
}

onMounted(() => {
  const container = document.getElementById('container')
  map = new Datamap({
    element: container,
    fills: {
      defaultFill: '#D4D4D8',
      wrong: '#ff0000',
      dot: '#000000',
    },
  })

  getCenters()

  map.updateChoropleth({
    PER: 'black',
  })

  //draw bubbles for bombs
  // map.bubbles(centers, {})
})
</script>

<template>
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

  <div
    id="container"
    ref="container"
    style="position: relative; width: 600px; height: 400px"
  ></div>
</template>
