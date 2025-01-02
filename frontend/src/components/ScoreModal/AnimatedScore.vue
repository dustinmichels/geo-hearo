<template>
  <div class="animated-score">
    {{ currentScore }}
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  targetScore: number
  duration: number
}>()

const currentScore = ref(0)
const startTime = ref<number | null>(null)

const animate = (timestamp: number) => {
  if (!startTime.value) startTime.value = timestamp
  const elapsed = timestamp - startTime.value
  const progress = Math.min(elapsed / props.duration, 1)

  currentScore.value = Math.floor(progress * props.targetScore)

  if (progress < 1) {
    requestAnimationFrame(animate)
  } else {
    startTime.value = null // Reset for potential future animations
  }
}

watch(
  () => props.targetScore,
  () => {
    startTime.value = null
    currentScore.value = 0
    requestAnimationFrame(animate)
  },
  { immediate: true }
)
</script>

<style scoped>
.animated-score {
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  margin: 20px;
}
</style>
