<template>
  <div>
    <!-- Trigger Button -->
    <button class="button is-primary" @click="openModal">Open Modal</button>

    <!-- Modal -->
    <div
      class="modal"
      :class="{ 'is-active': isModalActive }"
      @keydown.esc="closeModal"
    >
      <div class="modal-background" @click="closeModal"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Game!</p>
          <button
            class="delete"
            aria-label="close"
            @click="closeModal"
          ></button>
        </header>
        <section class="modal-card-body">
          <!-- Original Content -->
          <div class="box">
            <p
              class="has-text-right"
              v-for="(number, index) in numbers"
              :key="index"
            >
              {{ index === numbers.length - 1 ? '+' + number : number }}
            </p>
            <hr />
            <AnimatedScore :targetScore="totalScore" :duration="1000" />
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-success" @click="closeModal">Close</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { CountryGuessed } from '../../types'
import AnimatedScore from './AnimatedScore.vue'

const props = defineProps<{
  guessed: CountryGuessed[]
}>()

const isModalActive = ref(false)
// const numbers = [10, 20, 30, 40, 50] // Example numbers array

const numbers = computed(() =>
  props.guessed
    .map((guess) => guess.distance)
    .filter((distance): distance is number => distance !== undefined)
)

let totalScore = 0

function openModal() {
  isModalActive.value = true
  totalScore = numbers.value.reduce((acc, number) => acc + number, 0)
}

function closeModal() {
  isModalActive.value = false
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isModalActive.value) {
    closeModal()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.box {
  max-width: 200px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f5f5f5;
}

.has-text-right {
  text-align: right;
  font-family: monospace;
  margin: 5px 0;
}

hr {
  border: none;
  border-top: 1px solid #ccc;
  margin: 10px 0;
}

.modal-card {
  max-width: 400px;
  margin: auto;
}
</style>
