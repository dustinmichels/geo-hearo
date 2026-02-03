<script setup lang="ts">
import { FloatingPanel as VanFloatingPanel } from 'vant'
import { computed, ref } from 'vue'
import AnimatedClose from '../components/AnimatedClose.vue'
import GameResultModal from '../components/GameResultModal.vue'
import GuessPanel from '../components/GuessPanel.vue'
import Map from '../components/Map.vue'
import RadioPlayer from '../components/RadioPlayer.vue'
import { useRadio } from '../composables/useRadio'
import { useGamePlay } from '../composables/useGamePlay'

const blob1 = ref<HTMLElement | null>(null)
const blob2 = ref<HTMLElement | null>(null)

const { isDailyChallengeMode } = useRadio()

// Vant Floating Panel setup
const anchors = [
  140, // Collapsed height (px)
  Math.round(window.innerHeight * 0.9), // Fully open
]
const panelHeight = ref(anchors[0])

const {
  isPlaying,
  guessInput,
  guessColors,
  showModal,
  modalConfig,
  guesses,
  currentStation,
  currentStationUrl,
  debugCountry,
  handlePlayPause,
  handlePrevious,
  handleNext,
  handleAddGuess,
  handleModalConfirm,
  handleCountrySelect,
} = useGamePlay({
  blob1,
  blob2,
  onGuessAdded: () => {
    panelHeight.value = anchors[1]
  },
})

const handleArrowClick = () => {
  panelHeight.value = anchors[0]
}

const isPanelFullHeight = computed(() => {
  const fullHeight = anchors[1]
  if (
    typeof fullHeight === 'undefined' ||
    typeof panelHeight.value === 'undefined'
  )
    return false
  return panelHeight.value >= fullHeight - 10
})

const overlayOpacity = computed(() => {
  const min = anchors[0]
  const max = anchors[1]
  const current = panelHeight.value

  if (
    typeof min === 'undefined' ||
    typeof max === 'undefined' ||
    typeof current === 'undefined'
  ) {
    return 0
  }

  const progress = (current - min) / (max - min)
  const clamped = Math.min(Math.max(progress, 0), 1)
  return clamped * 0.6
})
</script>

<template>
  <div
    class="h-screen w-full overflow-hidden bg-cloud-white relative text-pencil-lead font-body"
  >
    <!-- Decorative Background Shapes -->
    <div
      ref="blob1"
      class="absolute top-10 right-[-5%] w-64 h-64 bg-bubblegum-pop/5 rounded-full blur-3xl pointer-events-none"
    ></div>
    <div
      ref="blob2"
      class="absolute bottom-10 left-[-5%] w-80 h-80 bg-gumball-blue/5 rounded-full blur-3xl pointer-events-none"
    ></div>

    <!-- Animated Arrows Hint -->
    <div class="relative z-[60]" v-show="isPanelFullHeight">
      <AnimatedClose class="!top-16" @click="handleArrowClick" />
    </div>

    <!-- Fixed content area -->
    <div
      class="h-full w-full flex flex-col max-w-md mx-auto pb-[100px] relative z-10"
    >
      <!-- Title -->
      <div class="pt-2 px-4 flex justify-center relative z-10">
        <div class="relative">
          <h1
            class="relative z-10 text-center text-pencil-lead text-2xl font-heading tracking-wider"
          >
            GeoHearo
          </h1>
          <div
            class="relative z-10 text-center text-xs uppercase tracking-widest font-bold mb-1"
            :class="
              isDailyChallengeMode ? 'text-[#B45309]' : 'text-eraser-grey'
            "
          >
            <template v-if="isDailyChallengeMode">
              Daily Challenge! 📣
            </template>
            <template v-else> Free play mode </template>
          </div>
          <img
            src="/emoji.png"
            class="absolute left-full bottom-0 h-12 ml-4 z-[-1] transition-transform duration-700 ease-out"
            style="will-change: transform"
            :class="isPlaying ? 'translate-y-0' : 'translate-y-16'"
          />
        </div>
      </div>

      <!-- Radio Player -->
      <div
        class="px-4 pb-2 relative z-50"
        style="transform: translate3d(0, 0, 0)"
      >
        <RadioPlayer
          :is-playing="isPlaying"
          :current-station="currentStation"
          :station-url="currentStationUrl"
          :compact="true"
          @play-pause="handlePlayPause"
          @previous="handlePrevious"
          @next="handleNext"
        />
      </div>

      <!-- Globe - takes remaining space -->
      <div class="flex-1 px-4 pb-2 min-h-0 relative">
        <Map
          @select-country="handleCountrySelect"
          :guessed-countries="guesses"
          :guess-colors="guessColors"
          :selected-country="guessInput"
          :secret-country="debugCountry"
        />
      </div>
    </div>

    <!-- Overlay for dimming effect -->
    <div
      class="fixed inset-0 bg-black pointer-events-none z-40"
      :style="{ opacity: overlayOpacity }"
    ></div>

    <!-- Vant Floating Panel -->
    <van-floating-panel
      v-model:height="panelHeight"
      :anchors="anchors"
      :content-class="'bg-paper-white rounded-t-[24px] border-t-3 border-l-3 border-r-3 border-pencil-lead shadow-[0_-4px_0_0_#334155] flex flex-col'"
      style="z-index: 50"
    >
      <GuessPanel
        v-model="guessInput"
        :guesses="guesses"
        @add-guess="handleAddGuess"
      />
    </van-floating-panel>

    <!-- Game Result Modal -->
    <GameResultModal
      :show="showModal"
      :title="modalConfig.title"
      :message="modalConfig.message"
      :button-text="modalConfig.buttonText"
      :is-win="modalConfig.isWin"
      :share-text="modalConfig.shareText"
      @confirm="handleModalConfirm"
    />
  </div>
</template>

<style scoped>
:deep(.van-floating-panel) {
  background-color: transparent !important;
}

:deep(.van-floating-panel__header) {
  height: 48px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: transparent !important;
}

:deep(.van-floating-panel__bar) {
  width: 64px !important;
  height: 6px !important;
  background-color: #334155 !important;
  border-radius: 999px !important;
  opacity: 0.5;
}
</style>
