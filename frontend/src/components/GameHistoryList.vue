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
    class="mb-6 text-left max-h-48 overflow-y-auto custom-scrollbar border-t-2 border-pencil-lead/10 pt-4"
  >
    <h3
      class="text-sm font-heading text-pencil-lead/60 mb-3 text-center uppercase tracking-wider"
    >
      GAME HISTORY
      <span
        v-if="history && history.length > 0"
        class="block text-xs mt-1 lowercase text-pencil-lead"
      >
        Avg Score: {{ averageScore }}
      </span>
    </h3>
    <div class="space-y-2">
      <div
        v-for="(item, idx) in history.slice().reverse()"
        :key="idx"
        class="grid grid-cols-[1fr_auto_auto] gap-3 items-center text-sm p-2 rounded-lg border transition-colors"
        :class="[
          item.mode === 'daily'
            ? 'bg-orange-50/50 text-[#B45309]'
            : 'bg-paper-white/50 text-pencil-lead',
          idx === 0
            ? getScore(item) > 0
              ? 'border-mint-shake border-2'
              : 'border-berry-oops border-2'
            : item.mode === 'daily'
              ? 'border-[#B45309]/50'
              : 'border-pencil-lead/5',
        ]"
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
