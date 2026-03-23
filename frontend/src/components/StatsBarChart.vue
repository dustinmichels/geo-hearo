<script setup lang="ts">
import { onMounted, ref } from "vue";
import { fetchDailyStats } from "../lib/supabase";

const props = defineProps<{
  challengeDate: string;
  playerNumGuesses?: number;
  trackedPromise?: Promise<boolean>;
}>();

interface Row {
  label: string;
  num: number; // 1–6
  count: number;
}

const rows = ref<Row[]>([]);
const totalPlayers = ref(0);
const loaded = ref(false);

onMounted(async () => {
  const [data, tracked] = await Promise.all([
    fetchDailyStats(props.challengeDate),
    props.trackedPromise ?? Promise.resolve(false),
  ]);

  const countMap: Record<number, number> = {};
  for (const d of data) {
    countMap[d.num_guesses] = d.count;
  }

  // Only inject the player's own result if the RPC hasn't confirmed success —
  // avoids double-counting when the DB has already been incremented.
  if (props.playerNumGuesses !== undefined && !tracked) {
    countMap[props.playerNumGuesses] = (countMap[props.playerNumGuesses] ?? 0) + 1;
  }

  rows.value = [
    { label: "1", num: 1, count: countMap[1] ?? 0 },
    { label: "2", num: 2, count: countMap[2] ?? 0 },
    { label: "3", num: 3, count: countMap[3] ?? 0 },
    { label: "4", num: 4, count: countMap[4] ?? 0 },
    { label: "5", num: 5, count: countMap[5] ?? 0 },
    { label: "✗", num: 6, count: countMap[6] ?? 0 },
  ];

  totalPlayers.value = rows.value.reduce((sum, r) => sum + r.count, 0);
  loaded.value = true;
});
</script>

<template>
  <!-- Skeleton -->
  <div
    v-if="!loaded"
    class="rounded-2xl border-2 border-pencil-lead/10 bg-pencil-lead/5 px-4 py-3"
  >
    <div class="h-3 w-32 rounded bg-pencil-lead/10 mb-3 shimmer" />
    <div class="space-y-1.5">
      <div v-for="i in 6" :key="i" class="flex items-center gap-2">
        <div class="w-4 h-3 rounded bg-pencil-lead/10 shrink-0 shimmer" />
        <div
          class="h-5 rounded bg-pencil-lead/10 shimmer"
          :style="{ width: `${30 + ((i * 37) % 55)}%` }"
        />
      </div>
    </div>
  </div>

  <!-- Data -->
  <div
    v-else-if="loaded && totalPlayers > 0"
    class="rounded-2xl border-2 border-pencil-lead/10 bg-pencil-lead/5 px-4 py-3"
  >
    <p class="text-xs font-bold uppercase tracking-widest text-[#B45309] mb-2">
      Today's Results · {{ totalPlayers }} {{ totalPlayers === 1 ? "player" : "players" }}
    </p>
    <div class="space-y-1.5">
      <div v-for="row in rows" :key="row.label" class="flex items-center gap-2">
        <span class="w-4 text-center text-xs font-bold text-pencil-lead/70 shrink-0">{{
          row.label
        }}</span>
        <div class="flex-1 flex items-center">
          <div
            :class="[
              'h-5 rounded flex items-center justify-end pr-1.5 transition-all duration-500',
              row.num === playerNumGuesses
                ? 'bg-[#B45309] ring-2 ring-[#B45309] ring-offset-1'
                : 'bg-[#B45309]/40',
            ]"
            :style="{
              width:
                row.count > 0
                  ? `max(18px, ${(row.count / Math.max(...rows.map((r) => r.count))) * 100}%)`
                  : '0px',
            }"
          >
            <span v-if="row.count > 0" class="text-[10px] font-bold text-white leading-none">{{
              row.count
            }}</span>
          </div>
          <span
            v-if="row.num === playerNumGuesses"
            class="ml-1.5 text-[10px] font-bold text-[#B45309] shrink-0"
          >← you</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shimmer {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
