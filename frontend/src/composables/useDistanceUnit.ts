import { ref } from "vue";
import { persist } from "../lib/persist";

type DistanceUnit = "mi" | "km";

const KM_TO_MI = 0.621371;
const MILE_REGIONS = ["US", "GB", "LR", "MM"];

function getDefaultUnit(): DistanceUnit {
  try {
    const locale = new Intl.Locale(navigator.language);
    if (locale.region && MILE_REGIONS.includes(locale.region)) {
      return "mi";
    }
  } catch {
    // Fall through to km if locale parsing fails
  }
  return "km";
}

const STORAGE_KEY = "geo_hearo_distance_unit";

function getSavedUnit(): DistanceUnit {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "mi" || saved === "km") {
    return saved;
  }
  return getDefaultUnit();
}

// Read on first use, not at import: the app copies persisted values into
// localStorage (`hydrate()` in main.ts) after modules load but before mount.
const distanceUnit = ref<DistanceUnit | null>(null);

export function useDistanceUnit() {
  distanceUnit.value ??= getSavedUnit();

  const toggleUnit = () => {
    distanceUnit.value = distanceUnit.value === "mi" ? "km" : "mi";
    persist(STORAGE_KEY, distanceUnit.value);
  };

  const formatDistance = (km: number | undefined): string => {
    if (km === undefined) return "";
    if (distanceUnit.value === "km") {
      return `${Math.round(km).toLocaleString()} km`;
    }
    return `${Math.round(km * KM_TO_MI).toLocaleString()} mi`;
  };

  return {
    distanceUnit,
    toggleUnit,
    formatDistance,
  };
}
