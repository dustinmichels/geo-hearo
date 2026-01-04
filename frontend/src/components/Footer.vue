<script setup lang="ts">
const version = import.meta.env.VITE_GIT_HASH || 'dev'
</script>

<template>
  <div class="mt-auto pt-6 pb-4 text-center">
    <div class="flex items-center justify-center gap-6">
      <RouterLink
        to="/about"
        class="text-lg font-heading text-eraser-grey hover:text-bubblegum-pop transition-colors"
      >
        About
      </RouterLink>
      <RouterLink
        to="/"
        class="text-lg font-heading text-eraser-grey hover:text-bubblegum-pop transition-colors flex items-center gap-2"
      >
        <span>←</span> Back to Home
      </RouterLink>
    </div>
    <div class="text-[10px] text-eraser-grey mt-2">Hash #{{ version }}</div>
  </div>
</template>
