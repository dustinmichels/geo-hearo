import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { storeToRefs } from "pinia";
import { computed, onMounted, onUnmounted, ref, type UnwrapNestedRefs } from "vue";
import { offerDailyReminder } from "../lib/dailyReminder";
import { roundResultFeedback } from "../lib/haptics";
import { isNative } from "../lib/platform";
import { trackDailyResult } from "../lib/supabase";
import { useGameStore } from "../stores/game";
import type { GamePhase } from "../types/geo";
import { hintFor } from "../utils/guessHint";
import { useCountryData } from "./useCountryData";
import { useRadio } from "./useRadio";

interface GamePlayOptions {
  onGuessAdded?: () => void;
  onNewGame?: () => void;
  onModalClose?: () => void;
  setupKeyboardShortcuts?: boolean;
}

interface ModalConfig {
  isWin: boolean;
  secretCountry?: string;
  dailyChallengeNumber?: number;
  isDailyChallenge?: boolean;
  challengeDate?: string;
  trackedPromise?: Promise<boolean>;
}

const DEFAULT_MODAL_CONFIG: ModalConfig = {
  isWin: false,
  isDailyChallenge: false,
};

// Dev only: VITE_GAME_STAGE=seeResults|listening skips straight to that stage
const envStage = import.meta.env.VITE_GAME_STAGE as GamePhase | undefined;
const DEBUG_STAGE = envStage === "seeResults" || envStage === "listening" ? envStage : undefined;

