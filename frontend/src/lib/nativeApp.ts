import { App } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Router } from "vue-router";
import { useRadio } from "../composables/useRadio";
import { rescheduleDailyReminders } from "./dailyReminder";

/**
 * App-wide native behaviour. Call once, after the app is mounted (uses the
 * Pinia store). Pausing audio on background lives in `useGamePlay`, which owns
 * the play state.
 */
export function setupNativeApp(router: Router): void {
  const { getDailyChallengeNumber } = useRadio();
  const launchDay = getDailyChallengeNumber();

  App.addListener("resume", () => {
    // Play only picks the daily when it mounts, so an app left open overnight
    // would keep offering yesterday's. Restart on Home with the new one.
    if (getDailyChallengeNumber() !== launchDay) {
      window.location.replace("/");
      return;
    }
    void rescheduleDailyReminders();
  });

  // Android hardware back: walk the in-app history, leave the app at its start.
  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) router.back();
    else void App.exitApp();
  });

  LocalNotifications.addListener("localNotificationActionPerformed", () => {
    void router.push("/");
  });

  void rescheduleDailyReminders();
}
