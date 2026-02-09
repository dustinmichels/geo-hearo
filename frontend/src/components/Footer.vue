<script setup lang="ts">
import { usePwaInstall } from '@/composables/usePwaInstall'

const version = import.meta.env.VITE_GIT_HASH || 'dev'
const { canInstall, installApp } = usePwaInstall()
</script>

<template>
  <div class="mt-auto py-4 flex items-center justify-center gap-4">
    <RouterLink
      to="/"
      class="font-heading text-eraser-grey hover:text-bubblegum-pop transition-colors"
    >
      Home
    </RouterLink>
    <RouterLink
      to="/about"
      class="font-heading text-eraser-grey hover:text-bubblegum-pop transition-colors flex items-center gap-2"
    >
      About
    </RouterLink>
    <button
      v-if="canInstall"
      class="font-heading text-eraser-grey hover:text-bubblegum-pop transition-colors cursor-pointer"
      @click="installApp"
    >
      Install App
    </button>
    <div class="text-[10px] text-eraser-grey">Hash #{{ version }}</div>
  </div>
</template>
