<script setup lang="ts">
import { useRadio } from '../composables/useRadio'
import { getColorForArrowCount } from '../utils/colors'
import { getCountryLocation, getDirectionalArrows } from '../utils/geography'

const props = defineProps<{
  guesses: string[]
}>()

const maxGuesses = 5
const { allStations, secretCountry } = useRadio()

const getArrowsForGuess = (guessName: string | undefined) => {
  if (!guessName || !secretCountry.value) return null

  const guessLoc = getCountryLocation(guessName, allStations.value)
  const secretLoc = getCountryLocation(secretCountry.value, allStations.value)

  if (!guessLoc || !secretLoc) return null

  return getDirectionalArrows(guessLoc, secretLoc)
}

const getGuessColor = (guessName: string | undefined) => {
  const result = getArrowsForGuess(guessName)
  if (!result) return '#FFFFFF'
  return getColorForArrowCount(result.count)
}
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
            ? 'border-pencil-lead shadow-[0_2px_0_0_#334155]'
            : 'border-eraser-grey border-dashed bg-transparent opacity-60'
        "
        :style="{
          backgroundColor: guesses[num - 1]
            ? getGuessColor(guesses[num - 1])
            : undefined,
        }"
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
        <div
          class="flex-1 font-heading min-w-0 flex items-center justify-between gap-1"
        >
          <template v-if="guesses[num - 1]">
            <span class="text-pencil-lead text-base truncate">{{
              guesses[num - 1]
            }}</span>
            <span
              v-if="getArrowsForGuess(guesses[num - 1])"
              class="text-xs tracking-tighter shrink-0"
            >
              {{ getArrowsForGuess(guesses[num - 1])?.arrows }}
            </span>
          </template>
          <span v-else class="text-eraser-grey italic text-lg">Empty</span>
        </div>
      </div>
    </div>
  </div>
</template>
