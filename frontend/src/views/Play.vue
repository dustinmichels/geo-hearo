<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useGamePlay, type GamePlayState } from "../composables/useGamePlay";
import { useOnboarding } from "../composables/useOnboarding";
import { useRadio } from "../composables/useRadio";
import PlayDesktop from "./PlayDesktop.vue";
import PlayMobile from "./PlayMobile.vue";

const isMobile = ref(window.innerWidth < 1024);
const { secretCountry } = useRadio();
const isDebug = import.meta.env.VITE_DEBUG_MODE === "true";
const { startTour, startResultsTour, isTourActive, skipTour, activeTourKey } = useOnboarding();

interface PlayLayoutInstance {
  onNewGame?: () => void;
  onModalClose?: () => void;
  onGuessAdded?: () => void;
}

const childRef = ref<PlayLayoutInstance | null>(null);

const gameplay: GamePlayState = reactive(
  useGamePlay({
    setupKeyboardShortcuts: true,
    onGuessAdded: () => {
      childRef.value?.onGuessAdded?.();
    },
    onNewGame: () => {
      childRef.value?.onNewGame?.();
    },
    onModalClose: () => {
      childRef.value?.onModalClose?.();
      setTimeout(() => {
        startResultsTour();
      }, 500);
    },
  }),
);
let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
const checkDevice = () => {
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    isMobile.value = window.innerWidth < 1024; // standard tablet/mobile breakpoint
  }, 150);
};

// The layout remount creates a fresh <audio> with no source; stop playback so the UI matches.
watch(isMobile, () => {
  gameplay.isPlaying = false;
});

onMounted(() => {
  checkDevice();
  window.addEventListener("resize", checkDevice);
  // Give child components time to mount and settle
  setTimeout(() => {
    startTour();
  }, 1000);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkDevice);
});
</script>

<template>
  <div
    v-if="isDebug"
    class="fixed top-0 left-0 bg-[#00ffff] text-black px-2 py-1 z-[9999] pointer-events-none font-bold text-sm"
  >
    DEBUG: {{ secretCountry }}
  </div>
  <PlayMobile v-if="isMobile" :gameplay="gameplay" ref="childRef" />
  <PlayDesktop v-else :gameplay="gameplay" ref="childRef" />
  <button
    v-if="isTourActive"
    class="fixed z-[100002] bg-white/90 backdrop-blur-md text-slate-900 border border-white/50 rounded-full px-8 py-3 text-base font-bold shadow-2xl hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer tracking-wide uppercase"
    :class="
      activeTourKey === 'geo-hearo-results-tour-seen'
        ? 'top-4 right-4'
        : 'bottom-10 left-1/2 -translate-x-1/2'
    "
    @click="skipTour"
  >
    Skip Tour
  </button>
</template>
