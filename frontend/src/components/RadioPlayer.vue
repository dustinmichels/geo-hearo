<script setup lang="ts">
import { useGameStore } from '@/stores/game'
import { Loader2, Pause, Play, SkipBack, SkipForward } from 'lucide-vue-next'
import { Button as VanButton } from 'vant'
import { onUnmounted, ref, watch } from 'vue'
import { playRadioStatic } from '../utils/audio'

const store = useGameStore()

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
const isLoading = ref(false)
let loadingTimeout: ReturnType<typeof setTimeout> | undefined

const stopStatic = () => {
  if (currentStaticSource.value) {
    try {
      currentStaticSource.value.stop()
    } catch (e) {
      // ignore
    }
    currentStaticSource.value = null
  }
}

const playStatic = () => {
  stopStatic()
  const source = playRadioStatic()
  if (source) {
    currentStaticSource.value = source
  }
}

const onAudioPlaying = () => {
  isLoading.value = false
  stopStatic()
}

watch(
  () => props.isPlaying,
  (playing) => {
    if (!audioPlayer.value) return
    if (playing) {
      isLoading.value = true
      playStatic()
      audioPlayer.value.play().catch((e) => {
        if (e.name === 'AbortError') return
        isLoading.value = false
        stopStatic()
        console.error('Playback failed', e)
      })
    } else {
      isLoading.value = false
      audioPlayer.value.pause()
      stopStatic()
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
        isLoading.value = true
        // Manually trigger timer reset since isLoading might not change
        if (loadingTimeout) clearTimeout(loadingTimeout)
        loadingTimeout = setTimeout(() => {
          if (isLoading.value) {
            console.log('Loading timed out, skipping to next station')
            isLoading.value = false // Stop loading state locally
            onNext()
          }
        }, 5000)

        playStatic()
        audioPlayer.value.play().catch((e) => {
          if (e.name === 'AbortError') return
          isLoading.value = false
          stopStatic()
          console.error('Playback failed', e)
        })
      }
    }
  }
)

watch(isLoading, (loading) => {
  if (loading) {
    // Clear any existing timeout just in case
    if (loadingTimeout) clearTimeout(loadingTimeout)
    // Set new timeout
    loadingTimeout = setTimeout(() => {
      if (isLoading.value) {
        console.log('Loading timed out, skipping to next station')
        isLoading.value = false // Stop loading state locally
        onNext()
      }
    }, 5000)
  } else {
    // Clear timeout if loading stops
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
      loadingTimeout = undefined
    }
  }
})

watch(
  () => props.isPlaying,
  (playing) => {
    if (playing) {
      store.hasPlayedRadio = true
    }
  },
  { immediate: true }
)

const onPrevious = () => {
  store.hasSkippedStation = true
  emit('previous')
}

const onNext = () => {
  store.hasSkippedStation = true
  emit('next')
}

onUnmounted(() => {
  if (loadingTimeout) clearTimeout(loadingTimeout)
  stopStatic()
})
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
      <div class="relative">
        <div
          v-if="store.hasPlayedRadio && !store.hasSkippedStation"
          class="magic-container"
        >
          <div class="magic-wave wave-1"></div>
          <div class="magic-wave wave-2"></div>
        </div>
        <van-button
          id="tour-skip-back-btn"
          plain
          class="relative z-10 !p-0 !rounded-xl !border-3 !border-pencil-lead !bg-white shadow-none text-pencil-lead"
          :class="compact ? '!h-10 !w-10' : '!h-12 !w-12'"
          @click="onPrevious"
        >
          <SkipBack
            class="text-pencil-lead"
            :class="compact ? 'h-5 w-5' : 'h-6 w-6'"
          />
        </van-button>
      </div>

      <div class="relative group">
        <div v-if="!store.hasPlayedRadio" class="magic-container">
          <div class="magic-wave wave-1"></div>
          <div class="magic-wave wave-2"></div>
        </div>
        <van-button
          id="tour-play-btn"
          type="primary"
          round
          class="relative z-10 !p-0 !border-3 !border-pencil-lead shadow-[0_4px_0_0_#334155] active:translate-y-1 active:shadow-none transition-all duration-100 bg-gumball-blue"
          :class="compact ? '!h-14 !w-14' : '!h-16 !w-16'"
          @click="emit('playPause')"
        >
          <Loader2
            v-if="isLoading"
            class="animate-spin text-white"
            :class="compact ? 'h-6 w-6' : 'h-8 w-8'"
          />
          <Pause
            v-else-if="isPlaying"
            class="text-white fill-current"
            :class="compact ? 'h-6 w-6' : 'h-8 w-8'"
          />
          <Play
            v-else
            class="ml-1 text-white fill-current"
            :class="compact ? 'h-6 w-6' : 'h-8 w-8'"
          />
        </van-button>
      </div>

      <div class="relative">
        <div
          v-if="store.hasPlayedRadio && !store.hasSkippedStation"
          class="magic-container"
        >
          <div class="magic-wave wave-1"></div>
          <div class="magic-wave wave-2"></div>
        </div>
        <van-button
          id="tour-skip-forward-btn"
          plain
          class="relative z-10 !p-0 !rounded-xl !border-3 !border-pencil-lead !bg-white shadow-none text-pencil-lead"
          :class="compact ? '!h-10 !w-10' : '!h-12 !w-12'"
          @click="onNext"
        >
          <SkipForward
            class="text-pencil-lead"
            :class="compact ? 'h-5 w-5' : 'h-6 w-6'"
          />
        </van-button>
      </div>
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

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes ripple {
  0% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.magic-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.magic-wave {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  opacity: 0;
  animation: ripple 3s infinite cubic-bezier(0, 0, 0.2, 1);
}

.wave-1 {
  background-color: rgba(244, 114, 182, 0.5); /* Bubblegum Pop */
  animation-delay: 0s;
}

.wave-2 {
  background-color: rgba(244, 114, 182, 0.5); /* Bubblegum Pop */
  animation-delay: 1.5s;
}
</style>
