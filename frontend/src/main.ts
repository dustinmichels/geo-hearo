import { init, track } from "@plausible-analytics/tracker";
import "vant/es/floating-panel/style";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import "./assets/styles/style.css";
import { usePwaInstall } from "./composables/usePwaInstall";
import { watchTabDayRollover } from "./lib/dayRollover";
import { hydrate } from "./lib/persist";
import { setupNativeApp } from "./lib/nativeApp";
import { isNative, platform } from "./lib/platform";
import router from "./router";

init({
  domain: "geohearo.com",
  endpoint: "https://geohearo.com/we-hear/for-you", // Your proxy endpoint
  autoCapturePageviews: false, // Disable auto-capture since we're tracking manually
  // The app's page hostname is `localhost`, which the tracker ignores by default.
  captureOnLocalhost: isNative,
  // Tag app traffic ("ios" / "android") so it can be separated from the web.
  customProperties: isNative ? { platform } : undefined,
});

// The app's page origin is capacitor://localhost or https://localhost; report the public URL instead.
const pageOrigin = isNative ? "https://geohearo.com" : window.location.origin;

// Track pageviews on every route change
router.afterEach((to) => {
  track("pageview", {
    url: pageOrigin + to.fullPath,
  });
});

// Register install-prompt listeners before any route renders: beforeinstallprompt can fire early.
usePwaInstall();

const pinia = createPinia();
// Restore app-persisted keys into localStorage before any component reads them (no-op on the web).
hydrate().then(() => {
  createApp(App).use(router).use(pinia).mount("#app");
  if (isNative) setupNativeApp(router);
  else watchTabDayRollover();
});
