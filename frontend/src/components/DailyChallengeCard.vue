<script setup lang="ts">
import { Check, Share, TrendingUp } from "lucide-vue-next";
import { ref } from "vue";
import type { GameHistoryItem } from "../types/geo";

defineProps<{
  item: GameHistoryItem;
  showStatsButton?: boolean;
}>();

const emit = defineEmits<{
  showStats: [];
}>();

const getDailyChallengeNumber = (): number => {
  const now = new Date();
  const current = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(Date.UTC(2026, 1, 2)); // Feb 2, 2026 UTC
  const diffTime = current.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
};

const copyButtonText = ref("Copy shareable score");

const handleShare = async (item: GameHistoryItem) => {
  const text = [`GeoHearo #${getDailyChallengeNumber()}`, "https://geohearo.com/", item.score].join(
    "\n",
  );
  try {
    await navigator.clipboard.writeText(text);
    copyButtonText.value = "Copied!";
    setTimeout(() => {
      copyButtonText.value = "Copy shareable score";
    }, 2000);
  } catch (err) {
    console.error("Failed to copy text: ", err);
    copyButtonText.value = "Failed";
  }
};
</script>

<template>
  <div class="flex gap-2 items-stretch">
    <!-- Copy card -->
    <div
      class="flex-1 p-3 rounded-xl border-2 border-[#B45309] bg-orange-50/50 cursor-pointer hover:bg-orange-50 transition-colors"
      @click="handleShare(item)"
    >
      <div class="text-xs font-bold uppercase tracking-wider text-[#B45309] mb-2 text-center">
        Daily Challenge
      </div>
      <div class="flex items-center justify-center gap-3 text-sm text-[#B45309]">
        <span class="tracking-widest">{{ item.score }}</span>
      </div>
      <div
        class="mt-2 w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B45309]/60 transition-colors"
      >
        <Check v-if="copyButtonText === 'Copied!'" class="w-4 h-4 text-mint-shake" />
        <Share v-else class="w-4 h-4" />
        <span :class="{ 'text-mint-shake': copyButtonText === 'Copied!' }">
          {{ copyButtonText }}
        </span>
      </div>
    </div>

    <!-- Stats button -->
    <button
      v-if="showStatsButton"
      class="shrink-0 px-3 py-2 rounded-xl border-2 border-[#B45309] bg-orange-50/50 hover:bg-orange-50 transition-colors flex flex-col items-center justify-center gap-1"
      @click="emit('showStats')"
      title="View stats"
    >
      <TrendingUp class="w-5 h-5 text-[#B45309]" />
      <span class="text-xs font-bold uppercase tracking-wider text-[#B45309]/60">View Stats</span>
    </button>
  </div>
</template>
