<template>
  <div class="grid is-col-min-16">
    <div class="cell">
      <div class="audio__player">
        <div class="audio__player-controls">
          <div class="audio__player-button">
            <img :src="IconPrev" @click="decreaseStationIdx" />
          </div>
          <div class="audio__player-play" @click="togglePlay">
            <img
              :src="CoverImageDefault"
              alt=""
              :class="`${isPlaying ? 'audio__player-spin-anim' : ''}`"
            />
            <div class="audio__player-play-icon" v-show="!isLoading">
              <img :src="isPlaying ? IconPause : IconPlay" />
            </div>
            <div class="audio__player-play-icon" v-show="isLoading">
              <img :src="IconLoading" />
            </div>
          </div>
          <div class="audio__player-button">
            <img :src="IconNext" @click="increaseStationIdx" />
          </div>
        </div>
        <div>
          <div class="square-radio-group">
            <div
              class="square-radio"
              v-for="(station, index) in radioStations"
              :key="station.channel_id"
              @click="selectedStationIdx = index"
            >
              <input
                type="radio"
                :id="station.channel_id"
                name="square-radio"
                :value="index"
                :checked="index === selectedStationIdx"
              />
              <label :for="station.channel_id">{{ index + 1 }}</label>
            </div>
          </div>
        </div>
        <audio ref="audioPlayer" :src="audioSrc"></audio>
      </div>
    </div>
    <div class="cell is-flex is-justify-content-center is-align-items-center">
      <table class="table">
        <tbody>
          <tr>
            <td>Station Name</td>
            <td>
              <span v-if="isGameOver">
                {{ radioStations[selectedStationIdx].channel_name }}
              </span>
              <span v-else>????</span>
            </td>
          </tr>
          <tr>
            <td>City</td>
            <td>
              <span v-if="isGameOver">
                {{ radioStations[selectedStationIdx].place_name }}
              </span>
              <span v-else>????</span>
            </td>
          </tr>
          <tr>
            <td>Link</td>
            <td>
              <a v-if="isGameOver" :href="stationLink" target="_blank">
                radio.garden
              </a>
              <span v-else>????</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue'
import CoverImageDefault from '../assets/images/cover.png'
import IconLoading from '../assets/images/loading.png'
import IconNext from '../assets/images/next.png'
import IconPause from '../assets/images/pause.png'
import IconPlay from '../assets/images/play.png'
import IconPrev from '../assets/images/prev.png'

import { RadioStationWithStreamingUrl } from '../types'

const props = defineProps<{
  radioStations: RadioStationWithStreamingUrl[]
  isGameOver: boolean
}>()

const audioPlayer = useTemplateRef('audioPlayer')
const isPlaying = ref(false)
const isLoading = ref(false)
const selectedStationIdx = ref(0)
const audioSrc = ref(props.radioStations[0].streamingUrl)

const togglePlay = () => {
  isPlaying.value = !isPlaying.value

  // try to play/pause the audio
  if (audioPlayer === null || audioPlayer.value === null) {
    return
  }
  if (isPlaying.value) {
    audioPlayer.value.play().catch((error: any) => {
      console.error('play error', error)
    })
  } else {
    audioPlayer.value.pause()
  }
}

// change streaming url when selected station changes
watch(selectedStationIdx, async (newIdx, _oldIdx) => {
  audioSrc.value = props.radioStations[newIdx].streamingUrl

  if (audioPlayer === null || audioPlayer.value === null) return
  audioPlayer.value.load() //preload
  isLoading.value = true
  audioPlayer.value.addEventListener('loadeddata', () => {
    isLoading.value = false
    if (audioPlayer === null || audioPlayer.value === null) return
    if (isPlaying.value) {
      audioPlayer.value.play() //playing
    }
  })
})

const stationLink = computed(() => {
  return `https://radio.garden${
    props.radioStations[selectedStationIdx.value].channel_url
  }`
})

const increaseStationIdx = () => {
  selectedStationIdx.value =
    (selectedStationIdx.value + 1) % props.radioStations.length
}

const decreaseStationIdx = () => {
  selectedStationIdx.value =
    (selectedStationIdx.value - 1 + props.radioStations.length) %
    props.radioStations.length
}

// capture space bar events
const handleKeydown = (event: KeyboardEvent) => {
  if (event.code === 'Space') {
    event.preventDefault() // Prevent the default spacebar action (scrolling)
    togglePlay()
  } else if (event.code === 'ArrowRight') {
    event.preventDefault() // Prevent the default right arrow action (scrolling)
    increaseStationIdx()
  } else if (event.code === 'ArrowLeft') {
    event.preventDefault() // Prevent the default left arrow action (scrolling)
    decreaseStationIdx()
  }
}
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  if (audioPlayer === null || audioPlayer.value === null) return
  audioPlayer.value.load() //preload
  isLoading.value = true
  audioPlayer.value.addEventListener('loadeddata', () => {
    isLoading.value = false
    if (audioPlayer === null || audioPlayer.value === null) return
    if (isPlaying.value) {
      audioPlayer.value.play() //playing
    }
  })
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
.audio__player-spin-slow {
  animation: audio__player-spin 10s linear infinite;
}
</style>
