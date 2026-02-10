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
    class="text-left pt-4 flex flex-col flex-1 min-h-0"
  >
    <!-- Header -->
    <div class="text-m text-center text-pencil-lead mb-1 shrink-0 font-bold">
      Game History
    </div>
    <div class="text-sm text-center lowercase text-pencil-lead mb-3 shrink-0">
      Avg Score Today: {{ averageScore }}
      <span class="text-eraser-grey">/ 10</span>
    </div>

    <!-- Scrollable Free Play Items -->
    <div class="space-y-2 overflow-y-auto custom-scrollbar min-h-0 flex-1">
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

    <!-- Daily Challenge Card (pinned to bottom) -->
    <div
      v-if="dailyItem"
      class="mt-3 p-3 rounded-xl border-2 border-[#B45309] bg-orange-50/50 shrink-0 cursor-pointer hover:bg-orange-50 transition-colors"
      @click="handleShare"
    >
      <div
        class="text-xs font-bold uppercase tracking-wider text-[#B45309] mb-2 text-center"
      >
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
      <div
        class="mt-2 w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B45309]/60 transition-colors"
      >
        <Check
          v-if="copyButtonText === 'Copied!'"
          class="w-4 h-4 text-mint-shake"
        />
        <Share v-else class="w-4 h-4" />
        <span :class="{ 'text-mint-shake': copyButtonText === 'Copied!' }">
          {{ copyButtonText }}
        </span>
      </div>
    </div>
  </div>
</template>
