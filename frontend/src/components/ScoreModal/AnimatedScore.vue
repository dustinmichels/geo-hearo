<template>
  <div class="animated-score">{{ formattedScore }} Mm</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

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

// Computed property to format the score as a decimal
const formattedScore = computed(() => (currentScore.value / 1000).toFixed(3))

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
