<script setup lang="ts">
defineProps<{
  guesses: string[]
}>()

const maxGuesses = 5
</script>

<template>
  <div class="w-full">
    <div class="space-y-3">
      <div
        v-for="num in maxGuesses"
        :key="num"
        class="flex items-center gap-4 p-3 rounded-xl border-3 transition-all"
        :class="
          guesses[num - 1]
            ? 'border-pencil-lead bg-white shadow-[0_2px_0_0_#334155]'
            : 'border-eraser-grey border-dashed bg-transparent opacity-60'
        "
      >
        <div
          class="flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-heading font-bold"
          :class="
            guesses[num - 1]
              ? 'bg-gumball-blue border-pencil-lead text-white'
              : 'bg-transparent border-eraser-grey text-eraser-grey'
          "
        >
          {{ num }}
        </div>
        <div class="flex-1 font-heading text-lg">
          <span v-if="guesses[num - 1]" class="text-pencil-lead">{{
            guesses[num - 1]
          }}</span>
          <span v-else class="text-eraser-grey italic">Empty</span>
        </div>
      </div>
    </div>
  </div>
</template>
