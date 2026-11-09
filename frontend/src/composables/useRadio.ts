import { storeToRefs } from "pinia";
import { ref } from "vue";
import { persist } from "../lib/persist";
import { remoteDataUrl } from "../lib/platform";
import { useGameStore } from "../stores/game";
import type { IndexStructure, RadioStation } from "../types/geo";

/**
 * LCG Randomizer
 * A simple seeded random number generator (Linear Congruential Generator)
 * Ensures that for a specific date (seed), we always get the same "random" results.
 */
export class SeededRandom {
  private state: number;
  constructor(seed: number) {
    this.state = seed;
  }

  nextInt(max: number): number {
    // Use BigInt to avoid precision loss with large numbers
    const nextState = (1103515245n * BigInt(this.state) + 12345n) % 2147483648n;
    this.state = Number(nextState);
    return Math.abs(this.state % max);
  }
}

/**
 * Deterministic pick for a seed: a country from the sorted `names`, then up to 5
 * distinct station offsets within it. Every player gets the same daily from this,
 * so its output must not change. `forcedCountry` (debug) skips the country draw.
 */
export function pickCountryAndStations(
  seed: number,
  names: string[],
  countries: IndexStructure["countries"],
  forcedCountry?: string,
): { country: string; stationIndices: number[] } | null {
  const rng = new SeededRandom(seed);
  const country =
    forcedCountry && names.includes(forcedCountry)
      ? forcedCountry
      : names[rng.nextInt(names.length)];
  const countryData = country ? countries[country] : undefined;
  if (!country || !countryData) return null;

  const pool = Array.from({ length: countryData.count }, (_, i) => i);
  const stationIndices: number[] = [];
  for (let i = 0; i < Math.min(5, countryData.count); i++) {
    stationIndices.push(pool.splice(rng.nextInt(pool.length), 1)[0]!);
  }
  return { country, stationIndices };
}

// Data Cache (kept local as it is resource data, not game state)
const countriesIndex = ref<IndexStructure | null>(null);
const countryList = ref<string[]>([]);

const STORAGE_KEY = "geo_hearo_state";
export const STORAGE_KEY_DAILY_DATE = "dailyChallengeDate";

