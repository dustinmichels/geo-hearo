<script setup lang="ts">
import { RotateCcw, Trophy } from "lucide-vue-next";
import { useTemplateRef } from "vue";
import CountryDetails from "../components/CountryDetails.vue";
import DailyChallengeCard from "../components/DailyChallengeCard.vue";
import Footer from "../components/Footer.vue";
import GameResultModal from "../components/GameResultModal.vue";
import GuessPanel from "../components/GuessPanel.vue";
import HamburgerMenu from "../components/HamburgerMenu.vue";
import Map from "../components/Map.vue";
import RadioPlayer from "../components/RadioPlayer.vue";
import StationDetails from "../components/StationDetails.vue";
import type { GamePlayState } from "../composables/useGamePlay";
import { useRadio } from "../composables/useRadio";

const mapRef = useTemplateRef<InstanceType<typeof Map>>("mapRef");

const { isDailyChallengeMode } = useRadio();

const props = defineProps<{
  gameplay: GamePlayState;
}>();

const gameplay = props.gameplay;

const onNewGame = () => {
  mapRef.value?.resetView();
};

const onModalClose = () => {
  mapRef.value?.zoomToStations();
};

defineExpose({
  mapRef,
  onNewGame,
  onModalClose,
});
</script>

<template>
  <div
    class="h-screen w-full overflow-hidden bg-cloud-white relative text-pencil-lead font-body px-6 pt-safe-3 pb-safe-2 flex flex-col gap-3"
  >
    <!-- Hamburger Menu -->
    <div class="fixed top-safe-4 left-safe-4 z-[9999]">
      <HamburgerMenu />
    </div>

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
        class="flex-1 ml-12 bg-sea-blue/10 rounded-3xl border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] overflow-hidden relative z-10"
      >
        <Map
          ref="mapRef"
          @select-country="gameplay.handleCountrySelect"
          v-bind="gameplay.mapProps"
          default-projection="mercator"
        />
      </div>

      <!-- Right: Sidebar -->
      <div class="w-[400px] flex flex-col gap-2 relative z-10 shrink-0 min-h-0">
        <!-- Title -->
        <div class="flex justify-center">
          <div class="relative z-10">
            <button
              v-if="gameplay.dailyItem"
              class="absolute right-full mr-3 inset-y-0 bg-paper-white/90 backdrop-blur-sm text-[#B45309] rounded-lg px-2.5 hover:bg-paper-white transition-colors duration-200 cursor-pointer flex items-center justify-center shadow-sm"
              aria-label="View daily challenge stats"
              title="View daily challenge stats"
              @click="gameplay.handleShowStats"
            >
              <Trophy :size="22" :stroke-width="2.5" />
            </button>
            <h1 class="text-center text-pencil-lead text-[1.6rem] font-heading tracking-wider">
              GeoHearo
            </h1>
            <div
              class="text-center text-sm uppercase tracking-widest font-bold mb-1"
              :class="isDailyChallengeMode ? 'text-[#B45309]' : 'text-eraser-grey'"
            >
              <template v-if="isDailyChallengeMode"> Daily Challenge! 📣 </template>
              <template v-else> Free play mode </template>
            </div>
            <img
              src="/emoji.png"
              class="absolute left-full bottom-0 h-12 ml-4 z-[-1] transition-transform duration-700 ease-out"
              style="will-change: transform"
              :class="gameplay.isPlaying ? 'translate-y-4' : 'translate-y-16'"
            />
          </div>
        </div>

        <!-- Radio Player -->
        <div class="relative z-30">
          <RadioPlayer
            :is-playing="gameplay.isPlaying"
            :current-station="gameplay.currentStation"
            :station-url="gameplay.currentStationUrl"
            @play-pause="gameplay.handlePlayPause"
            @previous="gameplay.handlePrevious"
            @next="gameplay.handleNext"
          />
        </div>

        <!-- Results Panel -->
        <div
          v-if="gameplay.gameStage === 'listening'"
          class="relative z-10 flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto"
        >
          <!-- Station Details + New Game Button -->
          <div class="flex gap-2 shrink-0">
            <div id="station-details-panel" class="flex-1 min-w-0">
              <StationDetails
                :station="gameplay.activeStation"
                layout="desktop"
                class="!shadow-[0_4px_0_0_#334155] w-full !max-w-none !p-2 !mb-0"
              />
            </div>
            <button
              id="new-game-btn"
              class="h-auto bg-yuzu-yellow text-pencil-lead rounded-2xl border-3 border-pencil-lead shadow-[0_4px_0_0_#334155] active:translate-y-1 active:shadow-none transition-all duration-100 flex items-center justify-center gap-1.5 hover:brightness-110 shrink-0 px-6 flex-col"
              @click="gameplay.handleNewGame"
              title="New Game"
            >
              <RotateCcw class="w-5 h-5" />
              <span class="font-bold uppercase tracking-wider text-xs"> New Game </span>
            </button>
          </div>

          <!-- Country Details -->
          <CountryDetails
            v-if="gameplay.secretCountry"
            :country-name="gameplay.secretCountry"
            class="text-left"
          />

          <!-- Daily Challenge Card -->
          <DailyChallengeCard v-if="gameplay.dailyItem" @show-stats="gameplay.handleShowStats" />
        </div>

        <!-- Guess Panel Card -->
        <div
          v-if="gameplay.gameStage === 'guessing'"
          class="flex-1 bg-paper-white rounded-3xl border-3 border-pencil-lead shadow-[8px_8px_0_0_#334155] overflow-hidden flex flex-col relative"
        >
          <GuessPanel
            v-model="gameplay.guessInput"
            :guesses="gameplay.guesses"
            @add-guess="gameplay.handleAddGuess"
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
      v-bind="gameplay.modalConfig"
      :show="gameplay.showModal"
      :history="gameplay.gameHistory"
      :stats-view="gameplay.isStatsView"
      @confirm="gameplay.handleModalConfirm"
      @close="gameplay.handleModalClose"
    />
  </div>
</template>

<style scoped>
/* No specific styles needed as we're using Tailwind utilities */
</style>
