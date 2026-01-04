<script setup lang="ts">
const version = import.meta.env.VITE_GIT_HASH || 'dev'
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
    <div class="text-[10px] text-eraser-grey">Hash #{{ version }}</div>
  </div>
</template>
