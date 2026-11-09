<script setup lang="ts">
import { Trophy } from "lucide-vue-next";
import { FloatingPanel as VanFloatingPanel } from "vant";
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from "vue";
import AnimatedClose from "../components/AnimatedClose.vue";
import CountryDetails from "../components/CountryDetails.vue";
import DailyChallengeCard from "../components/DailyChallengeCard.vue";
import GameResultModal from "../components/GameResultModal.vue";
import GuessPanel from "../components/GuessPanel.vue";
import HamburgerMenu from "../components/HamburgerMenu.vue";
import Map from "../components/Map.vue";
import RadioPlayer from "../components/RadioPlayer.vue";
import ResultsPanel from "../components/ResultsPanel.vue";
import type { GamePlayState } from "../composables/useGamePlay";
import { useRadio } from "../composables/useRadio";
import { safeAreaInsets } from "../lib/platform";

const props = defineProps<{
  gameplay: GamePlayState;
}>();

const gameplay = props.gameplay;

const mapRef = useTemplateRef<InstanceType<typeof Map>>("mapRef");

const { isDailyChallengeMode } = useRadio();

// Vant Floating Panel setup
const windowHeight = ref(window.innerHeight);
// Status bar / home indicator heights in the native app (0 on the web): expanded
// panels stop below the status bar; collapsed panels grow by the home-indicator
// padding (`safe-area-inset-bottom`) that vant's FloatingPanel adds inside them.
const safeArea = ref(safeAreaInsets());
const onResize = () => {
  windowHeight.value = window.innerHeight;
  safeArea.value = safeAreaInsets();
};

