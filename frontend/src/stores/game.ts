import { defineStore } from "pinia";
import { ref } from "vue";
import { persist, unpersist } from "../lib/persist";
import type { GameHistoryItem, GamePhase, RadioStation } from "../types/geo";

export const useGameStore = defineStore("game", () => {
  // State
  const secretCountry = ref<string>("");
  const guesses = ref<string[]>([]);
  const currentStations = ref<RadioStation[]>([]);
  const isDailyChallengeMode = ref(false);
  const dailyChallengeNumber = ref<number | undefined>(undefined);
  const currentSeed = ref<number | null>(null);
  const currentStationIndex = ref(3);
  const hasPlayedRadio = ref(false);
  const hasEverPlayed = ref(false);
  const hasSkippedStation = ref(false);
  const gameStage = ref<GamePhase>("guessing");
  const gameHistory = ref<GameHistoryItem[]>([]);
  const STORAGE_KEY_HISTORY = "geo_hearo_history";

  // Actions
  function addGuess(guess: string) {
    if (!guesses.value.includes(guess)) {
      guesses.value.push(guess);
    }
  }

  function resetGame() {
    guesses.value = [];
    secretCountry.value = "";
    currentStations.value = [];
    currentStationIndex.value = 3;
    currentSeed.value = null;
    hasPlayedRadio.value = false;
    hasSkippedStation.value = false;
    gameStage.value = "guessing";
    // We explicitly DO NOT reset isDailyChallengeMode here as that is a mode switch
  }

  function loadHistory() {
    const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (stored) {
      try {
        gameHistory.value = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }

  function addToHistory(item: GameHistoryItem) {
    loadHistory(); // Ensure latest
    gameHistory.value.push(item);
    persist(STORAGE_KEY_HISTORY, JSON.stringify(gameHistory.value));
  }

  function clearHistory() {
    gameHistory.value = [];
    unpersist(STORAGE_KEY_HISTORY);
  }

  return {
    // State
    secretCountry,
    guesses,
    currentStations,
    isDailyChallengeMode,
    dailyChallengeNumber,
    currentSeed,
    currentStationIndex,
    hasPlayedRadio,
    hasEverPlayed,
    hasSkippedStation,
    gameStage,
    gameHistory,

    // Actions
    addGuess,
    resetGame,
    loadHistory,
    addToHistory,
    clearHistory,
  };
});
