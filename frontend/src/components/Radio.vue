<template>
  <ul>
    <li v-for="station in radioStations" :key="station.channel_id">
      {{ station.channel_url }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { RadioStationWithStreamingUrl } from '../types'

defineProps<{
  radioStations: RadioStationWithStreamingUrl[]
}>()
</script>

<style scoped></style>
