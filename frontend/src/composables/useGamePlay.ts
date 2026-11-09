import { storeToRefs } from "pinia";
import { computed, onMounted, onUnmounted, ref, type UnwrapNestedRefs } from "vue";
import { trackDailyResult } from "../lib/supabase";
import { useGameStore } from "../stores/game";
import type { GamePhase } from "../types/geo";
import { getColorForDistanceLevel } from "../utils/colors";
import { getDistanceHint } from "../utils/geography";
import { useCountryData } from "./useCountryData";
import { useRadio } from "./useRadio";

interface GamePlayOptions {
  onGuessAdded?: () => void;
  onNewGame?: () => void;
  onModalClose?: () => void;
  setupKeyboardShortcuts?: boolean;
}

export interface ModalConfig {
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
  const { roundFinished, gameHistory, gameStage } = storeToRefs(store);
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
    checkGuess,
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

  const populateGuessColors = () => {
    guesses.value.forEach((guess) => {
      if (guessColors.value[guess]) return;

      // Explicit check for exact match (Win) -> Green
      if (guess.toLowerCase() === secretCountry.value?.toLowerCase()) {
        guessColors.value[guess] = "#4ade80"; // Green-400
        return;
      }

      const secretFeature = getFeature(secretCountry.value);
      const guessFeature = getFeature(guess);

      if (secretFeature && guessFeature) {
        const { level } = getDistanceHint(guessFeature, secretFeature);
        const color = getColorForDistanceLevel(level);
        guessColors.value[guess] = color;
      } else {
        guessColors.value[guess] = "#FB923C";
      }
    });
  };

  const generateEmojiString = () => {
    // Clone guesses to avoid modifying the reactive array during this operation if needed
    const currentGuesses = [...guesses.value];

    let emojiLine = "";
    currentGuesses.forEach((guess) => {
      // Check for win
      if (guess.toLowerCase() === secretCountry.value?.toLowerCase()) {
        emojiLine += "🟢";
        return;
      }

      const secretFeature = getFeature(secretCountry.value);
      const guessFeature = getFeature(guess);

      if (secretFeature && guessFeature) {
        const { emoji } = getDistanceHint(guessFeature, secretFeature);
        emojiLine += emoji;
      } else {
        emojiLine += "⬜"; // Fallback
      }
    });
    return emojiLine;
  };

  const generateShareText = (dayNumber: number) => {
    const lines = [`GeoHearo #${dayNumber}`, "https://geohearo.com/"];

    const emojiLine = generateEmojiString();
    lines.push(emojiLine);
    return lines.join("\n");
  };

  // currentSeed is YYYYMMDD as a number (e.g. 20260319) — convert to "2026-03-19"
  const getChallengeDate = (): string => {
    const s = (currentSeed.value ?? 0).toString();
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  };

