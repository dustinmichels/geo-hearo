<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next'
import StationDetails from './StationDetails.vue'
import type { RadioStation } from '../types/geo'

defineProps<{
  station?: RadioStation
}>()

defineEmits<{
  (e: 'newGame'): void
}>()
</script>

<template>
  <div
    class="flex items-stretch justify-center gap-2 pointer-events-auto w-[360px] max-w-full mx-auto"
  >
    <!-- Center: Station Details -->
    <div class="flex-1 w-full min-w-0">
      <StationDetails
        :station="station"
        class="!shadow-[0_4px_0_0_#334155] w-full h-full flex flex-col justify-center !max-w-none"
      />
    </div>

    <!-- Right: Action Buttons -->
    <div class="flex flex-col shrink-0 w-24">
      <!-- New Game -->
      <button
        class="flex-1 bg-yuzu-yellow text-pencil-lead rounded-2xl border-3 border-pencil-lead shadow-[0_4px_0_0_#334155] active:translate-y-1 active:shadow-none transition-all duration-100 flex flex-col items-center justify-center gap-1 hover:brightness-110 p-1"
        @click="$emit('newGame')"
        title="New Game"
      >
        <RotateCcw class="w-4 h-4" />
        <span
          class="text-[10px] font-bold uppercase tracking-wider leading-none text-center"
          >New Game</span
        >
      </button>
    </div>
  </div>
</template>
