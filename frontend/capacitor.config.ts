import type { CapacitorConfig } from "@capacitor/cli";

// Live reload: `CAP_SERVER_URL=http://<lan-ip>:5173 bun run cap:ios` loads the
// `bun run dev` server instead of the bundled `dist-native`. `cap sync` copies
// this config into the native projects, so a sync without the variable removes it.
const devServerUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.geohearo.app",
  appName: "GeoHearo",
  webDir: "dist-native",
  // Matches the web manifest's background_color; shown before the page paints.
  backgroundColor: "#fff9f5",
  server: devServerUrl ? { url: devServerUrl, cleartext: true } : undefined,
  plugins: {
    SystemBars: {
      // Android WebView < 140 reports wrong env(safe-area-inset-*); "native" pads
      // the WebView there instead. On newer WebViews it honours viewport-fit=cover.
      insetsHandling: "native",
      initialViewportFitValueHint: "cover",
    },
  },
};

export default config;
