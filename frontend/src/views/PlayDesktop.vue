<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import CountryDetails from '../components/CountryDetails.vue'
import Footer from '../components/Footer.vue'
import GameResultModal from '../components/GameResultModal.vue'
import GuessPanel from '../components/GuessPanel.vue'
import Map from '../components/Map.vue'
import RadioPlayer from '../components/RadioPlayer.vue'
import StationDetails from '../components/StationDetails.vue'
import { useGamePlay } from '../composables/useGamePlay'
import { useOnboarding } from '../composables/useOnboarding'
import { useRadio } from '../composables/useRadio'

const mapRef = ref<InstanceType<typeof Map> | null>(null)

const { isDailyChallengeMode } = useRadio()
const { startResultsTour } = useOnboarding()

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
  setupKeyboardShortcuts: true,
  onNewGame: () => mapRef.value?.resetView(),
  onModalClose: () => {
    mapRef.value?.zoomToStations()
    setTimeout(() => {
      startResultsTour()
    }, 500)
  },
})

const activeStation = computed(() => {
  if (!currentStations.value || !currentStations.value.length) return undefined
  return currentStations.value[currentStation.value - 1]
})
</script>

<template>
  <div
    class="h-screen w-full overflow-hidden bg-cloud-white relative text-pencil-lead font-body px-6 pt-3 pb-2 flex flex-col gap-3"
  >
    <!-- Decorative Background Shapes -->
    <div
      class="animate-blob1 absolute top-10 right-[-5%] w-64 h-64 bg-bubblegum-pop/5 rounded-full blur-3xl pointer-events-none"
    ></div>
    <div
      class="animate-blob2 absolute bottom-10 left-[-5%] w-80 h-80 bg-gumball-blue/5 rounded-full blur-3xl pointer-events-none"
    ></div>

    <!-- Main Content Area -->
    <div class="flex-1 flex gap-6 min-h-0 relative z-10">
      <!-- Left: Map Area -->
      <div
        id="tour-map-container"
        class="flex-1 bg-sea-blue/10 rounded-3xl border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] overflow-hidden relative z-10"
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
          default-projection="mercator"
        />
      </div>

      <!-- Right: Sidebar -->
      <div class="w-[400px] flex flex-col gap-4 relative z-10 shrink-0">
        <!-- Header & Player Card -->
        <div
          class="bg-paper-white rounded-3xl border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] p-4 overflow-hidden"
        >
          <!-- Title -->
          <div class="flex justify-center mb-3">
            <div class="relative z-10">
              <h1
                class="text-center text-pencil-lead text-[1.6rem] font-heading tracking-wider"
              >
                GeoHearo
              </h1>
              <div
                class="text-center text-sm uppercase tracking-widest font-bold mb-1"
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
                :class="isPlaying ? 'translate-y-4' : 'translate-y-16'"
              />
            </div>
          </div>

          <!-- Radio Player -->
          <div class="relative z-30">
            <RadioPlayer
              :is-playing="isPlaying"
              :current-station="currentStation"
              :station-url="currentStationUrl"
              @play-pause="handlePlayPause"
              @previous="handlePrevious"
              @next="handleNext"
            />
          </div>
        </div>

        <!-- Results Panel -->
        <div
          v-if="gameStage === 'listening'"
          class="relative z-10 flex flex-col gap-4"
        >
          <!-- Station Details -->
          <div id="station-details-panel">
            <StationDetails
              :station="activeStation"
              layout="desktop"
              class="!shadow-[0_4px_0_0_#334155] w-full !max-w-none"
            />
          </div>

          <!-- Country Details -->
          <CountryDetails :country-name="secretCountry" />

          <!-- New Game Button -->
          <button
            id="new-game-btn"
            class="w-full h-14 bg-yuzu-yellow text-pencil-lead rounded-2xl border-3 border-pencil-lead shadow-[0_4px_0_0_#334155] active:translate-y-1 active:shadow-none transition-all duration-100 flex items-center justify-center gap-2 hover:brightness-110"
            @click="handleNewGame"
            title="New Game"
          >
            <RotateCcw class="w-4 h-4" />
            <span class="font-bold uppercase tracking-wider text-sm">
              New Game
            </span>
          </button>
        </div>

        <!-- Guess Panel Card -->
        <div
          v-if="gameStage === 'guessing'"
          class="flex-1 bg-paper-white rounded-3xl border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] overflow-hidden flex flex-col relative"
        >
          <GuessPanel
            v-model="guessInput"
            :guesses="guesses"
            @add-guess="handleAddGuess"
            :with-footer="false"
          />
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="relative z-10">
      <Footer class="!py-0 text-xs" />
    </div>

    <!-- Game Result Modal -->
    <GameResultModal
      :show="showModal"
      :is-win="modalConfig.isWin"
      :share-text="modalConfig.shareText"
      :results-grid="modalConfig.resultsGrid"
      :secret-country="modalConfig.secretCountry"
      :daily-challenge-number="modalConfig.dailyChallengeNumber"
      :history="gameHistory"
      @confirm="handleModalConfirm"
      @close="handleModalClose"
    />
  </div>
</template>

<style scoped>
/* No specific styles needed as we're using Tailwind utilities */
</style>
