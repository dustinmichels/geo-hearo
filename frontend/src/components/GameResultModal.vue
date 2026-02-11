<script setup lang="ts">
import { ArrowRight, X } from 'lucide-vue-next'
import { computed } from 'vue'
import type { GameHistoryItem } from '../types/geo'
import DailyChallengeCard from './DailyChallengeCard.vue'
import GameHistoryList from './GameHistoryList.vue'

const props = defineProps<{
  show: boolean
  isWin?: boolean
  secretCountry?: string
  history?: GameHistoryItem[]
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'close'): void
}>()

const latestItem = computed(() => {
  if (!props.history || props.history.length === 0) return undefined
  return props.history[props.history.length - 1]
})

const isDaily = computed(() => latestItem.value?.mode === 'daily')
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[9999] flex items-center justify-center px-6"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-pencil-lead/20 backdrop-blur-sm"
        @click.stop
      ></div>

      <!-- Modal Card -->
      <div
        class="relative bg-paper-white w-full max-w-sm max-h-[85vh] flex flex-col rounded-[2rem] border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] text-center animate-bounce-in"
      >
        <!-- Close (X) Button -->
        <button
          @click="emit('close')"
          class="absolute top-3 right-3 z-10 p-1.5 text-pencil-lead/50 hover:text-pencil-lead transition-colors"
        >
          <X class="w-5 h-5" />
        </button>

        <!-- Fixed top: Country name -->
        <div class="shrink-0 px-6 pt-6">
          <div class="mb-2">
            <span class="text-5xl">{{ isWin ? '🎉' : '🤔' }}</span>
            <h2
              class="text-2xl font-heading mt-2 tracking-wide"
              :class="isWin ? 'text-mint-shake' : 'text-berry-oops'"
            >
              {{ isWin ? 'Nice work!' : 'Game Over!' }}
            </h2>
          </div>
          <p class="text-base text-pencil-lead/80 leading-relaxed">
            The country was:
            <strong class="text-pencil-lead font-bold">{{
              secretCountry || 'Unknown'
            }}</strong>
          </p>
        </div>

        <!-- Daily Challenge Card (if current game is daily) -->
        <div v-if="isDaily && latestItem" class="shrink-0 px-6 pt-4">
          <DailyChallengeCard :item="latestItem" />
        </div>

        <!-- Game History (if current game is free play) -->
        <GameHistoryList
          v-else-if="history && history.length > 0"
          :history="history"
          hide-daily-card
          class="flex-1 min-h-0 px-6"
        />

        <!-- Fixed bottom button -->
        <div class="shrink-0 p-6 pt-3">
          <button
            @click="emit('close')"
            class="w-full btn-pressable bg-yuzu-yellow h-[48px] rounded-xl font-heading text-lg text-pencil-lead uppercase tracking-wider border-2 border-pencil-lead shadow-[4px_4px_0_0_#334155] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
          >
            See the stations <ArrowRight class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.animate-bounce-in {
  animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
