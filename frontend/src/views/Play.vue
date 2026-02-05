<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useOnboarding } from '../composables/useOnboarding'
import { useRadio } from '../composables/useRadio'
import PlayDesktop from './PlayDesktop.vue'
import PlayMobile from './PlayMobile.vue'

const isMobile = ref(window.innerWidth < 1024)
const { secretCountry } = useRadio()
const isDebug = import.meta.env.VITE_DEBUG_MODE === 'true'
const { startTour } = useOnboarding()

const checkDevice = () => {
  isMobile.value = window.innerWidth < 1024 // standard tablet/mobile breakpoint
}

onMounted(() => {
  checkDevice()
  window.addEventListener('resize', checkDevice)
  // Give child components time to mount and settle
  setTimeout(() => {
    startTour()
  }, 1000)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkDevice)
})
</script>

<template>
  <div
    v-if="isDebug"
    class="fixed top-0 left-0 bg-[#00ffff] text-black px-2 py-1 z-[9999] pointer-events-none font-bold text-sm"
  >
    DEBUG: {{ secretCountry }}
  </div>
  <PlayMobile v-if="isMobile" />
  <PlayDesktop v-else />
</template>
