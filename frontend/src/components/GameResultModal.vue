<script setup lang="ts">
import { Check, Share, X } from 'lucide-vue-next'
import { ref } from 'vue'

const props = defineProps<{
  show: boolean
  isWin?: boolean
  secretCountry?: string
  shareText?: string
  resultsGrid?: string
  dailyChallengeNumber?: number
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'close'): void
}>()

const copyButtonText = ref('Share Results')

const handleShare = async () => {
  if (props.shareText) {
    try {
      await navigator.clipboard.writeText(props.shareText)
      copyButtonText.value = 'Copied!'
      setTimeout(() => {
        copyButtonText.value = 'Share Results'
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
      copyButtonText.value = 'Failed'
    }
  }
}
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
        <!-- Close (X) Button -->
        <button
          @click="emit('close')"
          class="absolute top-4 right-4 p-2 text-pencil-lead/50 hover:text-pencil-lead transition-colors"
        >
          <X class="w-6 h-6" />
        </button>

        <!-- Icon/Emoji -->
        <div class="text-6xl mb-4">
          {{ isWin ? '🎉' : '🤔' }}
        </div>

        <!-- Header -->
        <h2 class="text-3xl font-heading text-pencil-lead mb-4 tracking-wide">
          {{ isWin ? 'Nice work!' : 'Game Over!' }}
        </h2>

        <!-- Secret Country -->
        <p class="text-lg text-pencil-lead/80 mb-6 leading-relaxed">
          The secret country was:
          <br />
          <strong class="text-pencil-lead font-bold">{{
            secretCountry || 'Unknown'
          }}</strong>
        </p>

        <!-- Emoji Grid -->
        <div
          v-if="resultsGrid"
          class="mb-6 bg-paper-white/50 rounded-xl p-4 border-2 border-pencil-lead/10 font-mono text-2xl tracking-widest leading-relaxed whitespace-pre font-bold text-center"
        >
          {{ resultsGrid }}
        </div>

        <!-- Daily Challenge Message -->
        <div
          v-if="dailyChallengeNumber"
          class="mb-6 text-sm text-pencil-lead/70"
        >
          You just completed daily challenge #{{ dailyChallengeNumber }}. Click
          to share your result with friends.
        </div>

        <!-- Share Button (Daily Challenge) -->
        <button
          v-if="dailyChallengeNumber && shareText"
          @click="handleShare"
          class="w-full mb-4 btn-pressable bg-cloud-white h-[56px] rounded-xl font-heading text-xl text-pencil-lead uppercase tracking-wider border-2 border-pencil-lead shadow-[4px_4px_0_0_#334155] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
        >
          <Check v-if="copyButtonText === 'Copied!'" class="w-6 h-6" />
          <Share v-else class="w-6 h-6" />
          {{ copyButtonText }}
        </button>

        <!-- Close Button -->
        <button
          @click="emit('close')"
          class="w-full btn-pressable bg-yuzu-yellow h-[56px] rounded-xl font-heading text-xl text-pencil-lead uppercase tracking-wider border-2 border-pencil-lead shadow-[4px_4px_0_0_#334155] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center"
        >
          See the stations 📻
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
