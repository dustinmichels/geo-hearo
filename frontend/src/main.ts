import { init, track } from "@plausible-analytics/tracker";
import "vant/es/floating-panel/style";
import { createApp } from "vue";
import App from "./App.vue";
import "./assets/styles/style.css";
import { usePwaInstall } from "./composables/usePwaInstall";
import { isNative, platform } from "./lib/platform";
import router from "./router";

// 1. Initialize and store the instance
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

// 2. Track pageviews on every route change
router.afterEach((to) => {
  track("pageview", {
    url: pageOrigin + to.fullPath,
  });
});

// Register install-prompt listeners before any route renders: beforeinstallprompt can fire early.
usePwaInstall();

import { createPinia } from "pinia";

const pinia = createPinia();
createApp(App).use(router).use(pinia).mount("#app");