export function useGamePlay(options: GamePlayOptions) {
  const isPlaying = ref(false);
  const guessInput = ref("");
  const guessColors = ref<Record<string, string>>({});

  const modalConfig = ref<ModalConfig>({ ...DEFAULT_MODAL_CONFIG });

  const setModalConfig = (config: Partial<ModalConfig>) => {
    modalConfig.value = {
      ...DEFAULT_MODAL_CONFIG,
      ...config,
    };
  };

  // State
  const store = useGameStore();
  const { gameHistory, gameStage } = storeToRefs(store);
  const { addToHistory, loadHistory } = store;

  const showStatsOverride = ref(false);
  const showModal = computed(() => gameStage.value === "seeResults" || showStatsOverride.value);

  // Hooking up radio logic
  const {
    loadStations,
    selectRandomCountry,
    currentStations,
    secretCountry,
    guesses,
    addGuess,
    clearState,
    currentStationIndex: currentStation,
    currentSeed,
    saveState,
    restoreState,
    // Daily Challenge
    initDailyChallenge,
    isDailyChallengeMode,
    completeDailyChallenge,
    getDailyChallengeSeed,
    dailyChallengeNumber,
    getDailyChallengeNumber,
    getEasternDateString,
  } = useRadio();

  // Hooking up country data
  const { loadCountryData, getFeature } = useCountryData();

  const currentStationUrl = computed(() => {
    return currentStations.value[currentStation.value - 1]?.channel_resolved_url;
  });

  const activeStation = computed(() => {
    if (!currentStations.value || !currentStations.value.length) return undefined;
    return currentStations.value[currentStation.value - 1];
  });

  const dailyItem = computed(() => {
    return gameHistory.value?.find((item) => item.mode === "daily");
  });

  const mapProps = computed(() => ({
    guessedCountries: guesses.value,
    guessColors: guessColors.value,
    selectedCountry: guessInput.value,
    secretCountry: gameStage.value !== "guessing" ? secretCountry.value : debugCountry.value,
    stations: currentStations.value,
    activeStationId: activeStation.value?.channel_id,
    areStationsVisible: gameStage.value === "listening",
    showTiles: gameStage.value !== "guessing",
  }));

  const debugCountry = computed(() => {
    return import.meta.env.VITE_DEBUG_MODE === "true" ? secretCountry.value : undefined;
  });

  const handlePlayPause = () => {
    isPlaying.value = !isPlaying.value;
  };

  const handlePrevious = () => {
    currentStation.value = currentStation.value > 1 ? currentStation.value - 1 : 5;
    saveState();
  };

  const handleNext = () => {
    currentStation.value = currentStation.value < 5 ? currentStation.value + 1 : 1;
    saveState();
  };

  const hint = (guess: string) => hintFor(guess, secretCountry.value, getFeature);

  const populateGuessColors = () => {
    guesses.value.forEach((guess) => {
      guessColors.value[guess] ??= hint(guess).color;
    });
  };

  // currentSeed is YYYYMMDD as a number (e.g. 20260319) — convert to "2026-03-19"
  const getChallengeDate = (): string => {
    const s = (currentSeed.value ?? 0).toString();
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  };

  const applyDebugStage = (stage: GamePhase) => {
    setModalConfig({ secretCountry: secretCountry.value });
    store.gameStage = stage;
  };

  // After restoring a round, re-populate the modal config if we're restoring into seeResults
  const restoreResultsModal = (isDaily: boolean) => {
    if (gameStage.value !== "seeResults") return;
    setModalConfig({
      isWin: guesses.value.includes(secretCountry.value),
      secretCountry: secretCountry.value,
      dailyChallengeNumber: dailyChallengeNumber.value,
      isDailyChallenge: isDaily,
      challengeDate: isDaily ? getChallengeDate() : undefined,
      trackedPromise: isDaily ? Promise.resolve(true) : undefined,
    });
  };

  const finishRound = (isWin: boolean) => {
    roundResultFeedback(isWin);
    const resultsGrid = guesses.value.map((guess) => hint(guess).emoji).join("");
    let dayNumber: number | undefined;
    const gameMode = isDailyChallengeMode.value ? "daily" : "free";
    const isDaily = isDailyChallengeMode.value;

    const numericScore = guesses.value.indexOf(secretCountry.value) + 1 || 6;

    let trackedPromise: Promise<boolean> | undefined;
    if (isDaily) {
      dayNumber = dailyChallengeNumber.value || 0;
      completeDailyChallenge(); // Mark as done for today
      void offerDailyReminder(); // App only: first time asks for notification permission
      trackedPromise = trackDailyResult(getChallengeDate(), numericScore);
    }

    setModalConfig({
      isWin,
      secretCountry: secretCountry.value,
      dailyChallengeNumber: dayNumber,
      isDailyChallenge: isDaily,
      challengeDate: isDaily ? getChallengeDate() : undefined,
      trackedPromise,
    });

    addToHistory({
      country: secretCountry.value || "Unknown",
      score: resultsGrid,
      numericScore,
      date: new Date().toISOString(),
      mode: gameMode,
    });

    store.gameStage = "seeResults";
    saveState();
  };

  const handleAddGuess = () => {
    const guess = guessInput.value;
    if (!guess || guesses.value.length >= 5) return;

    if (guess === secretCountry.value) {
      addGuess(guess); // Ensure winning guess is added to state
      finishRound(true);
      return;
    }

    guessColors.value[guess] = hint(guess).color;

    addGuess(guess);
    guessInput.value = "";

    options.onGuessAdded?.();

    if (guesses.value.length >= 5) {
      finishRound(false);
    }
  };

  const handleShowStats = () => {
    const item = dailyItem.value;
    if (!item) return;

    // Results are recorded under the Eastern date (seed), not the UTC timestamp's date
    const challengeDate = getEasternDateString(new Date(item.date));
    const dayNumber = getDailyChallengeNumber();

    setModalConfig({
      isWin: item.numericScore < 6,
      secretCountry: item.country,
      dailyChallengeNumber: dayNumber,
      isDailyChallenge: true,
      challengeDate,
      trackedPromise: Promise.resolve(true),
    });
    showStatsOverride.value = true;
  };

  const handleModalClose = () => {
    if (showStatsOverride.value) {
      showStatsOverride.value = false;
      return;
    }
    store.gameStage = "listening";
    saveState();
    options.onModalClose?.();
  };

  const handleCountrySelect = (name: string) => {
    guessInput.value = name;
  };

  const handleKeydown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;

    switch (e.code) {
      case "Space":
        e.preventDefault();
        handlePlayPause();
        break;
      case "ArrowLeft":
        e.preventDefault();
        handlePrevious();
        break;
      case "ArrowRight":
        e.preventDefault();
        handleNext();
        break;
      case "Enter":
        e.preventDefault();
        handleAddGuess();
        break;
    }
  };

  // The app has no background audio: stop the stream (and its static) when it leaves the foreground.
  let pauseListener: Promise<PluginListenerHandle> | undefined;

  onMounted(() => {
    if (isNative) {
      pauseListener = App.addListener("pause", () => {
        isPlaying.value = false;
      });
    }

    if (options.setupKeyboardShortcuts) {
      window.addEventListener("keydown", handleKeydown);
    }

    loadHistory();

    // Load both stations (for audio) and country data (for map/distance)
    // Country data failure must not block game setup (map/distance degrade, radio still works)
    Promise.all([loadStations(), loadCountryData().catch(() => {})]).then(async () => {
      // Initialize Daily Challenge Logic
      initDailyChallenge();

      if (DEBUG_STAGE) {
        // Try to restore existing session state first so refreshing doesn't change the country
        const restored = await restoreState();
        if (!restored) {
          await selectRandomCountry();
        }
        applyDebugStage(DEBUG_STAGE);
      } else if (isDailyChallengeMode.value) {
        const dailySeed = getDailyChallengeSeed();
        // Try restoring session state, but only keep it if it matches today's seed
        const restored = await restoreState();
        if (restored && currentSeed.value === dailySeed) {
          populateGuessColors();
          restoreResultsModal(true);
        } else {
          clearState();
          selectRandomCountry(dailySeed);
        }
      } else {
        // Free play or already completed daily challenge
        const restored = await restoreState();
        if (restored && secretCountry.value) {
          populateGuessColors();
          const lastHistory = gameHistory.value[gameHistory.value.length - 1];
          restoreResultsModal(lastHistory?.mode === "daily");
        } else {
          selectRandomCountry();
        }
      }
    });
  });

  onUnmounted(() => {
    void pauseListener?.then((handle) => handle.remove());
    if (options.setupKeyboardShortcuts) {
      window.removeEventListener("keydown", handleKeydown);
    }
  });

  return {
    isPlaying,
    guessInput,
    guessColors,
    showModal,
    modalConfig,
    gameHistory,
    guesses,
    currentStation,
    currentStationUrl,
    secretCountry,
    activeStation,
    dailyItem,
    mapProps,
    gameStage,
    handlePlayPause,
    handlePrevious,
    handleNext,
    handleAddGuess,
    handleModalClose,
    handleShowStats,
    handleCountrySelect,
    handleNewGame: () => {
      clearState();
      guessInput.value = "";
      guessColors.value = {};
      isPlaying.value = false;
      options.onNewGame?.();
      selectRandomCountry().then(() => {
        if (DEBUG_STAGE) applyDebugStage(DEBUG_STAGE);
      });
    },
    isStatsView: showStatsOverride,
  };
}

export type GamePlayState = UnwrapNestedRefs<ReturnType<typeof useGamePlay>>;
