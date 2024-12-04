<template>
  <div class="fixed-grid has-3-cols">
    <div class="grid">
      <!-- Top Left -->
      <div class="cell">
        <div class="">
          <img :src="IconPrev" />
        </div>
      </div>

      <!-- Top Center -->
      <div class="cell">
        <div class="">
          <div class="" @click="togglePlay">
            <img
              :src="CoverImageDefault"
              alt=""
              :class="`${isPlaying ? 'audio__player-spin-anim' : ''}`"
            />
            <div class="">
              <img :src="isPlaying ? IconPause : IconPlay" />
            </div>
          </div>
        </div>
      </div>

      <!-- Top Right -->
      <div class="cell">
        <div class="">
          <img :src="IconNext" />
        </div>
      </div>

      <!-- Bottom -->
      <div class="cell is-col-span-3 flex-center">
        <div>
          <div class="square-radio-group">
            <div class="square-radio">
              <input type="radio" id="option1" name="square-radio" checked />
              <label for="option1">1</label>
            </div>
            <div class="square-radio">
              <input type="radio" id="option2" name="square-radio" />
              <label for="option2">2</label>
            </div>
            <div class="square-radio">
              <input type="radio" id="option3" name="square-radio" />
              <label for="option3">3</label>
            </div>
            <div class="square-radio">
              <input type="radio" id="option4" name="square-radio" />
              <label for="option4">4</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <ul>
    <li v-for="station in radioStations" :key="station.channel_id">
      {{ station.channel_url }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import CoverImageDefault from '../assets/images/cover.png'
import IconNext from '../assets/images/next.png'
import IconPause from '../assets/images/pause.png'
import IconPlay from '../assets/images/play.png'
import IconPrev from '../assets/images/prev.png'

import { RadioStationWithStreamingUrl } from '../types'

defineProps<{
  radioStations: RadioStationWithStreamingUrl[]
}>()

const isPlaying = ref(false)

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
}

// capture space bar events
const handleKeydown = (event: KeyboardEvent) => {
  if (event.code === 'Space') {
    event.preventDefault() // Prevent the default spacebar action (scrolling)
    togglePlay()
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
.cell {
  border: 1px solid #ccc;
}

/* ----- audio player ----- */
.audio__player {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.audio__player-play {
  position: relative;
}
.audio__player-play:active,
.audio__player-play img:active {
  opacity: 0.75;
}
.audio__player-play img {
  width: 6.8rem;
  height: 6.8rem;
  border-radius: 9999px;
}
.audio__player-play-icon {
  position: absolute;
  top: 1.8rem;
  left: 1.8rem;
  background: #f0f0f0;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  padding: 0.5rem 0.5rem;
  opacity: 0.8;
  will-change: filter;
}

.audio__player-play-icon:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.audio__player-play-icon img {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
}

.audio__player-button {
  top: 1.8rem;
  left: 1.8rem;
  background: #f0f0f0;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  padding: 0.5rem 0.5rem;
  opacity: 0.8;
  will-change: filter;
}
.audio__player-button:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.audio__player-button img {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
}

/* ----- radio buttons ----- */
/* Styling the radio button to look like a square */
.square-radio input[type='radio'] {
  display: none; /* Hide the default radio input */
}
.square-radio label {
  display: inline-block;
  width: 30px;
  height: 30px;
  border: 2px solid #00d1b2; /* Bulma primary color */
  border-radius: 4px; /* Square corners */
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}
.square-radio input[type='radio']:checked + label {
  background-color: #00d1b2; /* Bulma primary color */
  border-color: #00a38c;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}
.square-radio label:hover {
  background-color: #f0f8f7; /* Light hover effect */
}
/* Aligning buttons in a row */
.square-radio-group {
  display: flex;
  gap: 10px; /* Space between the buttons */
}

/* ----- spinning animation ----- */
@keyframes audio__player-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.audio__player-spin-anim {
  animation: audio__player-spin 5s linear infinite;
}
</style>
