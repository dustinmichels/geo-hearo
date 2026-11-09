import { App } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import { SplashScreen } from "@capacitor/splash-screen";
import type { Router } from "vue-router";
import { rescheduleDailyReminders } from "./dailyReminder";
import { createDayRolloverCheck } from "./dayRollover";

/**
 * App-wide native behaviour. Call once, after the app is mounted (uses the
 * Pinia store). Pausing audio on background lives in `useGamePlay`, which owns
 * the play state.
 */
export function setupNativeApp(router: Router): void {
  const restartIfNewDay = createDayRolloverCheck();

  // The launch splash stays up (launchAutoHide: false) until the first route resolves;
  // its 200 ms fade-out covers the render that follows.
  void router.isReady().then(() => SplashScreen.hide());

  App.addListener("resume", () => {
    if (restartIfNewDay()) return;
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
