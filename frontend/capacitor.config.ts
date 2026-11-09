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
      // Dark status bar text: the app is light-only, also when the phone is in dark mode.
      style: "LIGHT",
    },
    SplashScreen: {
      // Hidden by `setupNativeApp` once the first route has rendered.
      launchAutoHide: false,
      backgroundColor: "#fff9f5",
    },
    LocalNotifications: {
      // Android status-bar icon: white GH on transparent (res/drawable-*dpi/ic_stat_geohearo.png),
      // tinted with the logo blue in the notification shade. Ignored on iOS.
      smallIcon: "ic_stat_geohearo",
      iconColor: "#0000ff",
    },
  },
};

export default config;
