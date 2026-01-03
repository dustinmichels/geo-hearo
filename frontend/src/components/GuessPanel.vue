<script setup lang="ts">
import { Field as VanField } from 'vant'
import { ref } from 'vue'
import GuessDisplay from './GuessDisplay.vue'

defineProps<{
  modelValue: string
  guesses: string[]
}>()

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

  // Haptic feedback (longer duration might help detection)
  if (navigator.vibrate) {
    navigator.vibrate(200)
  }
  emit('add-guess')
}

const version = import.meta.env.VITE_GIT_HASH || 'dev'
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
          class="flex-1 !border-3 !border-pencil-lead !rounded-2xl !py-3 !px-4 !text-[18px] font-body text-pencil-lead placeholder:text-eraser-grey bg-white"
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
      <div class="mt-auto pt-6 pb-4 text-center">
        <div class="flex items-center justify-center gap-6">
          <RouterLink
            to="/about"
            class="text-lg font-heading text-eraser-grey hover:text-bubblegum-pop transition-colors"
          >
            About
          </RouterLink>
          <RouterLink
            to="/"
            class="text-lg font-heading text-eraser-grey hover:text-bubblegum-pop transition-colors flex items-center gap-2"
          >
            <span>←</span> Back to Home
          </RouterLink>
        </div>
        <div class="text-[10px] text-eraser-grey mt-2">Hash #{{ version }}</div>
      </div>
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
</style>
