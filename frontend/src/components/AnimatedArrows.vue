<script setup lang="ts">
import { ref, onMounted } from 'vue'
import gsap from 'gsap'
import { ChevronDown } from 'lucide-vue-next'

const arrowLeft1 = ref(null)
const arrowLeft2 = ref(null)
const arrowLeft3 = ref(null)
const arrowRight1 = ref(null)
const arrowRight2 = ref(null)
const arrowRight3 = ref(null)

onMounted(() => {
  gsap.to(
    [
      arrowLeft1.value,
      arrowLeft2.value,
      arrowLeft3.value,
      arrowRight1.value,
      arrowRight2.value,
      arrowRight3.value,
    ],
    {
      y: 6,
      opacity: 0.5,
      stagger: 0.2,
      duration: 0.8,
      yoyo: true,
      repeat: -1,
      ease: 'power1.inOut',
    }
  )
})
</script>

<template>
  <div
    class="absolute top-2 left-0 right-0 z-20 flex justify-center gap-48 pointer-events-none transition-opacity duration-300"
  >
    <!-- Left Arrows -->
    <div class="flex flex-col items-center pointer-events-auto cursor-pointer">
      <div ref="arrowLeft1" class="text-yuzu-yellow drop-shadow-sm">
        <ChevronDown :size="42" :stroke-width="3" />
      </div>
      <div ref="arrowLeft2" class="-mt-6 text-yuzu-yellow/80 drop-shadow-sm">
        <ChevronDown :size="42" :stroke-width="3" />
      </div>
      <div ref="arrowLeft3" class="-mt-6 text-yuzu-yellow/60 drop-shadow-sm">
        <ChevronDown :size="42" :stroke-width="3" />
      </div>
    </div>

    <!-- Right Arrows -->
    <div class="flex flex-col items-center pointer-events-auto cursor-pointer">
      <div ref="arrowRight1" class="text-yuzu-yellow drop-shadow-sm">
        <ChevronDown :size="42" :stroke-width="3" />
      </div>
      <div ref="arrowRight2" class="-mt-6 text-yuzu-yellow/80 drop-shadow-sm">
        <ChevronDown :size="42" :stroke-width="3" />
      </div>
      <div ref="arrowRight3" class="-mt-6 text-yuzu-yellow/60 drop-shadow-sm">
        <ChevronDown :size="42" :stroke-width="3" />
      </div>
    </div>
  </div>
</template>
