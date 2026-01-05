<script setup lang="ts">
import { Play, Pause, SkipBack, SkipForward } from 'lucide-vue-next'
import { Button as VanButton } from 'vant'
import { ref, watch } from 'vue'

const props = defineProps<{
  isPlaying: boolean
  currentStation: number
  stationUrl?: string
}>()

const emit = defineEmits<{
  (e: 'playPause'): void
  (e: 'previous'): void
  (e: 'next'): void
}>()

const audioPlayer = ref<HTMLAudioElement | null>(null)

watch(
  () => props.isPlaying,
  (playing) => {
    if (!audioPlayer.value) return
    if (playing) {
      audioPlayer.value.play().catch((e) => {
        console.error('Playback failed', e)
      })
    } else {
      audioPlayer.value.pause()
    }
  }
)

watch(
  () => props.stationUrl,
  (newUrl) => {
    if (!audioPlayer.value) return
    if (newUrl) {
      audioPlayer.value.src = newUrl
      if (props.isPlaying) {
        audioPlayer.value.play().catch((e) => {
          console.error('Playback failed', e)
        })
      }
    }
  }
)
</script>

<template>
  <div
    class="bg-paper-white rounded-2xl border-3 border-pencil-lead shadow-[0_4px_0_0_#334155] p-6 w-full max-w-sm mx-auto relative"
  >
    <!-- Live Indicator -->
    <div
      class="absolute top-3 right-4 flex items-center gap-1.5 pointer-events-none"
    >
      <div
        class="w-2.5 h-2.5 rounded-full border border-pencil-lead transition-colors duration-300"
        :class="
          isPlaying
            ? 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)] animate-blink'
            : 'bg-slate-300'
        "
      />
      <span
        class="font-heading text-xs font-bold text-pencil-lead tracking-wider transition-opacity duration-300"
        :class="isPlaying ? 'opacity-100' : 'opacity-50'"
        >LIVE</span
      >
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-center gap-6 mb-6">
      <van-button
        plain
        class="!h-12 !w-12 !p-0 !rounded-xl !border-3 !border-pencil-lead !bg-white shadow-none text-pencil-lead"
        @click="emit('previous')"
      >
        <SkipBack class="h-6 w-6 text-pencil-lead" />
      </van-button>

      <van-button
        type="primary"
        round
        class="!h-16 !w-16 !p-0 !border-3 !border-pencil-lead shadow-[0_4px_0_0_#334155] active:translate-y-1 active:shadow-none transition-all duration-100 bg-gumball-blue"
        @click="emit('playPause')"
      >
        <Pause v-if="isPlaying" class="h-8 w-8 text-white fill-current" />
        <Play v-else class="h-8 w-8 ml-1 text-white fill-current" />
      </van-button>

      <van-button
        plain
        class="!h-12 !w-12 !p-0 !rounded-xl !border-3 !border-pencil-lead !bg-white shadow-none text-pencil-lead"
        @click="emit('next')"
      >
        <SkipForward class="h-6 w-6 text-pencil-lead" />
      </van-button>
    </div>

    <!-- Station Indicators -->
    <div class="flex justify-center gap-2">
      <div
        v-for="station in 5"
        :key="station"
        class="h-3 rounded-full transition-all border-2 border-pencil-lead"
        :class="
          currentStation === station ? 'bg-bubblegum-pop w-8' : 'bg-white w-3'
        "
      />
    </div>

    <!-- Audio Element -->
    <audio ref="audioPlayer" class="hidden" />
  </div>
</template>

<style scoped>
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.animate-blink {
  animation: blink 1.5s ease-in-out infinite;
}
</style>
