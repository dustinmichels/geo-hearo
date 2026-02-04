<script setup lang="ts">
import { X } from 'lucide-vue-next'
</script>

<template>
  <div
    class="absolute top-2 left-0 right-0 z-20 flex justify-center gap-48 pointer-events-none"
  >
    <!-- Left X -->
    <div
      class="animate-close-pulse bg-paper-white text-berry-oops border-2 border-pencil-lead rounded-full p-1 drop-shadow-md cursor-pointer pointer-events-auto"
    >
      <X :size="32" :stroke-width="4" />
    </div>

    <!-- Right X -->
    <div
      class="animate-close-pulse bg-paper-white text-berry-oops border-2 border-pencil-lead rounded-full p-1 drop-shadow-md cursor-pointer pointer-events-auto"
    >
      <X :size="32" :stroke-width="4" />
    </div>
  </div>
</template>
