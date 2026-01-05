<script setup lang="ts">
defineProps<{
  show: boolean
  title: string
  message: string
  buttonText: string
  isWin?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[9999] flex items-center justify-center px-6"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-pencil-lead/20 backdrop-blur-sm"
        @click.stop
      ></div>

      <!-- Modal Card -->
      <div
        class="relative bg-paper-white w-full max-w-sm rounded-[2rem] border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] p-8 text-center animate-bounce-in"
      >
        <!-- Icon/Emoji -->
        <div class="text-6xl mb-4">
          {{ isWin ? '🎉' : '🤔' }}
        </div>

        <h2 class="text-3xl font-heading text-pencil-lead mb-4 tracking-wide">
          {{ title }}
        </h2>

        <p class="text-lg text-pencil-lead/80 font-body mb-8 leading-relaxed">
          {{ message }}
        </p>

        <button
          @click="emit('confirm')"
          class="w-full btn-pressable bg-yuzu-yellow h-[56px] rounded-xl font-heading text-xl text-pencil-lead uppercase tracking-wider border-2 border-pencil-lead shadow-[4px_4px_0_0_#334155] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
        >
          {{ buttonText }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.animate-bounce-in {
  animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
