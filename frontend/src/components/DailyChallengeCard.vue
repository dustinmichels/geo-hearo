<script setup lang="ts">
import { Check, Share } from 'lucide-vue-next'
import { ref } from 'vue'
import type { GameHistoryItem } from '../types/geo'

defineProps<{
  item: GameHistoryItem
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
  const emojis = [...(item.score || '')]
  const hasWon = emojis.includes('🟢')
  if (hasWon) {
    return 6 - emojis.length
  }
  return 0
}

const copyButtonText = ref('Copy shareable score')

const handleShare = async (item: GameHistoryItem) => {
  const text = [
    `GeoHearo #${getDailyChallengeNumber()}`,
    'https://geohearo.com/',
    item.score,
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
    class="p-3 rounded-xl border-2 border-[#B45309] bg-orange-50/50 cursor-pointer hover:bg-orange-50 transition-colors"
    @click="handleShare(item)"
  >
    <div
      class="text-xs font-bold uppercase tracking-wider text-[#B45309] mb-2 text-center"
    >
      Daily Challenge
    </div>
    <div class="flex items-center justify-center gap-3 text-sm text-[#B45309]">
      <span class="tracking-widest">{{ item.score }}</span>
      <span class="font-mono font-bold text-[#B45309]/70">{{
        getScore(item)
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
</template>
