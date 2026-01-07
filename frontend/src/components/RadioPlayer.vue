<script setup lang="ts">
import { Play, Pause, SkipBack, SkipForward } from 'lucide-vue-next'
import { Button as VanButton } from 'vant'
import { ref, watch } from 'vue'
import { playRadioStatic } from '../utils/audio'

const props = withDefaults(
  defineProps<{
    isPlaying: boolean
    currentStation: number
    stationUrl?: string
    compact?: boolean
  }>(),
  {
    compact: false,
  }
)

const emit = defineEmits<{
  (e: 'playPause'): void
  (e: 'previous'): void
  (e: 'next'): void
}>()

const audioPlayer = ref<HTMLAudioElement | null>(null)
const currentStaticSource = ref<AudioBufferSourceNode | null>(null) // Store the source node

const playStatic = () => {
  // Stop any existing static first
  if (currentStaticSource.value) {
    try {
      currentStaticSource.value.stop()
    } catch (e) {
      // ignore
    }
  }
  const source = playRadioStatic()
  if (source) {
    currentStaticSource.value = source
  }
}

const onAudioPlaying = () => {
  if (currentStaticSource.value) {
    try {
      currentStaticSource.value.stop()
    } catch (e) {
      // ignore
    }
    currentStaticSource.value = null
  }
}

watch(
  () => props.isPlaying,
  (playing) => {
    if (!audioPlayer.value) return
    if (playing) {
      playStatic()
      audioPlayer.value.play().catch((e) => {
        console.error('Playback failed', e)
      })
    } else {
      audioPlayer.value.pause()
      // Also stop static if pausing
      if (currentStaticSource.value) {
        try {
          currentStaticSource.value.stop()
        } catch (e) {}
        currentStaticSource.value = null
      }
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
        playStatic()
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
    class="bg-paper-white rounded-2xl border-3 border-pencil-lead shadow-[0_4px_0_0_#334155] w-full max-w-sm mx-auto relative"
    :class="compact ? 'p-3' : 'p-6'"
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
    <div
      class="flex items-center justify-center"
      :class="compact ? 'gap-4 mb-3' : 'gap-6 mb-6'"
    >
      <van-button
        plain
        class="!p-0 !rounded-xl !border-3 !border-pencil-lead !bg-white shadow-none text-pencil-lead"
        :class="compact ? '!h-10 !w-10' : '!h-12 !w-12'"
        @click="emit('previous')"
      >
        <SkipBack
          class="text-pencil-lead"
          :class="compact ? 'h-5 w-5' : 'h-6 w-6'"
        />
      </van-button>

      <van-button
        type="primary"
        round
        class="!p-0 !border-3 !border-pencil-lead shadow-[0_4px_0_0_#334155] active:translate-y-1 active:shadow-none transition-all duration-100 bg-gumball-blue"
        :class="compact ? '!h-14 !w-14' : '!h-16 !w-16'"
        @click="emit('playPause')"
      >
        <Pause
          v-if="isPlaying"
          class="text-white fill-current"
          :class="compact ? 'h-6 w-6' : 'h-8 w-8'"
        />
        <Play
          v-else
          class="ml-1 text-white fill-current"
          :class="compact ? 'h-6 w-6' : 'h-8 w-8'"
        />
      </van-button>

      <van-button
        plain
        class="!p-0 !rounded-xl !border-3 !border-pencil-lead !bg-white shadow-none text-pencil-lead"
        :class="compact ? '!h-10 !w-10' : '!h-12 !w-12'"
        @click="emit('next')"
      >
        <SkipForward
          class="text-pencil-lead"
          :class="compact ? 'h-5 w-5' : 'h-6 w-6'"
        />
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
    <audio ref="audioPlayer" class="hidden" @playing="onAudioPlaying" />
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
