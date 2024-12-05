<template>
  <div class="audio__player">
    <div class="audio__player-controls">
      <div class="audio__player-button">
        <img :src="IconPrev" @click="decreaseStation" />
      </div>
      <div class="audio__player-play" @click="togglePlay">
        <img
          :src="CoverImageDefault"
          alt=""
          :class="`${isPlaying ? 'audio__player-spin-anim' : ''}`"
        />
        <div class="audio__player-play-icon">
          <img :src="isPlaying ? IconPause : IconPlay" />
        </div>
      </div>
      <div class="audio__player-button">
        <img :src="IconNext" @click="increaseStation" />
      </div>
    </div>

    <div>
      <div class="square-radio-group">
        <div
          class="square-radio"
          v-for="(station, index) in radioStations"
          :key="station.channel_id"
          @click="selectedStation = index"
        >
          <input
            type="radio"
            :id="station.channel_id"
            name="square-radio"
            :value="index"
            :checked="index === selectedStation"
          />
          <label :for="station.channel_id">{{ index + 1 }}</label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import CoverImageDefault from '../assets/images/cover.png'
import IconNext from '../assets/images/next.png'
import IconPause from '../assets/images/pause.png'
import IconPlay from '../assets/images/play.png'
import IconPrev from '../assets/images/prev.png'

import { RadioStationWithStreamingUrl } from '../types'

const props = defineProps<{
  radioStations: RadioStationWithStreamingUrl[]
}>()

const isPlaying = ref(false)
const selectedStation = ref(0)

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
}

const increaseStation = () => {
  selectedStation.value =
    (selectedStation.value + 1) % props.radioStations.length
}

const decreaseStation = () => {
  selectedStation.value =
    (selectedStation.value - 1 + props.radioStations.length) %
    props.radioStations.length
}

// capture space bar events
const handleKeydown = (event: KeyboardEvent) => {
  if (event.code === 'Space') {
    event.preventDefault() // Prevent the default spacebar action (scrolling)
    togglePlay()
  } else if (event.code === 'ArrowRight') {
    event.preventDefault() // Prevent the default right arrow action (scrolling)
    increaseStation()
  } else if (event.code === 'ArrowLeft') {
    event.preventDefault() // Prevent the default left arrow action (scrolling)
    decreaseStation()
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
/* ----- audio player ----- */
.audio__player {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.audio__player-controls {
  display: flex;
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
