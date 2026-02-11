<script setup lang="ts">
import { ArrowRight, Check, Share, X } from 'lucide-vue-next'
import { ref } from 'vue'
import CountryDetails from './CountryDetails.vue'

const props = defineProps<{
  show: boolean
  isWin?: boolean
  secretCountry?: string
  shareText?: string
  resultsGrid?: string
  dailyChallengeNumber?: number
  numericScore?: number
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'close'): void
}>()

const copyButtonText = ref('Click to copy your shareable score')

const handleShare = async () => {
  if (props.shareText) {
    try {
      await navigator.clipboard.writeText(props.shareText)
      copyButtonText.value = 'Copied!'
      setTimeout(() => {
        copyButtonText.value = 'Click to copy your shareable score'
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
        class="relative bg-paper-white w-full max-w-sm max-h-[85vh] flex flex-col rounded-[2rem] border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] text-center animate-bounce-in"
      >
        <!-- Close (X) Button -->
        <button
          @click="emit('close')"
          class="absolute top-3 right-3 z-10 p-1.5 text-pencil-lead/50 hover:text-pencil-lead transition-colors"
        >
          <X class="w-5 h-5" />
        </button>

        <!-- Scrollable content -->
        <div class="overflow-y-auto p-6 pb-0 min-h-0">
          <!-- Icon/Emoji + Header -->
          <div class="mb-3">
            <span class="text-5xl">{{ isWin ? '🎉' : '🤔' }}</span>
            <h2
              class="text-2xl font-heading mt-2 tracking-wide"
              :class="isWin ? 'text-mint-shake' : 'text-berry-oops'"
            >
              {{ isWin ? 'Nice work!' : 'Game Over!' }}
            </h2>
          </div>

          <!-- Secret Country -->
          <p class="text-base text-pencil-lead/80 mb-4 leading-relaxed">
            The country was:
            <strong class="text-pencil-lead font-bold">{{
              secretCountry || 'Unknown'
            }}</strong>
          </p>

          <!-- Emoji Grid + Score -->
          <div v-if="resultsGrid" class="mb-4 rounded-xl p-3 border-2 border-pencil-lead/10">
            <div
              class="flex items-center justify-center gap-3"
              :class="{ 'mb-2.5': dailyChallengeNumber && shareText }"
            >
              <span class="font-mono text-2xl tracking-widest leading-relaxed whitespace-pre font-bold">
                {{ resultsGrid }}
              </span>
              <span
                v-if="numericScore != null"
                class="text-lg font-heading text-pencil-lead/70"
              >
                {{ numericScore.toFixed(1) }}/10
              </span>
            </div>

            <!-- Share Button (daily challenge only) -->
            <button
              v-if="dailyChallengeNumber && shareText"
              @click="handleShare"
              class="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-pencil-lead/60 hover:text-pencil-lead transition-colors cursor-pointer"
            >
              <Check
                v-if="copyButtonText === 'Copied!'"
                class="w-5 h-5 text-mint-shake"
              />
              <Share v-else class="w-5 h-5" />
              <span :class="{ 'text-mint-shake': copyButtonText === 'Copied!' }">
                {{ copyButtonText }}
              </span>
            </button>
          </div>

          <!-- Country Details -->
          <CountryDetails v-if="secretCountry" :country-name="secretCountry" :show-name="false" class="mb-4 text-left" />
        </div>

        <!-- Fixed bottom button -->
        <div class="shrink-0 p-6 pt-3">
          <button
            @click="emit('close')"
            class="w-full btn-pressable bg-yuzu-yellow h-[48px] rounded-xl font-heading text-lg text-pencil-lead uppercase tracking-wider border-2 border-pencil-lead shadow-[4px_4px_0_0_#334155] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
          >
            See the stations <ArrowRight class="w-5 h-5" />
          </button>
        </div>
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
