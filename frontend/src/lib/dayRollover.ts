import { useRadio } from "../composables/useRadio";

/**
 * Play only picks the daily when it mounts, so a page left open past Eastern
 * midnight keeps offering yesterday's challenge. Returns a check to run when the
 * page comes back to the foreground: on a new Eastern day it restarts on Home
 * (which offers the new daily) and returns true. Call after mount (uses the
 * Pinia store).
 */
export function createDayRolloverCheck(): () => boolean {
  const { getDailyChallengeNumber } = useRadio();
  const launchDay = getDailyChallengeNumber();
  return () => {
    if (getDailyChallengeNumber() === launchDay) return false;
    window.location.replace("/");
    return true;
  };
}

/** Web: run the check whenever the tab becomes visible again. The app uses `App` `resume` (nativeApp.ts). */
export function watchTabDayRollover(): void {
  const restartIfNewDay = createDayRolloverCheck();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") restartIfNewDay();
  });
}
