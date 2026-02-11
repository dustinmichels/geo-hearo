<script setup lang="ts">
import { computed } from 'vue'
import type { GameHistoryItem } from '../types/geo'
const props = defineProps<{
  history?: GameHistoryItem[]
}>()

const getScore = (item: GameHistoryItem): number => {
  if (typeof item.numericScore === 'number') return item.numericScore

  // Fallback: Compute from emoji string
  const emojis = [...(item.score || '')]
  const hasWon = emojis.includes('🟢')

  if (hasWon) {
    return 6 - emojis.length
  }
  return 0 // Loss
}

const averageScore = computed(() => {
  if (!props.history || props.history.length === 0) return '0.0'

  const total = props.history.reduce((sum, item) => sum + getScore(item), 0)
  return (total / props.history.length).toFixed(1)
})

</script>

<template>
  <div
    v-if="history && history.length > 0"
    class="text-left pt-4 flex flex-col flex-1 min-h-0"
  >
    <!-- Header -->
    <div class="text-sm text-center lowercase text-pencil-lead mb-3 shrink-0">
      Avg Score Today: {{ averageScore }}
      <span class="text-eraser-grey">/ 10</span>
    </div>

    <!-- Scrollable Free Play Items -->
    <div class="space-y-2 overflow-y-auto custom-scrollbar min-h-0 flex-1">
      <div
        v-for="(item, idx) in history
          .slice()
          .reverse()"
        :key="idx"
        class="grid grid-cols-[1fr_auto_auto] gap-3 items-center text-sm p-2 rounded-lg border-2 transition-colors bg-paper-white/50 text-pencil-lead"
        :class="idx === 0 ? (item.score.includes('🟢') ? 'border-mint-shake' : 'border-berry-oops') : 'border-pencil-lead/5'"
      >
        <span class="font-bold truncate">{{ item.country }}</span>
        <span class="tracking-widest">{{ item.score }}</span>
        <span class="font-mono font-bold text-pencil-lead/70 w-6 text-right">{{
          getScore(item)
        }}</span>
      </div>
    </div>

  </div>
</template>
