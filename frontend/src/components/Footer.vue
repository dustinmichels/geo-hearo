<script setup lang="ts">
import { usePwaInstall } from '@/composables/usePwaInstall'

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
    <RouterLink
      to="/privacy"
      class="font-heading text-eraser-grey hover:text-bubblegum-pop transition-colors"
    >
      Privacy
    </RouterLink>
    <span class="text-eraser-grey">&bull;</span>
    <span class="font-heading text-eraser-grey">
      Created by
      <a
        href="https://dustinmichels.com/"
        target="_blank"
        class="hover:text-bubblegum-pop transition-colors underline decoration-1 decoration-bubblegum-pop/30 underline-offset-2"
        >Dustin Michels</a
      >
      © 2026
    </span>
    <button
      v-if="canInstall"
      class="font-heading text-eraser-grey hover:text-bubblegum-pop transition-colors cursor-pointer"
      @click="installApp"
    >
      Install App
    </button>
  </div>
</template>
