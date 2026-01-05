<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import PlayDesktop from './PlayDesktop.vue'
import PlayMobile from './PlayMobile.vue'
import { useRadio } from '../composables/useRadio'

const isMobile = ref(false)
const { secretCountry } = useRadio()
const isDebug = import.meta.env.VITE_DEBUG_MODE === 'true'

const checkDevice = () => {
  isMobile.value = window.innerWidth < 1024 // standard tablet/mobile breakpoint
}

onMounted(() => {
  checkDevice()
  window.addEventListener('resize', checkDevice)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkDevice)
})
</script>

<template>
  <div
    v-if="isDebug"
    class="fixed top-0 left-0 bg-red-500 text-white px-2 py-1 z-[9999] pointer-events-none font-bold text-sm"
  >
    DEBUG: {{ secretCountry }}
  </div>
  <PlayMobile v-if="isMobile" />
  <PlayDesktop v-else />
</template>
