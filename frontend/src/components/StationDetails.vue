<script setup lang="ts">
import { computed } from 'vue'
import { ExternalLink } from 'lucide-vue-next'
import type { RadioStation } from '../types/geo'

const props = defineProps<{
  station?: RadioStation
}>()

const formattedLocation = computed(() => {
  if (!props.station) return ''
  return [props.station.place_name, props.station.country]
    .filter(Boolean)
    .join(', ')
})

const gardenUrl = computed(() => {
  if (!props.station?.channel_url) return ''
  // Ensure we don't double slash if channel_url starts with /
  const path = props.station.channel_url.startsWith('/')
    ? props.station.channel_url
    : `/${props.station.channel_url}`

  return `https://radio.garden${path}`
})
</script>

<template>
  <div
    v-if="station"
    class="bg-paper-white rounded-xl border-3 border-pencil-lead shadow-[0_4px_0_0_#334155] p-3 max-w-[280px] w-full text-center pointer-events-auto"
  >
    <div
      class="font-heading text-lg leading-tight mb-1 text-pencil-lead truncate"
    >
      {{ station.channel_name }}
    </div>

    <div
      class="text-sm font-bold text-eraser-grey uppercase tracking-wide mb-2 truncate"
    >
      {{ formattedLocation }}
    </div>

    <a
      :href="gardenUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-gumball-blue hover:underline"
    >
      Listen on radio.garden
      <ExternalLink class="w-3 h-3" />
    </a>
  </div>
</template>
