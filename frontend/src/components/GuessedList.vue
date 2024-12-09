<template>
  <div class="panel">
    <!-- <p class="panel-heading">Guesses</p> -->

    <label class="panel-block" v-for="(guess, index) in guessed">
      <span v-if="guess.name">
        {{ index + 1 }}) {{ guess.name }}
        {{ directionToArrow(guess.direction) }}
        ({{ guess.distance.toFixed(0) }} km)
      </span>
      <span v-else>{{ index + 1 }}) </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { CountryWithDistance } from '../types'
import { directionToArrow } from '../util/geo'

defineProps<{
  guessed: CountryWithDistance[]
}>()
</script>

<style scoped></style>
