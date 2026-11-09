import { driver, type Driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { ref } from "vue";
import { persist, type PersistedKey } from "../lib/persist";

const isTourActive = ref(false);
const activeTourKey = ref<PersistedKey | null>(null);
let activeDriver: Driver | null = null;

// driver.js 1.11 dropped the arrows from its default labels (1.4 had them); keep the released look.
const PREV_BTN_TEXT = "&larr; Previous";
const NEXT_BTN_TEXT = "Next &rarr;";

function skipTour() {
  if (activeDriver) {
    activeDriver.destroy();
  }
  if (activeTourKey.value) {
    persist(activeTourKey.value, "true");
  }
  activeDriver = null;
  activeTourKey.value = null;
  isTourActive.value = false;
}

function runTour(key: PersistedKey, steps: DriveStep[]) {
  if (localStorage.getItem(key)) return;

  activeTourKey.value = key;
  activeDriver = driver({
    showProgress: true,
    prevBtnText: PREV_BTN_TEXT,
    nextBtnText: NEXT_BTN_TEXT,
    steps,
    onDestroyStarted: skipTour,
  });
  isTourActive.value = true;
  activeDriver.drive();
}

export function useOnboarding() {
  const startTour = () =>
    runTour("geo-hearo-onboarding-seen", [
      {
        element: "#tour-play-btn",
        popover: {
          title: "Play Radio",
          description: "Click to stream radio from the mystery country.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#tour-skip-forward-btn",
        popover: {
          title: "Change Station",
          description: "You have five random stations to choose from, all from the same country.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#tour-map-container",
        popover: {
          title: "Make a guess",
          description: 'Select a country on the map, then press "Guess."',
          side: "left",
          align: "center",
        },
      },
    ]);

  const startResultsTour = () => {
    const placement = window.innerWidth < 1024 ? "top" : "left";
    runTour("geo-hearo-results-tour-seen", [
      {
        element: "#station-details-panel",
        popover: {
          title: "Station Details",
          description:
            "Nice job! Now you can see details about the stations you were just listening to.",
          side: placement,
          align: "center",
        },
      },
      {
        element: "#new-game-btn",
        popover: {
          title: "When you're ready",
          description: "Listen as long as you like! Click new game when ready.",
          side: placement,
          align: "center",
        },
      },
    ]);
  };

  return {
    startTour,
    startResultsTour,
    isTourActive,
    skipTour,
    activeTourKey,
  };
}
