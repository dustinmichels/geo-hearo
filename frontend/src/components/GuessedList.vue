<template>
  <div class="panel">
    <p class="panel-heading">Guesses</p>

    <label class="panel-block" v-for="(guess, index) in guessed">
      {{ index + 1 }}) {{ guess }}
    </label>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  guessed: string[]
}>()
</script>

<style scoped></style>
