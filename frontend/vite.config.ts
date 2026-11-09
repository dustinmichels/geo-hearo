import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { execSync } from "node:child_process";
import { copyFileSync, readdirSync, rmSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, type PluginOption } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Get git hash
const gitHash = execSync("git rev-parse --short HEAD").toString().trim();

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isNativeBuild = mode === "native";
  const outDir = isNativeBuild ? "dist-native" : "dist";

  const modePlugins: PluginOption[] = isNativeBuild
    ? [
        // Capacitor build: let the page draw under the status bar / home
        // indicator (safe-area insets are padded in CSS).
        {
          name: "native-viewport-fit-cover",
          transformIndexHtml(html) {
            return html.replace(/(name="viewport"\s+content="[^"]*)"/, '$1, viewport-fit=cover"');
          },
        },
        // Station data and its index are fetched from geohearo.com
        // (`remoteDataUrl`), so drop them from the app bundle.
        {
          name: "native-drop-remote-data",
          closeBundle() {
            for (const file of readdirSync(`${outDir}/data`)) {
              if (/^(stations_\d+\.jsonl|index\.json)$/.test(file))
                rmSync(`${outDir}/data/${file}`);
            }
          },
        },
      ]
    : [
        {
          name: "copy-404",
          closeBundle() {
            copyFileSync("dist/index.html", "dist/404.html");
          },
        },
        VitePWA({
          registerType: "autoUpdate",
          manifest: {
            name: "GeoHearo",
            short_name: "GeoHearo",
            theme_color: "#3b82f6",
            background_color: "#fff9f5",
            display: "standalone",
            icons: [
              { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
              { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
            ],
          },
          workbox: {
            globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
            runtimeCaching: [
              {
                urlPattern: /\/data\//,
                handler: "NetworkFirst",
                options: { cacheName: "station-data" },
              },
            ],
          },
        }),
      ];

  return {
    define: {
      "import.meta.env.VITE_GIT_HASH": JSON.stringify(gitHash),
    },
    plugins: [vue(), tailwindcss(), ...modePlugins],
    server: {
      allowedHosts: true,
      // `cap sync` / Xcode / Gradle write built copies of index.html under ios/ and
      // android/; don't reload on them.
      watch: { ignored: ["**/ios/**", "**/android/**"] },
    },
    // Without this, the dependency scan crawls every index.html, including those under ios/ and android/.
    optimizeDeps: { entries: ["index.html"] },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      outDir,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("maplibre-gl")) return "maplibre";
              if (id.includes("vant")) return "vant";
              if (id.includes("node_modules/vue/") || id.includes("node_modules/@vue/"))
                return "vue";
              return "vendor";
            }
          },
        },
      },
    },
  };
});
