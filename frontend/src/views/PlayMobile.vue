<script setup lang="ts">
import { FloatingPanel as VanFloatingPanel } from 'vant'
import { computed, ref, watch } from 'vue'
import AnimatedClose from '../components/AnimatedClose.vue'
import CountryDetails from '../components/CountryDetails.vue'
import DailyChallengeCard from '../components/DailyChallengeCard.vue'
import GameResultModal from '../components/GameResultModal.vue'
import GuessPanel from '../components/GuessPanel.vue'
import HamburgerMenu from '../components/HamburgerMenu.vue'
import Map from '../components/Map.vue'
import RadioPlayer from '../components/RadioPlayer.vue'
import ResultsPanel from '../components/ResultsPanel.vue'
import { useGamePlay } from '../composables/useGamePlay'
import { useOnboarding } from '../composables/useOnboarding'
import { useRadio } from '../composables/useRadio'

const mapRef = ref<InstanceType<typeof Map> | null>(null)

const { isDailyChallengeMode } = useRadio()
const { startResultsTour } = useOnboarding()

// Vant Floating Panel setup
const anchors = [
  140, // Collapsed height (px)
  Math.round(window.innerHeight * 0.9), // Fully open
]
const panelHeight = ref(anchors[0])

// Results floating panel setup
const resultsAnchors = [
  160, // Collapsed: station details + new game button visible
  Math.round(window.innerHeight * 0.9), // Expanded: country details visible
]
const resultsPanelHeight = ref(resultsAnchors[0])

const {
  isPlaying,
  guessInput,
  guessColors,
  showModal,
  modalConfig,
  guesses,
  currentStation,
  currentStations,
  currentStationUrl,
  debugCountry,
  handlePlayPause,
  handlePrevious,
  handleNext,
  handleAddGuess,
  handleModalConfirm,
  handleCountrySelect,
  handleModalClose,
  handleNewGame,
  gameStage,
  secretCountry,
  gameHistory,
} = useGamePlay({
  onGuessAdded: () => {
    panelHeight.value = anchors[1]
  },
  onNewGame: () => {
    mapRef.value?.resetView()
    panelHeight.value = anchors[0]
    resultsPanelHeight.value = resultsAnchors[0]
  },
  onModalClose: () => {
    mapRef.value?.zoomToStations()
    setTimeout(() => {
      startResultsTour()
    }, 500)
  },
})

watch(gameStage, (stage) => {
  if (stage !== 'guessing') {
    panelHeight.value = anchors[0]
  }
  if (stage === 'listening') {
    resultsPanelHeight.value = resultsAnchors[0]
  }
})

const handleArrowClick = () => {
  panelHeight.value = anchors[0]
}

const handleResultsArrowClick = () => {
  resultsPanelHeight.value = resultsAnchors[0]
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

const isResultsPanelFullHeight = computed(() => {
  const fullHeight = resultsAnchors[1]
  if (
    typeof fullHeight === 'undefined' ||
    typeof resultsPanelHeight.value === 'undefined'
  )
    return false
  return resultsPanelHeight.value >= fullHeight - 10
})

const overlayOpacity = computed(() => {
  const isListening = gameStage.value === 'listening'
  const min = isListening ? resultsAnchors[0] : anchors[0]
  const max = isListening ? resultsAnchors[1] : anchors[1]
  const current = isListening ? resultsPanelHeight.value : panelHeight.value

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

const activeStation = computed(() => {
  if (!currentStations.value || !currentStations.value.length) return undefined
  return currentStations.value[currentStation.value - 1]
})

const dailyItem = computed(() => {
  return gameHistory.value?.find((item) => item.mode === 'daily')
})
</script>

<template>
  <div
    class="h-screen w-full overflow-hidden bg-cloud-white relative text-pencil-lead font-body"
  >
    <!-- Decorative Background Shapes -->
    <div
      class="animate-blob1 absolute top-10 right-[-5%] w-64 h-64 bg-bubblegum-pop/5 rounded-full blur-3xl pointer-events-none"
    ></div>
    <div
      class="animate-blob2 absolute bottom-10 left-[-5%] w-80 h-80 bg-gumball-blue/5 rounded-full blur-3xl pointer-events-none"
    ></div>

    <div class="fixed top-4 left-4 z-[9999]">
      <HamburgerMenu />
    </div>

    <!-- Animated Arrows Hint -->
    <div class="relative z-[60]" v-show="isPanelFullHeight || isResultsPanelFullHeight">
      <AnimatedClose class="!top-16" @click="isPanelFullHeight ? handleArrowClick() : handleResultsArrowClick()" />
    </div>

    <!-- Fixed content area -->
    <div
      class="h-full w-full flex flex-col max-w-md mx-auto pb-[20px] relative z-10 transition-all duration-500"
    >
      <!-- Title -->
      <div class="pt-2 px-4 flex justify-center relative z-10 order-1">
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
        class="px-4 pb-2 relative z-50 order-2 transition-all duration-500"
        style="transform: translate3d(0, 0, 0)"
      >
        <RadioPlayer
          :is-playing="isPlaying"
          :current-station="currentStation"
          :station-url="currentStationUrl"
          @play-pause="handlePlayPause"
          @previous="handlePrevious"
          @next="handleNext"
        />
      </div>

      <!-- Globe - takes remaining space -->
      <div
        id="tour-map-container"
        class="flex-1 px-4 pb-2 min-h-0 relative order-3 transition-all duration-500"
      >
        <Map
          ref="mapRef"
          @select-country="handleCountrySelect"
          :guessed-countries="guesses"
          :guess-colors="guessColors"
          :selected-country="guessInput"
          :secret-country="
            gameStage !== 'guessing' ? secretCountry : debugCountry
          "
          :stations="currentStations"
          :active-station-id="activeStation?.channel_id"
          :are-stations-visible="gameStage === 'listening'"
          :show-tiles="gameStage !== 'guessing'"
          default-projection="globe"
        />
      </div>

    </div>

    <!-- Results Floating Panel (listening stage) -->
    <van-floating-panel
      v-if="gameStage === 'listening'"
      v-model:height="resultsPanelHeight"
      :anchors="resultsAnchors"
      :content-class="'bg-paper-white rounded-t-[24px] border-t-3 border-l-3 border-r-3 border-pencil-lead shadow-[0_-4px_0_0_#334155] flex flex-col'"
      style="z-index: 50"
    >
      <div class="px-4 pt-2 pb-4 shrink-0">
        <ResultsPanel :station="activeStation" @new-game="handleNewGame" />
      </div>
      <div
        class="border-t border-pencil-lead/20 overflow-y-auto flex-1 min-h-0"
      >
        <div class="max-w-md mx-auto px-4 py-4 space-y-4">
          <CountryDetails v-if="secretCountry" :country-name="secretCountry" />
          <DailyChallengeCard v-if="dailyItem" :item="dailyItem" />
        </div>
      </div>
    </van-floating-panel>

    <!-- Overlay for dimming effect -->
    <div
      class="fixed inset-0 bg-black pointer-events-none z-40"
      :style="{ opacity: overlayOpacity }"
    ></div>

    <!-- Vant Floating Panel -->
    <van-floating-panel
      v-if="gameStage === 'guessing'"
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
      :is-win="modalConfig.isWin"
      :secret-country="modalConfig.secretCountry"
      :history="gameHistory"
      @confirm="handleModalConfirm"
      @close="handleModalClose"
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
