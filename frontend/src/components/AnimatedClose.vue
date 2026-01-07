<script setup lang="ts">
import { ref, onMounted } from 'vue'
import gsap from 'gsap'
import { X } from 'lucide-vue-next'

const xLeft = ref(null)
const xRight = ref(null)

onMounted(() => {
  gsap.to([xLeft.value, xRight.value], {
    scale: 1.2,
    opacity: 1,
    duration: 1.2,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
  })
})
</script>

<template>
  <div
    class="absolute top-2 left-0 right-0 z-20 flex justify-center gap-48 pointer-events-none"
  >
    <!-- Left X -->
    <div
      ref="xLeft"
      class="text-white drop-shadow-md cursor-pointer pointer-events-auto opacity-80"
    >
      <X :size="32" :stroke-width="4" />
    </div>

    <!-- Right X -->
    <div
      ref="xRight"
      class="text-white drop-shadow-md cursor-pointer pointer-events-auto opacity-80"
    >
      <X :size="32" :stroke-width="4" />
    </div>
  </div>
</template>
