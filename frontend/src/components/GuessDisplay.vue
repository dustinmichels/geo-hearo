<script setup lang="ts">
import { useRadio } from '../composables/useRadio'
import { getColorForArrowCount } from '../utils/colors'
import { getDirectionalArrows } from '../utils/geography'

const props = defineProps<{
  guesses: string[]
}>()

const maxGuesses = 5
const { secretCountry, getCoordinates } = useRadio()

const getArrowsForGuess = (guessName: string | undefined) => {
  if (!guessName || !secretCountry.value) return null

  const guessLoc = getCoordinates(guessName)
  const secretLoc = getCoordinates(secretCountry.value)

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
            <div
              class="flex items-center justify-end gap-0.5 shrink-0 min-w-[60px]"
            >
              <span
                v-for="i in getArrowsForGuess(guesses[num - 1])?.count || 0"
                :key="i"
                class="text-lg leading-none"
              >
                {{ getArrowsForGuess(guesses[num - 1])?.arrows }}
              </span>
            </div>
          </template>
          <span v-else class="text-eraser-grey italic text-lg">Empty</span>
        </div>
      </div>
    </div>
  </div>
</template>
