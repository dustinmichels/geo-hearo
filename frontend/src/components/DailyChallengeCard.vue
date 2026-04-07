<script setup lang="ts">
import { Check, Share, Trophy } from "lucide-vue-next";
import { ref } from "vue";
import { useRadio } from "../composables/useRadio";
import type { GameHistoryItem } from "../types/geo";

defineProps<{
  item?: GameHistoryItem;
}>();

const emit = defineEmits<{
  showStats: [];
}>();

const { getDailyChallengeNumber } = useRadio();

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
  <!-- Copy card (modal) -->
  <div
    v-if="item"
    class="p-3 rounded-xl border-2 border-[#B45309] bg-orange-50/50 cursor-pointer hover:bg-orange-50 transition-colors"
    @click="handleShare(item)"
  >
    <div class="flex items-center justify-center gap-3 text-sm text-[#B45309]">
      <span class="tracking-widest">{{ item.score }}</span>
    </div>
    <div
      class="mt-4 w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B45309]/60 transition-colors"
    >
      <Check v-if="copyButtonText === 'Copied!'" class="w-4 h-4 text-mint-shake" />
      <Share v-else class="w-4 h-4" />
      <span :class="{ 'text-mint-shake': copyButtonText === 'Copied!' }">
        {{ copyButtonText }}
      </span>
    </div>
  </div>

  <!-- Revisit button (results panel) -->
  <button
    v-else
    class="w-full px-4 py-3 rounded-xl border-2 border-[#B45309] bg-orange-50/50 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
    @click="emit('showStats')"
    title="Revisit Daily Challenge"
  >
    <Trophy class="w-5 h-5 text-[#B45309]" />
    <span class="text-sm font-bold uppercase tracking-wider text-[#B45309]/60"
      >Revisit Daily Challenge</span
    >
  </button>
</template>
