import { Preferences } from "@capacitor/preferences";
import { isNative } from "./platform";

/**
 * localStorage keys that must survive iOS evicting WKWebView storage. In the app
 * each write is mirrored to native Preferences, and `hydrate()` copies them back
 * into localStorage at launch, so reads stay plain synchronous localStorage.
 */
export const PERSISTED_KEYS = [
  "geo_hearo_history",
  "dailyChallengeDate",
  "geo_hearo_distance_unit",
  "geo-hearo-onboarding-seen",
  "geo-hearo-results-tour-seen",
  "geo_hearo_daily_reminder",
] as const;

export type PersistedKey = (typeof PERSISTED_KEYS)[number];

/**
 * Native only; call before mounting the app. Preferences wins over localStorage;
 * a value only in localStorage (written before this existed) is backed up.
 */
export async function hydrate(): Promise<void> {
  if (!isNative) return;
  await Promise.all(
    PERSISTED_KEYS.map(async (key) => {
      const { value } = await Preferences.get({ key });
      if (value !== null) {
        localStorage.setItem(key, value);
        return;
      }
      const local = localStorage.getItem(key);
      if (local !== null) await Preferences.set({ key, value: local });
    }),
  );
}

export function persist(key: PersistedKey, value: string): void {
  localStorage.setItem(key, value);
  if (isNative) void Preferences.set({ key, value });
}

export function unpersist(key: PersistedKey): void {
  localStorage.removeItem(key);
  if (isNative) void Preferences.remove({ key });
}
