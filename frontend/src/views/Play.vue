<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import PlayDesktop from './PlayDesktop.vue'
import PlayMobile from './PlayMobile.vue'

const isMobile = ref(false)

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
  <PlayMobile v-if="isMobile" />
  <PlayDesktop v-else />
</template>
