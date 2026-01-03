<script setup lang="ts">
import { Play, Pause, SkipBack, SkipForward } from 'lucide-vue-next'
import { Button as VanButton } from 'vant'

defineProps<{
  isPlaying: boolean
  currentStation: number
}>()

const emit = defineEmits<{
  (e: 'playPause'): void
  (e: 'previous'): void
  (e: 'next'): void
}>()
</script>

<template>
  <div
    class="bg-paper-white rounded-2xl border-3 border-pencil-lead shadow-[0_4px_0_0_#334155] p-6 w-full max-w-sm mx-auto"
  >
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
  </div>
</template>
