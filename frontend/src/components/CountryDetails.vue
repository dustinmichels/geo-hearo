<script setup lang="ts">
defineProps<{
  countryName: string
}>()
</script>

<template>
  <div class="p-4 flex flex-col items-center gap-4">
    <h2 class="text-2xl font-heading text-pencil-lead tracking-wide">
      {{ countryName }}
    </h2>

    <!-- Image placeholder -->
    <div
      class="w-full max-w-xs aspect-video rounded-2xl border-3 border-pencil-lead bg-sea-blue/10 flex items-center justify-center"
    >
      <span class="text-eraser-grey text-sm font-bold uppercase tracking-wider">
        Image coming soon
      </span>
    </div>
  </div>
</template>