  const finishRound = (isWin: boolean) => {
    const resultsGrid = generateEmojiString();
    let dayNumber: number | undefined;
    const gameMode = isDailyChallengeMode.value ? "daily" : "free";
    const isDaily = isDailyChallengeMode.value;

    const numericScore =
      guesses.value.findIndex((g) => g.toLowerCase() === secretCountry.value?.toLowerCase()) + 1 ||
      6;

    let trackedPromise: Promise<boolean> | undefined;
    if (isDaily) {
      dayNumber = dailyChallengeNumber.value || 0;
      completeDailyChallenge(); // Mark as done for today
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
    const guess = guessInput.value.trim();
    if (!guess || guesses.value.length >= 5) return;

    if (checkGuess(guess)) {
      addGuess(guess); // Ensure winning guess is added to state
      finishRound(true);
      return;
    }

    const secretFeature = getFeature(secretCountry.value);
    const guessFeature = getFeature(guess);

    // Check for exact match first (Win condition color)
    if (guess.toLowerCase() === secretCountry.value?.toLowerCase()) {
      guessColors.value[guess] = "#4ade80";
    } else if (secretFeature && guessFeature) {
      const { level } = getDistanceHint(guessFeature, secretFeature);
      const color = getColorForDistanceLevel(level);
      guessColors.value[guess] = color;
    } else {
      guessColors.value[guess] = "#FB923C";
    }

    addGuess(guess);
    guessInput.value = "";

    options.onGuessAdded?.();

    if (guesses.value.length >= 5) {
      finishRound(false);
    }
  };

  const handleShowStats = () => {
    const dailyItem = gameHistory.value.find((item) => item.mode === "daily");
    if (!dailyItem) return;

    // Results are recorded under the Eastern date (seed), not the UTC timestamp's date
    const challengeDate = getEasternDateString(new Date(dailyItem.date));
    const dayNumber = getDailyChallengeNumber();

    setModalConfig({
      isWin: dailyItem.score.includes("🟢"),
      secretCountry: dailyItem.country,
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

  const handleModalConfirm = () => {
    clearState();
    guessInput.value = "";
    guessColors.value = {};
    isPlaying.value = false;
    options.onNewGame?.();
    selectRandomCountry();
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

  onMounted(() => {
    if (options.setupKeyboardShortcuts) {
      window.addEventListener("keydown", handleKeydown);
    }

    loadHistory();

    // Load both stations (for audio) and country data (for map/distance)
    // Country data failure must not block game setup (map/distance degrade, radio still works)
    Promise.all([loadStations(), loadCountryData().catch(() => {})]).then(async () => {
      // Initialize Daily Challenge Logic
      initDailyChallenge();

      const debugStage = import.meta.env.VITE_GAME_STAGE as GamePhase | undefined;
      if (debugStage === "seeResults" || debugStage === "listening") {
        // Debug mode: Skip to specified stage

        // Try to restore existing session state first so refreshing doesn't change the country
        const restored = await restoreState();
        if (!restored) {
          await selectRandomCountry();
        }

        setModalConfig({
          secretCountry: secretCountry.value,
        });
        store.gameStage = debugStage;
      } else if (isDailyChallengeMode.value) {
        const dailySeed = getDailyChallengeSeed();
        // Try restoring session state, but only keep it if it matches today's seed
        const restored = await restoreState();
        if (restored && currentSeed.value === dailySeed) {
          populateGuessColors();
          // Re-populate modal config if we're restoring into seeResults
          if (gameStage.value === "seeResults") {
            setModalConfig({
              isWin:
                roundFinished.value &&
                guesses.value.some((g) => g.toLowerCase() === secretCountry.value?.toLowerCase()),
              secretCountry: secretCountry.value,
              dailyChallengeNumber: dailyChallengeNumber.value,
              isDailyChallenge: true,
              challengeDate: getChallengeDate(),
              trackedPromise: Promise.resolve(true),
            });
          }
        } else {
          clearState();
          selectRandomCountry(dailySeed);
        }
      } else {
        // Free play or already completed daily challenge
        const restored = await restoreState();
        if (restored && secretCountry.value) {
          populateGuessColors();
          // Re-populate modal config if we're restoring into seeResults
          if (gameStage.value === "seeResults") {
            const lastHistory = gameHistory.value[gameHistory.value.length - 1];
            const isDailyHistory = lastHistory?.mode === "daily";

            setModalConfig({
              isWin:
                roundFinished.value &&
                guesses.value.some((g) => g.toLowerCase() === secretCountry.value?.toLowerCase()),
              secretCountry: secretCountry.value,
              isDailyChallenge: isDailyHistory,
              challengeDate: isDailyHistory ? getChallengeDate() : undefined,
              trackedPromise: isDailyHistory ? Promise.resolve(true) : undefined,
            });
          }
        } else {
          selectRandomCountry();
        }
      }
    });
  });

  onUnmounted(() => {
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
    currentStations,
    currentStationUrl,
    secretCountry,
    debugCountry,
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
    handleModalConfirm,
    handleCountrySelect,
    handleNewGame: () => {
      clearState();
      guessInput.value = "";
      guessColors.value = {};
      isPlaying.value = false;
      options.onNewGame?.();
      selectRandomCountry().then(() => {
        // Debug override: Skip to specified stage on new game
        const debugStage = import.meta.env.VITE_GAME_STAGE as GamePhase | undefined;
        if (debugStage === "seeResults" || debugStage === "listening") {
          setModalConfig({
            secretCountry: secretCountry.value,
          });
          store.gameStage = debugStage;
        }
      });
    },
    isStatsView: showStatsOverride,
    handleShare: async () => {
      const text = generateShareText(dailyChallengeNumber.value || 0);
      try {
        await navigator.clipboard.writeText(text);
        // Could add toast notification here
      } catch (err) {
        console.error("Failed to copy results", err);
      }
    },
  };
}

export type GamePlayState = UnwrapNestedRefs<ReturnType<typeof useGamePlay>>;
