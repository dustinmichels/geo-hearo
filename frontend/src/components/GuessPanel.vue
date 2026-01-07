<script setup lang="ts">
import { Field as VanField } from 'vant'
import { ref } from 'vue'
import PanelFooter from './Footer.vue'
import GuessDisplay from './GuessDisplay.vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    guesses: string[]
    withFooter?: boolean
  }>(),
  {
    withFooter: true,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'add-guess'): void
}>()

const isShaking = ref(false)

const handleGuess = () => {
  // Trigger shake animation
  isShaking.value = true
  setTimeout(() => {
    isShaking.value = false
  }, 500)

  if (navigator.vibrate) {
    navigator.vibrate(200)
  }
  emit('add-guess')
}
</script>

<template>
  <div class="flex flex-col h-full w-full max-w-md mx-auto pt-3">
    <div class="px-4 pb-4 flex-1 overflow-y-auto flex flex-col gap-6">
      <!-- Input Area -->
      <div class="flex gap-3 items-center">
        <van-field
          :model-value="modelValue"
          @update:model-value="emit('update:modelValue', $event)"
          placeholder="Select a country"
          :disabled="guesses.length >= 5"
          readonly
          @keypress.enter="handleGuess"
          class="flex-1 !border-3 !border-pencil-lead !rounded-2xl !py-3 !px-4 !text-[18px] font-body placeholder:text-eraser-grey transition-colors bg-white hover:bg-white active:bg-white focus:bg-white"
          :class="{ 'has-value': !!modelValue }"
          :border="false"
        />
        <button
          @click="handleGuess"
          :disabled="!modelValue.trim() || guesses.length >= 5"
          :class="{ shake: isShaking }"
          class="btn-pressable bg-yuzu-yellow h-[52px] px-6 rounded-xl font-heading text-lg text-pencil-lead uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Guess {{ Math.min(guesses.length + 1, 5) }}/5
        </button>
      </div>

      <!-- Guesses Display -->
      <GuessDisplay :guesses="guesses" />

      <!-- Navigation Links -->
      <PanelFooter v-if="withFooter" />
    </div>
  </div>
</template>

<style scoped>
.shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}

/* Force pink text on inner input when value is present */
.has-value :deep(.van-field__control) {
  color: #f472b6 !important; /* bubblegum-pop */
  font-weight: 700 !important;
  -webkit-text-fill-color: #f472b6 !important; /* Safari override for readonly inputs */
  opacity: 1 !important; /* Ensure opacity hasn't been lowered */
}

/* Default text color */
:not(.has-value) :deep(.van-field__control) {
  color: #334155 !important; /* pencil-lead */
}
</style>
