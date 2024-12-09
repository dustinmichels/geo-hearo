<template>
  <div class="panel">
    <!-- <p class="panel-heading">Guesses</p> -->

    <label class="panel-block" v-for="(guess, index) in guessed">
      <span v-if="guess.name" class="panel-row">
        <span class="panel-index">{{ index + 1 }})</span>
        <span class="panel-name">{{ guess.name }}</span>
        <span class="panel-direction">{{
          directionToArrow(guess.direction)
        }}</span>
        <span class="panel-distance"
          >({{ formatNumber(guess.distance) }} km)</span
        >
      </span>
      <span v-else>{{ index + 1 }}) </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { CountryGuessed } from '../types'
import { directionToArrow } from '../util/geo'

defineProps<{
  guessed: CountryGuessed[]
}>()

const formatNumber = (num: number) => {
  return Math.trunc(num).toLocaleString()
}
</script>

<style scoped>
.panel-row {
  display: flex;
  align-items: center; /* Aligns items vertically */
  width: 100%; /* Ensures the row spans the full width of the container */
  gap: 10px; /* Adds consistent spacing between items */
}

.panel-index {
  flex: 0 0 auto; /* Takes only as much space as the content needs */
}

.panel-name {
  flex: 2; /* Takes up twice the space of the other flexible elements */
}

.panel-direction {
  flex: 1; /* Proportional spacing for the direction */
  /* text-align: center; */
  /* Optional: Center the arrow */
}

.panel-distance {
  flex: 1; /* Proportional spacing for the distance */
  /* text-align: right; */
  /* Align the distance to the right */
}
</style>
