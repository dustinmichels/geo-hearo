<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'
import { computed } from 'vue'
import type { RadioStation } from '../types/geo'

const props = withDefaults(
  defineProps<{
    station?: RadioStation
    layout?: 'default' | 'desktop'
  }>(),
  {
    layout: 'default',
  }
)

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
      class="font-heading leading-tight mb-1 text-pencil-lead truncate"
      :class="layout === 'desktop' ? 'text-lg' : 'text-lg'"
    >
      {{ station.channel_name }}
    </div>

    <div
      class="font-bold text-eraser-grey uppercase tracking-wide mb-2 truncate text-sm"
      :class="layout === 'desktop' ? 'text-xs' : 'text-sm'"
    >
      {{ formattedLocation }}
    </div>

    <div class="flex flex-col gap-2 items-center justify-center">
      <a
        :href="gardenUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center gap-1.5 font-bold text-gumball-blue hover:underline text-xs"
        :class="layout === 'desktop' ? 'text-xs' : 'text-xs'"
      >
        Listen on radio.garden
        <ExternalLink :class="layout === 'desktop' ? 'w-4 h-4' : 'w-3 h-3'" />
      </a>
    </div>
  </div>
</template>
