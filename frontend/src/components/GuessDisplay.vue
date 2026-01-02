<script setup lang="ts">
defineProps<{
  guesses: string[]
}>()

const maxGuesses = 5
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-6 w-full">
    <div class="space-y-3">
      <div
        v-for="num in maxGuesses"
        :key="num"
        class="flex items-center gap-3 p-3 rounded-lg border-2"
        :class="
          guesses[num - 1]
            ? 'border-blue-200 bg-blue-50'
            : 'border-gray-200 bg-gray-50'
        "
      >
        <div
          class="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-300 text-sm font-semibold text-gray-600"
        >
          {{ num }}
        </div>
        <div class="flex-1">
          <span v-if="guesses[num - 1]" class="text-gray-800">{{
            guesses[num - 1]
          }}</span>
          <span v-else class="text-gray-400 italic">Empty</span>
        </div>
      </div>
    </div>
  </div>
</template>