export function useRadio() {
  const store = useGameStore();
  const {
    secretCountry,
    guesses,
    currentStations,
    currentStationIndex,
    currentSeed,
    isDailyChallengeMode,
    dailyChallengeNumber,
  } = storeToRefs(store);

  /**
   * Fetches a single record from the JSONL file using a byte range
   */
  const fetchStationAt = async (
    url: string,
    startByte: number,
    lineLength: number,
  ): Promise<RadioStation> => {
    const endByte = startByte + lineLength - 1;

    const response = await fetch(url, {
      headers: { Range: `bytes=${startByte}-${endByte}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch byte range ${startByte}-${endByte}`);
    }

    const text = await response.text();
    // .trim() removes the padding spaces added for fixed-width alignment
    return JSON.parse(text.trim()) as RadioStation;
  };

  const loadStations = async () => {
    if (countriesIndex.value) return; // Already loaded index

    try {
      // 1. Load Index
      const indexResponse = await fetch(remoteDataUrl("index.json"));
      const indexData: IndexStructure = await indexResponse.json();
      countriesIndex.value = indexData;
      // The keys in index.json are ADMIN names
      countryList.value = Object.keys(indexData.countries).sort();

      // State restoration is handled by the caller (useGamePlay)
      // after daily challenge mode is determined
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const saveState = () => {
    if (currentSeed.value === null) return;

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        seed: currentSeed.value,
        guesses: guesses.value,
        stationIndex: currentStationIndex.value,
        gameStage: store.gameStage,
      }),
    );
  };

  const clearState = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    store.resetGame();
  };

  /**
   * Core logic: use a seed to deterministically pick a country and fetch its stations.
   * Does NOT save to sessionStorage — callers decide when to persist.
   */
  const loadCountryBySeed = async (seed: number) => {
    if (!countriesIndex.value) return;
    if (store.currentSeed === seed && store.secretCountry) return;

    store.currentSeed = seed;

    const idx = countriesIndex.value;
    const picked = pickCountryAndStations(
      seed,
      countryList.value,
      idx.countries,
      import.meta.env.VITE_SECRET_COUNTRY,
    );
    if (!picked) {
      console.error(`No country picked for seed ${seed}`);
      return;
    }

    store.guesses = [];
    store.secretCountry = picked.country;
    store.currentStationIndex = 3;

    const { start, file: fileIndex } = idx.countries[picked.country]!;
    try {
      const lineLength = idx.config.line_length;
      const DATA_URL = remoteDataUrl(`stations_${fileIndex}.jsonl`);

      const stations = await Promise.all(
        picked.stationIndices.map((offsetIdx) => {
          const stationOffset = start + offsetIdx * lineLength;
          return fetchStationAt(DATA_URL, stationOffset, lineLength);
        }),
      );

      store.currentStations = stations;
      updatePreconnectLinks(stations);
    } catch (err) {
      console.error("Error fetching stations:", err);
    }
  };

  /**
   * Start a new round: pick a country (optionally from a seed) and persist to sessionStorage.
   */
  const selectRandomCountry = async (seed: number = Math.floor(Math.random() * 10000000)) => {
    await loadCountryBySeed(seed);
    saveState();
  };

  const updatePreconnectLinks = (stations: RadioStation[]) => {
    // 1. Clear old preconnects specific to our app
    document.querySelectorAll("link[data-gh-preconnect]").forEach((el) => el.remove());

    // 2. Add new ones
    stations.forEach((station) => {
      try {
        const url = new URL(station.channel_resolved_url);
        // Only preconnect to the origin (protocol + domain)
        const origin = url.origin;

        // Avoid duplicates if multiple stations share an origin
        if (document.head.querySelector(`link[href="${origin}"]`)) return;

        const link = document.createElement("link");
        link.rel = "preconnect";
        link.href = origin;
        link.crossOrigin = "anonymous"; // Audio is often CORS-enabled
        link.dataset.ghPreconnect = "true";
        document.head.appendChild(link);
      } catch {
        // Ignore invalid URLs
      }
    });
  };

  const restoreState = async (): Promise<boolean> => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { seed, guesses: g, stationIndex: si, gameStage: gs } = JSON.parse(stored);

        // Re-fetch country + stations from the seed without saving state
        if (typeof seed === "number") {
          await loadCountryBySeed(seed);
        }

        // Restore game progress AFTER loadCountryBySeed, which resets guesses/stationIndex
        if (g) store.guesses = g;
        if (typeof si === "number") store.currentStationIndex = si;
        if (gs) store.gameStage = gs;

        return true;
      } catch (e) {
        console.error("Failed to parse stored state", e);
        return false;
      }
    }
    return false;
  };

  const addGuess = (guessAdmin: string) => {
    store.addGuess(guessAdmin);
    saveState();
  };

  // --- Daily Challenge Logic ---

  /**
   * Returns the current date parts (year, month, day) in US/Eastern time.
   * All players worldwide see the same daily challenge, based on Eastern time.
   */
  const getEasternDateParts = (
    now: Date = new Date(),
  ): { year: number; month: number; day: number } => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(now);
    return {
      year: parseInt(parts.find((p) => p.type === "year")!.value),
      month: parseInt(parts.find((p) => p.type === "month")!.value),
      day: parseInt(parts.find((p) => p.type === "day")!.value),
    };
  };

  const getNextEasternMidnight = (now: Date = new Date()): Date => {
    const { year, month, day } = getEasternDateParts(now);
    const candidate4 = new Date(Date.UTC(year, month - 1, day + 1, 4, 0, 0));
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false,
    });
    const hour = parseInt(fmt.format(candidate4), 10);
    if (hour === 0 || hour === 24) {
      return candidate4;
    }
    return new Date(Date.UTC(year, month - 1, day + 1, 5, 0, 0));
  };

  /**
   * Calculates the Day # based on US/Eastern time relative to Feb 2, 2026.
   * Day 1 is Feb 2, 2026.
   */
  const getDailyChallengeNumber = (now: Date = new Date()): number => {
    const { year, month, day } = getEasternDateParts(now);
    const current = new Date(Date.UTC(year, month - 1, day));
    const start = new Date(Date.UTC(2026, 1, 2)); // Feb 2, 2026

    const diffTime = current.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Day 1 is the start date itself, so +1
    return diffDays + 1;
  };

  const getDailyChallengeSeed = (): number => {
    const { year, month, day } = getEasternDateParts();
    // Create a unique integer from YYYYMMDD in US/Eastern time
    return year * 10000 + month * 100 + day;
  };

  const getEasternDateString = (now: Date = new Date()): string => {
    const { year, month, day } = getEasternDateParts(now);
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  // Compare numerically: live builds stored the date unpadded ("2026-11-9"),
  // so a string compare would re-offer an already-completed daily and clear history.
  const isCompletedToday = (stored: string | null): boolean => {
    if (!stored) return false;
    const [y, m, d] = stored.split("-").map(Number);
    const { year, month, day } = getEasternDateParts();
    return y === year && m === month && d === day;
  };

  const initDailyChallenge = () => {
    if (isCompletedToday(localStorage.getItem(STORAGE_KEY_DAILY_DATE))) {
      store.isDailyChallengeMode = false;
      store.dailyChallengeNumber = undefined;
    } else {
      store.isDailyChallengeMode = true;
      store.dailyChallengeNumber = getDailyChallengeNumber();
      // Clear history on new daily challenge start
      store.clearHistory();
    }
  };

  const completeDailyChallenge = () => {
    persist(STORAGE_KEY_DAILY_DATE, getEasternDateString());
    store.isDailyChallengeMode = false;
    store.dailyChallengeNumber = undefined;
  };

  return {
    currentStations,
    secretCountry,
    currentStationIndex,
    currentSeed,
    loadStations,
    selectRandomCountry,
    guesses,
    addGuess,
    saveState,
    clearState,
    restoreState,
    // Daily Challenge
    isDailyChallengeMode,
    dailyChallengeNumber,
    initDailyChallenge,
    completeDailyChallenge,
    getDailyChallengeSeed,
    getDailyChallengeNumber,
    getEasternDateString,
    getNextEasternMidnight,
  };
}
