<template>
  <div class="panel">
    <!-- <p class="panel-heading">Guesses</p> -->
    <label class="panel-block" v-for="(guess, index) in guessed">
      <span v-if="guess.name">{{ index + 1 }}) {{ guess.name }}</span>
      <span v-else>{{ index + 1 }}) </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { Country } from '../types'

defineProps<{
  guessed: Country[]
}>()
</script>

<style scoped></style>
