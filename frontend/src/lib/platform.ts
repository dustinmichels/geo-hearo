import { Capacitor } from "@capacitor/core";

/** True inside the iOS/Android app, false on the web. */
export const isNative = Capacitor.isNativePlatform();

/** "ios" | "android" | "web" */
export const platform = Capacitor.getPlatform();

/**
 * URL of a file under `public/data/` that is too large or too volatile to bundle
 * in the app (`index.json`, `stations_*.jsonl`). The web build leaves
 * `VITE_REMOTE_DATA_BASE` unset and fetches same-origin; the native build
 * (`.env.native`) fetches from geohearo.com.
 */
export function remoteDataUrl(path: string): string {
  return `${import.meta.env.VITE_REMOTE_DATA_BASE ?? ""}/data/${path}`;
}

/**
 * Top (status bar / notch) and bottom (home indicator) safe-area insets in px.
 * Both 0 on the web build, which does not opt into `viewport-fit=cover`.
 */
export function safeAreaInsets(): { top: number; bottom: number } {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;visibility:hidden;padding-top:var(--safe-top);padding-bottom:var(--safe-bottom)";
  document.body.appendChild(probe);
  const style = getComputedStyle(probe);
  const insets = {
    top: parseFloat(style.paddingTop) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
  };
  probe.remove();
  return insets;
}
