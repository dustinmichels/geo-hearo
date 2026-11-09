import { LocalNotifications, type LocalNotificationSchema } from "@capacitor/local-notifications";
import { STORAGE_KEY_DAILY_DATE, useRadio } from "../composables/useRadio";
import { persist } from "./persist";
import { isNative } from "./platform";

/** "on" | "off"; unset until the player has been asked once. */
const SETTING_KEY = "geo_hearo_daily_reminder";
const REMINDER_HOUR = 9; // local time
const DAYS_AHEAD = 7;

export function isDailyReminderOn(): boolean {
  return localStorage.getItem(SETTING_KEY) === "on";
}

/** Challenge number of the last completed daily, 0 if none. */
function completedChallengeNumber(): number {
  const stored = localStorage.getItem(STORAGE_KEY_DAILY_DATE);
  if (!stored) return 0;
  // Stored as the Eastern date ("2026-11-09", or unpadded from older builds); 17:00 UTC falls on that Eastern date.
  const [y, m, d] = stored.split("-").map(Number);
  if (!y || !m || !d) return 0;
  return useRadio().getDailyChallengeNumber(new Date(Date.UTC(y, m - 1, d, 17)));
}

/**
 * Native only. Replaces all pending reminders with one per day at 09:00 local
 * time for the next week. A reminder is skipped when the challenge live at its
 * fire time has already been completed (today's, once the daily is done).
 */
export async function rescheduleDailyReminders(): Promise<void> {
  if (!isNative) return;
  const { notifications: pending } = await LocalNotifications.getPending();
  if (pending.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.map(({ id }) => ({ id })) });
  }
  if (!isDailyReminderOn()) return;
  if ((await LocalNotifications.checkPermissions()).display !== "granted") return;

  const { getDailyChallengeNumber } = useRadio();
  const completed = completedChallengeNumber();
  const now = new Date();
  const notifications: LocalNotificationSchema[] = [];
  for (let i = 0; i <= DAYS_AHEAD && notifications.length < DAYS_AHEAD; i++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, REMINDER_HOUR);
    if (at <= now) continue;
    const number = getDailyChallengeNumber(at);
    // Near Eastern midnight two local mornings can map to the same challenge.
    if (number <= completed || notifications.some((n) => n.id === number)) continue;
    notifications.push({
      id: number,
      title: `GeoHearo #${number} is live`,
      body: "A new mystery country is on the air. Tune in and guess where.",
      schedule: { at, allowWhileIdle: true },
      // Android: an inexact alarm is fine for a morning reminder. The default (exact)
      // opens the system "Alarms & reminders" settings screen on Android 12+.
      isExactNotification: false,
    });
  }
  if (notifications.length > 0) await LocalNotifications.schedule({ notifications });
}

/** Native only. Called after a daily is completed: asks for permission the first time, then reschedules. */
export async function offerDailyReminder(): Promise<void> {
  if (!isNative) return;
  if (localStorage.getItem(SETTING_KEY) === null) {
    const { display } = await LocalNotifications.requestPermissions();
    persist(SETTING_KEY, display === "granted" ? "on" : "off");
  }
  await rescheduleDailyReminders();
}

/**
 * Native only. Turns reminders on or off. Returns false when turning on is
 * refused because notification permission is denied (only Settings can change it).
 */
export async function setDailyReminder(on: boolean): Promise<boolean> {
  if (on && (await LocalNotifications.requestPermissions()).display !== "granted") {
    persist(SETTING_KEY, "off");
    await rescheduleDailyReminders();
    return false;
  }
  persist(SETTING_KEY, on ? "on" : "off");
  await rescheduleDailyReminders();
  return true;
}
