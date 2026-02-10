<script setup lang="ts">
import { Check, Share } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import type { GameHistoryItem } from '../types/geo'

const props = defineProps<{
  history?: GameHistoryItem[]
}>()

const getDailyChallengeNumber = (): number => {
  const now = new Date()
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const start = new Date(2026, 1, 2) // Month is 0-indexed: 1 = Feb
  const diffTime = current.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

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

const dailyItem = computed(() => {
  return props.history?.find((item) => item.mode === 'daily')
})

const copyButtonText = ref('Share score')

const handleShare = async () => {
  if (!dailyItem.value) return
  const text = [
    `GeoHearo #${getDailyChallengeNumber()}`,
    'https://geohearo.com/',
    dailyItem.value.score,
  ].join('\n')
  try {
    await navigator.clipboard.writeText(text)
    copyButtonText.value = 'Copied!'
    setTimeout(() => {
      copyButtonText.value = 'Share score'
    }, 2000)
  } catch (err) {
    console.error('Failed to copy text: ', err)
    copyButtonText.value = 'Failed'
  }
}
</script>

<template>
  <div
    v-if="history && history.length > 0"
    class="mb-6 text-left max-h-48 overflow-y-auto custom-scrollbar border-t-2 border-pencil-lead/10 pt-4"
  >
    <h3
      class="text-sm font-heading text-pencil-lead/60 mb-3 text-center uppercase tracking-wider"
    >
      <span
        v-if="history && history.length > 0"
        class="block text-sm mt-1 lowercase text-pencil-lead"
      >
        Avg Score Today: {{ averageScore }}
        <span class="text-eraser-grey">/ 10</span>
      </span>
    </h3>

    <!-- Daily Challenge Card -->
    <div
      v-if="dailyItem"
      class="mb-3 p-3 rounded-xl border-2 border-[#B45309] bg-orange-50/50"
    >
      <div class="text-xs font-bold uppercase tracking-wider text-[#B45309] mb-2 text-center">
        Daily Challenge
      </div>
      <div
        class="grid grid-cols-[1fr_auto_auto] gap-3 items-center text-sm text-[#B45309]"
      >
        <span class="font-bold truncate">{{ dailyItem.country }}</span>
        <span class="tracking-widest">{{ dailyItem.score }}</span>
        <span class="font-mono font-bold text-[#B45309]/70 w-6 text-right">{{
          getScore(dailyItem)
        }}</span>
      </div>
      <button
        @click="handleShare"
        class="mt-2 w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B45309]/60 hover:text-[#B45309] transition-colors cursor-pointer"
      >
        <Check
          v-if="copyButtonText === 'Copied!'"
          class="w-4 h-4 text-mint-shake"
        />
        <Share v-else class="w-4 h-4" />
        <span :class="{ 'text-mint-shake': copyButtonText === 'Copied!' }">
          {{ copyButtonText }}
        </span>
      </button>
    </div>

    <!-- Free Play Items -->
    <div class="space-y-2">
      <div
        v-for="(item, idx) in history
          .slice()
          .reverse()
          .filter((i) => i.mode !== 'daily')"
        :key="idx"
        class="grid grid-cols-[1fr_auto_auto] gap-3 items-center text-sm p-2 rounded-lg border transition-colors bg-paper-white/50 text-pencil-lead border-pencil-lead/5"
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
