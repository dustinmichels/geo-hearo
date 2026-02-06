<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next'
import type { RadioStation } from '../types/geo'
import StationDetails from './StationDetails.vue'

withDefaults(
  defineProps<{
    station?: RadioStation
    layout?: 'default' | 'desktop'
  }>(),
  {
    layout: 'default',
  }
)

defineEmits<{
  (e: 'newGame'): void
}>()
</script>

<template>
  <div
    class="flex items-stretch justify-center gap-2 pointer-events-auto w-full max-w-sm mx-auto"
    :class="layout === 'desktop' ? 'flex-col' : 'flex-row'"
  >
    <!-- Center: Station Details -->
    <div id="station-details-panel" class="flex-1 w-full min-w-0">
      <StationDetails
        :station="station"
        :layout="layout"
        class="!shadow-[0_4px_0_0_#334155] w-full h-full flex flex-col justify-center !max-w-none"
      />
    </div>

    <!-- Right: Action Buttons -->
    <div
      class="flex shrink-0 w-24"
      :class="
        layout === 'desktop' ? 'flex-row w-full h-16' : 'flex-col w-24 h-auto'
      "
    >
      <!-- New Game -->
      <button
        id="new-game-btn"
        class="flex-1 bg-yuzu-yellow text-pencil-lead rounded-2xl border-3 border-pencil-lead shadow-[0_4px_0_0_#334155] active:translate-y-1 active:shadow-none transition-all duration-100 flex items-center justify-center gap-1 hover:brightness-110 p-1"
        :class="layout === 'desktop' ? 'flex-row' : 'flex-col'"
        @click="$emit('newGame')"
        title="New Game"
      >
        <RotateCcw class="w-4 h-4" />
        <span
          class="font-bold uppercase tracking-wider leading-none text-center"
          :class="layout === 'desktop' ? 'text-sm' : 'text-[10px]'"
          >New Game</span
        >
      </button>
    </div>
  </div>
</template>
