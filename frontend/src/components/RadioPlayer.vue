<script setup lang="ts">
import { Play, Pause, SkipBack, SkipForward } from 'lucide-vue-next'
import Button from './ui/Button.vue'

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
      <Button
        variant="outline"
        size="icon"
        class="h-12 w-12"
        @click="emit('previous')"
      >
        <SkipBack class="h-5 w-5" />
      </Button>

      <Button
        size="icon"
        class="h-14 w-14 rounded-full"
        @click="emit('playPause')"
      >
        <Pause v-if="isPlaying" class="h-6 w-6" />
        <Play v-else class="h-6 w-6 ml-0.5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        class="h-12 w-12"
        @click="emit('next')"
      >
        <SkipForward class="h-5 w-5" />
      </Button>
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
