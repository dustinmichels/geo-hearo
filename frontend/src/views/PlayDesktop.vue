<script setup lang="ts">
import { computed, ref } from 'vue'
import Footer from '../components/Footer.vue'
import GameResultModal from '../components/GameResultModal.vue'
import GuessPanel from '../components/GuessPanel.vue'
import Map from '../components/Map.vue'
import RadioPlayer from '../components/RadioPlayer.vue'
import ResultsPanel from '../components/ResultsPanel.vue'
import { useGamePlay } from '../composables/useGamePlay'
import { useRadio } from '../composables/useRadio'

const mapRef = ref<InstanceType<typeof Map> | null>(null)

const { isDailyChallengeMode } = useRadio()

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
  handleNewGame,
  roundFinished,
  secretCountry,
} = useGamePlay({
  setupKeyboardShortcuts: true,
  onNewGame: () => mapRef.value?.resetView(),
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
        class="flex-1 bg-sea-blue/10 rounded-3xl border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] overflow-hidden relative z-10"
      >
        <Map
          ref="mapRef"
          @select-country="handleCountrySelect"
          :guessed-countries="guesses"
          :guess-colors="guessColors"
          :selected-country="guessInput"
          :secret-country="roundFinished ? secretCountry : debugCountry"
          :stations="currentStations"
          :active-station-id="activeStation?.channel_id"
          :are-stations-visible="roundFinished"
          default-projection="mercator"
        />
        <div
          v-if="roundFinished"
          class="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-300 w-full max-w-xl"
        >
          <ResultsPanel :station="activeStation" @new-game="handleNewGame" />
        </div>
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

        <!-- Guess Panel Card -->
        <div
          class="flex-1 bg-paper-white rounded-3xl border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] overflow-hidden flex flex-col relative"
        >
          <GuessPanel
            v-model="guessInput"
            :guesses="guesses"
            :disabled="roundFinished"
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
      @confirm="handleModalConfirm"
      @close="showModal = false"
    />
  </div>
</template>

<style scoped>
/* No specific styles needed as we're using Tailwind utilities */
</style>
