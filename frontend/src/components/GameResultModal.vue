<script setup lang="ts">
import { ArrowRight, X } from "lucide-vue-next";
import type { GameHistoryItem } from "../types/geo";
import DailyChallengeCard from "./DailyChallengeCard.vue";
import GameHistoryList from "./GameHistoryList.vue";
import StatsBarChart from "./StatsBarChart.vue";

const props = defineProps<{
  show: boolean;
  isWin?: boolean;
  secretCountry?: string;
  history?: GameHistoryItem[];
  isDailyChallenge?: boolean;
  dailyChallengeNumber?: number;
  challengeDate?: string;
  statsView?: boolean;
  trackedPromise?: Promise<boolean>;
}>();

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "close"): void;
}>();

import { computed, onMounted, onUnmounted, ref } from "vue";

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && props.show) emit("close");
}

const timeUntilReset = ref("");
let countdownTimer: ReturnType<typeof setInterval>;

const updateCountdown = () => {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  const diff = midnight.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  timeUntilReset.value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);
});
onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  clearInterval(countdownTimer);
});

const displayItem = computed(() => {
  if (props.statsView) {
    return props.history?.find((item) => item.mode === "daily") ?? null;
  }
  if (!props.history || props.history.length === 0) return null;
  return props.history[props.history.length - 1];
});

// Number of guesses the current player used: emoji string length for a win, 6 (loss sentinel) for a loss
const playerNumGuesses = computed(() => {
  if (!displayItem.value) return undefined;
  return props.isWin ? Array.from(displayItem.value.score).length : 6;
});
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[9999] flex items-center justify-center px-6">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-pencil-lead/20 backdrop-blur-sm" @click.stop></div>

      <!-- Modal Card -->
      <div
        class="relative bg-paper-white w-full max-w-sm max-h-[85vh] flex flex-col rounded-[2rem] border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] text-center animate-bounce-in"
      >
        <!-- Close (X) Button -->
        <button
          @click="emit('close')"
          class="absolute top-3 right-3 z-10 p-1.5 text-pencil-lead/50 bg-pencil-lead/10 hover:text-white hover:bg-berry-oops rounded-full transition-colors"
        >
          <X class="w-5 h-5" />
        </button>

        <!-- Fixed top: Country name -->
        <div class="shrink-0 px-6 pt-6">
          <div class="mb-2">
            <template v-if="isDailyChallenge">
              <span v-if="!statsView" class="text-5xl">{{ isWin ? "🎉" : "🤔" }}</span>
              <h2 class="text-2xl font-heading mt-2 tracking-wide text-pencil-lead">
                Daily Challenge{{ dailyChallengeNumber ? ` #${dailyChallengeNumber}` : "" }}
              </h2>
            </template>
            <template v-else>
              <span class="text-5xl">{{ isWin ? "🎉" : "🤔" }}</span>
              <h2
                class="text-2xl font-heading mt-2 tracking-wide"
                :class="isWin ? 'text-mint-shake' : 'text-berry-oops'"
              >
                {{ isWin ? "Nice work!" : "Game Over!" }}
              </h2>
            </template>
          </div>
          <p class="text-base text-pencil-lead/80 leading-relaxed">
            The country was:
            <strong class="text-pencil-lead font-bold">{{ secretCountry || "Unknown" }}</strong>
          </p>
          <p v-if="isDailyChallenge" class="text-xs text-pencil-lead/50 mt-1 tracking-wide">
            Next challenge in <span class="font-mono font-semibold">{{ timeUntilReset }}</span>
          </p>
        </div>

        <!-- Game History or Share View -->
        <!-- Game History or Share View -->
        <div
          v-if="isDailyChallenge && displayItem"
          class="flex-1 min-h-0 px-6 overflow-y-auto flex flex-col justify-center"
        >
          <DailyChallengeCard :item="displayItem" class="mt-3" />
          <StatsBarChart
            v-if="challengeDate"
            :challenge-date="challengeDate"
            :player-num-guesses="playerNumGuesses"
            :tracked-promise="trackedPromise"
            class="mt-3"
          />
        </div>

        <GameHistoryList
          v-else-if="history && history.length > 0"
          :history="history"
          class="flex-1 min-h-0 px-6 overflow-y-auto"
        />

        <!-- Fixed bottom button -->
        <div class="shrink-0 p-6 pt-3">
          <button
            @click="emit('close')"
            class="w-full btn-pressable bg-yuzu-yellow h-[48px] rounded-xl font-heading text-lg text-pencil-lead uppercase tracking-wider border-2 border-pencil-lead shadow-[4px_4px_0_0_#334155] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
          >
            <template v-if="statsView">Close</template>
            <template v-else>See the stations <ArrowRight class="w-5 h-5" /></template>
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
