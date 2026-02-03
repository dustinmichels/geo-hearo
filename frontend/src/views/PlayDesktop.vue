<script setup lang="ts">
import { ref } from 'vue'
import Footer from '../components/Footer.vue'
import GameResultModal from '../components/GameResultModal.vue'
import GuessPanel from '../components/GuessPanel.vue'
import Map from '../components/Map.vue'
import RadioPlayer from '../components/RadioPlayer.vue'
import { useGamePlay } from '../composables/useGamePlay'
import { useRadio } from '../composables/useRadio'

const blob1 = ref<HTMLElement | null>(null)
const blob2 = ref<HTMLElement | null>(null)

const { isDailyChallengeMode, dailyChallengeNumber } = useRadio()

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
} = useGamePlay({ blob1, blob2, setupKeyboardShortcuts: true })
</script>

<template>
  <div
    class="h-screen w-full overflow-hidden bg-cloud-white relative text-pencil-lead font-body px-6 pt-6 pb-2 flex flex-col gap-4"
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

    <!-- Main Content Area -->
    <div class="flex-1 flex gap-6 min-h-0 relative z-10">
      <!-- Left: Map Area -->
      <div
        class="flex-1 bg-sea-blue/10 rounded-3xl border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] overflow-hidden relative z-10"
      >
        <Map
          @select-country="handleCountrySelect"
          :guessed-countries="guesses"
          :guess-colors="guessColors"
          :selected-country="guessInput"
          :secret-country="debugCountry"
        />
      </div>

      <!-- Right: Sidebar -->
      <div class="w-[400px] flex flex-col gap-6 relative z-10 shrink-0">
        <!-- Header & Player Card -->
        <div
          class="bg-paper-white rounded-3xl border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] p-6"
        >
          <!-- Title -->
          <div class="flex justify-center mb-6">
            <div class="relative z-10">
              <h1
                class="text-center text-pencil-lead text-3xl font-heading tracking-wider"
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
                  Daily Challenge #{{ dailyChallengeNumber }}
                </template>
                <template v-else> Free play mode </template>
              </div>
              <img
                src="/emoji.png"
                class="absolute left-full -bottom-6 h-12 ml-4 z-0 transition-transform duration-700 ease-out"
                :class="isPlaying ? 'translate-y-0' : 'translate-y-16'"
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
/* No specific styles needed as we're using Tailwind utilities */
</style>
