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
  <div class="bg-white rounded-xl shadow-md p-6 w-full">
    <!-- Controls -->
    <div class="flex items-center justify-center gap-4 mb-6">
      <van-button
        plain
        class="!h-12 !w-12 !p-0 !rounded-lg !border-gray-200 shadow-sm"
        @click="emit('previous')"
      >
        <SkipBack class="h-5 w-5 text-gray-700" />
      </van-button>

      <van-button
        type="primary"
        round
        class="!h-14 !w-14 !p-0 shadow-md"
        @click="emit('playPause')"
      >
        <Pause v-if="isPlaying" class="h-6 w-6" />
        <Play v-else class="h-6 w-6 ml-0.5" />
      </van-button>

      <van-button
        plain
        class="!h-12 !w-12 !p-0 !rounded-lg !border-gray-200 shadow-sm"
        @click="emit('next')"
      >
        <SkipForward class="h-5 w-5 text-gray-700" />
      </van-button>
    </div>

    <!-- Station Indicators -->
    <div class="flex justify-center gap-2">
      <div
        v-for="station in 5"
        :key="station"
        class="h-2 w-2 rounded-full transition-all"
        :class="currentStation === station ? 'bg-blue-600 w-8' : 'bg-gray-300'"
      />
    </div>
  </div>
</template>
