<script setup lang="ts">
import { computed } from "vue";
import { useCountryData } from "../composables/useCountryData";
import { useDistanceUnit } from "../composables/useDistanceUnit";
import { useRadio } from "../composables/useRadio";
import { hintFor } from "../utils/guessHint";

const props = defineProps<{
  guesses: string[];
}>();

const maxGuesses = 5;
const { secretCountry } = useRadio();
const { getFeature } = useCountryData();
const { toggleUnit, formatDistance } = useDistanceUnit();

const guessRows = computed(() => {
  return Array.from({ length: maxGuesses }, (_, i) => {
    const guessName = props.guesses[i];
    if (!guessName) {
      return {
        hasGuess: false,
        num: i + 1,
      };
    }

    const hint = hintFor(guessName, secretCountry.value, getFeature);
    const isDark = hint.level != null && hint.level >= 5;
    const isTouching = hint.distance === 0 && hint.level !== 0;
    const formattedDistance = hint.distance != null ? formatDistance(hint.distance) : "";

    return {
      hasGuess: true,
      num: i + 1,
      name: guessName,
      color: hint.color,
      isDark,
      isTouching,
      formattedDistance,
      emoji: hint.emoji,
    };
  });
});
</script>

<template>
  <div class="w-full">
    <div class="space-y-3">
      <div
        v-for="row in guessRows"
        :key="row.num"
        class="flex items-center gap-4 p-3 rounded-xl border-3 transition-all"
        :class="
          row.hasGuess
            ? 'border-pencil-lead shadow-[0_2px_0_0_#334155] cursor-pointer select-none'
            : 'border-eraser-grey border-dashed bg-transparent opacity-60'
        "
        :style="{
          backgroundColor: row.hasGuess ? row.color : undefined,
        }"
        @click="row.hasGuess && toggleUnit()"
      >
        <div
          class="flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-heading font-bold"
          :class="
            row.hasGuess
              ? 'bg-gumball-blue border-pencil-lead text-white'
              : 'bg-transparent border-eraser-grey text-eraser-grey'
          "
        >
          {{ row.num }}
        </div>
        <div class="flex-1 font-heading min-w-0 flex items-center justify-between gap-1">
          <template v-if="row.hasGuess">
            <span
              class="text-base truncate"
              :class="row.isDark ? 'text-white' : 'text-pencil-lead'"
              >{{ row.name }}</span
            >
            <div class="flex items-center justify-end gap-2 shrink-0 min-w-[60px]">
              <span
                v-if="row.isTouching"
                class="text-xs italic font-bold font-body"
                :class="row.isDark ? 'text-white/90' : 'text-pencil-lead/80'"
              >
                TOUCHING
              </span>
              <span
                v-else
                class="text-sm font-bold font-body"
                :class="row.isDark ? 'text-white/90' : 'text-pencil-lead/80'"
              >
                {{ row.formattedDistance }}
              </span>
              <span class="text-xl leading-none tracking-widest">
                {{ row.emoji }}
              </span>
            </div>
          </template>
          <span v-else class="text-eraser-grey italic text-lg">Empty</span>
        </div>
      </div>
    </div>
  </div>
</template>