onMounted(() => {
  window.addEventListener("resize", onResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
});

const anchors = computed(() => [
  140 + safeArea.value.bottom, // Collapsed height (px)
  Math.round(windowHeight.value * 0.9) - safeArea.value.top, // Fully open
]);
const panelHeight = ref(anchors.value[0] ?? 140);

// Results floating panel setup
const resultsAnchors = computed(() => [
  160 + safeArea.value.bottom, // Collapsed: station details + new game button visible
  windowHeight.value - 130 - safeArea.value.top, // Expanded: leave room for X buttons at top
]);
const resultsPanelHeight = ref(resultsAnchors.value[0] ?? 160);

const onGuessAdded = () => {
  panelHeight.value = anchors.value[1] ?? 140;
};

const onNewGame = () => {
  mapRef.value?.resetView();
  panelHeight.value = anchors.value[0] ?? 140;
  resultsPanelHeight.value = resultsAnchors.value[0] ?? 160;
};

const onModalClose = () => {
  mapRef.value?.zoomToStations();
};

defineExpose({
  mapRef,
  onGuessAdded,
  onNewGame,
  onModalClose,
});

watch(
  () => gameplay.gameStage,
  (stage) => {
    if (stage !== "guessing") {
      panelHeight.value = anchors.value[0] ?? 140;
    }
    if (stage === "listening") {
      resultsPanelHeight.value = resultsAnchors.value[0] ?? 160;
    }
  },
);

const handleArrowClick = () => {
  panelHeight.value = anchors.value[0] ?? 140;
};

const handleResultsArrowClick = () => {
  resultsPanelHeight.value = resultsAnchors.value[0] ?? 160;
};

const isPanelFullHeight = computed(() => {
  const fullHeight = anchors.value[1];
  if (typeof fullHeight === "undefined" || typeof panelHeight.value === "undefined") return false;
  return panelHeight.value >= fullHeight - 10;
});

const isResultsPanelFullHeight = computed(() => {
  const fullHeight = resultsAnchors.value[1];
  if (typeof fullHeight === "undefined" || typeof resultsPanelHeight.value === "undefined")
    return false;
  return resultsPanelHeight.value >= fullHeight - 10;
});

const overlayOpacity = computed(() => {
  const isListening = gameplay.gameStage === "listening";
  const min = isListening ? resultsAnchors.value[0] : anchors.value[0];
  const max = isListening ? resultsAnchors.value[1] : anchors.value[1];
  const current = isListening ? resultsPanelHeight.value : panelHeight.value;

  if (typeof min === "undefined" || typeof max === "undefined" || typeof current === "undefined") {
    return 0;
  }

  const progress = (current - min) / (max - min);
  const clamped = Math.min(Math.max(progress, 0), 1);
  return clamped * 0.6;
});
</script>

<template>
  <div class="h-screen w-full overflow-hidden bg-cloud-white relative text-pencil-lead font-body">
    <!-- Decorative Background Shapes -->
    <div
      class="animate-blob1 absolute top-10 right-[-5%] w-64 h-64 bg-bubblegum-pop/5 rounded-full blur-3xl pointer-events-none"
    ></div>
    <div
      class="animate-blob2 absolute bottom-10 left-[-5%] w-80 h-80 bg-gumball-blue/5 rounded-full blur-3xl pointer-events-none"
    ></div>

    <div class="fixed top-safe-4 left-safe-4 z-[9999] flex gap-2">
      <HamburgerMenu />
      <button
        v-if="gameplay.dailyItem"
        class="bg-paper-white/90 backdrop-blur-sm text-[#B45309] rounded-lg p-2 hover:bg-paper-white transition-colors duration-200 cursor-pointer flex items-center justify-center shadow-sm"
        aria-label="View daily challenge stats"
        title="View daily challenge stats"
        @click="gameplay.handleShowStats"
      >
        <Trophy :size="20" :stroke-width="2.5" />
      </button>
    </div>

    <!-- Animated Arrows Hint -->
    <div class="relative z-[60]" v-show="isPanelFullHeight || isResultsPanelFullHeight">
      <AnimatedClose
        class="!top-safe-16"
        @click="isPanelFullHeight ? handleArrowClick() : handleResultsArrowClick()"
      />
    </div>

    <!-- Fixed content area -->
    <div
      class="h-full w-full flex flex-col max-w-md mx-auto pb-safe-5 relative z-10 transition-all duration-500"
    >
      <!-- Title -->
      <div class="pt-safe-2 px-4 flex justify-center relative z-10 order-1">
        <div class="relative">
          <h1
            class="relative z-10 text-center text-pencil-lead text-2xl font-heading tracking-wider"
          >
            GeoHearo
          </h1>
          <div
            class="relative z-10 text-center text-xs uppercase tracking-widest font-bold mb-1"
            :class="isDailyChallengeMode ? 'text-[#B45309]' : 'text-eraser-grey'"
          >
            <template v-if="isDailyChallengeMode"> Daily Challenge! 📣 </template>
            <template v-else> Free play mode </template>
          </div>
          <img
            src="/emoji.png"
            class="absolute left-full bottom-0 h-12 ml-4 z-[-1] transition-transform duration-700 ease-out"
            style="will-change: transform"
            :class="gameplay.isPlaying ? 'translate-y-0' : 'translate-y-16'"
          />
        </div>
      </div>

      <!-- Radio Player -->
      <div
        class="px-4 pb-2 relative z-50 order-2 transition-all duration-500"
        style="transform: translate3d(0, 0, 0)"
      >
        <RadioPlayer
          :is-playing="gameplay.isPlaying"
          :current-station="gameplay.currentStation"
          :station-url="gameplay.currentStationUrl"
          @play-pause="gameplay.handlePlayPause"
          @previous="gameplay.handlePrevious"
          @next="gameplay.handleNext"
        />
      </div>

      <!-- Globe - takes remaining space -->
      <div
        id="tour-map-container"
        class="flex-1 px-4 pb-2 min-h-0 relative order-3 transition-all duration-500"
      >
        <Map
          ref="mapRef"
          @select-country="gameplay.handleCountrySelect"
          v-bind="gameplay.mapProps"
          default-projection="globe"
        />
      </div>
    </div>

    <!-- Results Floating Panel (listening stage) -->
    <van-floating-panel
      v-if="gameplay.gameStage === 'listening'"
      v-model:height="resultsPanelHeight"
      :anchors="resultsAnchors"
      :content-class="'bg-paper-white rounded-t-[24px] border-t-3 border-l-3 border-r-3 border-pencil-lead shadow-[0_-4px_0_0_#334155] flex flex-col'"
      style="z-index: 50"
    >
      <div class="px-4 pt-2 pb-4 shrink-0">
        <ResultsPanel :station="gameplay.activeStation" @new-game="gameplay.handleNewGame" />
      </div>
      <div class="border-t border-pencil-lead/20 overflow-y-auto flex-1 min-h-0">
        <div class="max-w-md mx-auto px-4 pt-4 pb-12 space-y-4">
          <CountryDetails
            v-if="gameplay.secretCountry"
            :country-name="gameplay.secretCountry"
            :show-name="false"
            :small-image="true"
          />
          <DailyChallengeCard v-if="gameplay.dailyItem" @show-stats="gameplay.handleShowStats" />
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
      v-if="gameplay.gameStage === 'guessing'"
      v-model:height="panelHeight"
      :anchors="anchors"
      :content-class="'bg-paper-white rounded-t-[24px] border-t-3 border-l-3 border-r-3 border-pencil-lead shadow-[0_-4px_0_0_#334155] flex flex-col'"
      style="z-index: 50"
    >
      <GuessPanel
        v-model="gameplay.guessInput"
        :guesses="gameplay.guesses"
        @add-guess="gameplay.handleAddGuess"
      />
    </van-floating-panel>

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
:deep(.van-floating-panel) {
  /* Transparent, except the home-indicator padding vant adds at the bottom (0 on the web). */
  background: linear-gradient(
    to top,
    var(--color-paper-white) var(--safe-bottom),
    transparent var(--safe-bottom)
  ) !important;
}

:deep(.van-floating-panel__header) {
  height: 48px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: transparent !important;
}
</style>
