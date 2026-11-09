<script setup lang="ts">
import HamburgerMenu from "../components/HamburgerMenu.vue";

const link = (href: string, text: string) =>
  `<a href="${href}" target="_blank" class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors">${text}</a>`;

const sections: { emoji: string; title: string; content: string | string[] }[] = [
  {
    emoji: "🙈",
    title: "The Short Version",
    content:
      "GeoHearo, on the web and in the iOS and Android apps, has no accounts and no ads. It doesn't know who you are, and nothing is sold to anyone.",
  },
  {
    emoji: "🔒",
    title: "Analytics",
    content: [
      `I do some simple, privacy-preserving analytics through ${link("https://plausible.io", "Plausible.io")}: which pages are visited. No cookies, no device identifiers, and no effort is made to track users around the web (as with Google Analytics). In the apps, each page view also notes the platform (iOS or Android).`,
      `You can see what I see in the analytics dashboard here: ${link("https://plausible.io/geohearo.com", "https://plausible.io/geohearo.com")}`,
    ],
  },
  {
    emoji: "🏆",
    title: "Daily Challenge Stats",
    content:
      "When you finish a daily challenge, the game sends the challenge date and your number of guesses to a small database (hosted by Supabase), so everyone can see how the day went. Nothing else is sent with it: no name, device ID or location.",
  },
  {
    emoji: "💾",
    title: "On Your Device",
    content:
      "Your game history, settings and whether you've played today's challenge are stored on your device: in browser storage on the web, and also in the app's own storage in the apps. They are never uploaded. Clearing your browser data or deleting the app deletes them.",
  },
  {
    emoji: "🔔",
    title: "Notifications (Apps)",
    content:
      'The apps can remind you when a new daily challenge is live. They ask first, after your first daily. Reminders are scheduled on your phone: there is no push server and nothing is sent anywhere. Turn them off with "Daily reminder" in the menu or in your phone\'s settings.',
  },
  {
    emoji: "📡",
    title: "Other Services",
    content: [
      "Radio streams play directly from each station's own server, and \"Visit website\" opens the station's site. Like any web request, these servers see your IP address, and their own privacy policies apply.",
      "Map tiles come from Esri (ArcGIS), map labels from MapLibre and fonts from Google Fonts. Station and country data are loaded from geohearo.com (hosted by Netlify).",
    ],
  },
  {
    emoji: "✉️",
    title: "Contact",
    content: `Questions about privacy? Email me at ${link("mailto:bronco-eaten-bash@duck.com", "bronco-eaten-bash@duck.com")}.`,
  },
];
</script>
<template>
  <div
    class="min-h-screen w-screen flex flex-col items-center justify-center px-6 pt-safe-6 pb-safe-6 md:px-12 md:pt-safe-12 md:pb-safe-12 overflow-x-hidden relative"
  >
    <!-- Hamburger Menu -->
    <div class="fixed top-safe-4 left-safe-4 z-[9999]">
      <HamburgerMenu />
    </div>
    <!-- Decorative Background Shapes -->
    <div
      class="absolute top-10 right-[-5%] w-64 h-64 bg-bubblegum-pop/5 rounded-full blur-3xl -z-10 animate-blob1"
    ></div>
    <div
      class="absolute bottom-10 left-[-5%] w-80 h-80 bg-mint-shake/5 rounded-full blur-3xl -z-10 animate-blob2"
    ></div>

    <!-- Main Content Container -->
    <main class="max-w-4xl w-full space-y-8 md:space-y-12">
      <!-- Header -->
      <div class="text-center space-y-4">
        <h1
          class="text-4xl sm:text-5xl md:text-6xl leading-[1.1] tracking-tight text-pencil-lead animate-slide-up"
        >
          <span class="text-gumball-blue">Privacy</span>
        </h1>
      </div>

      <!-- Content Sections -->
      <div class="space-y-8 md:space-y-10">
        <section
          v-for="(section, index) in sections"
          :key="index"
          class="bg-paper-white border-3 border-pencil-lead rounded-3xl p-6 md:p-8 shadow-[6px_6px_0px_0px_#334155] animate-scale-up-fade"
          :style="{ animationDelay: `${0.2 + index * 0.15}s` }"
        >
          <h2
            class="text-2xl md:text-3xl font-heading text-pencil-lead mb-4 flex items-center gap-3"
          >
            <span class="text-3xl md:text-4xl">{{ section.emoji }}</span>
            {{ section.title }}
          </h2>
          <ul v-if="Array.isArray(section.content)" class="space-y-3">
            <li
              v-for="(item, i) in section.content"
              :key="i"
              class="flex items-start gap-3 text-base md:text-lg text-pencil-lead/90 font-body leading-relaxed"
            >
              <span class="text-gumball-blue shrink-0 mt-[6px] text-sm">⟡</span>
              <span v-html="item"></span>
            </li>
          </ul>
          <div
            v-else
            class="text-base md:text-lg text-pencil-lead/90 font-body leading-relaxed"
            v-html="section.content"
          ></div>
        </section>
        <p class="text-center text-sm text-pencil-lead/60 font-body">Last updated November 2026</p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col md:flex-row justify-center items-center gap-6 pt-6 pb-6">
        <RouterLink
          :to="{ name: 'Play' }"
          class="btn-pressable bg-mint-shake px-8 md:px-12 py-4 md:py-5 rounded-[22px] text-xl md:text-2xl text-center btn-text uppercase tracking-widest text-pencil-lead animate-pop-in-delayed hover-scale"
        >
          Play Game
        </RouterLink>

        <RouterLink
          :to="{ name: 'Home' }"
          class="btn-pressable bg-yuzu-yellow px-8 md:px-12 py-4 md:py-5 rounded-[22px] text-xl md:text-2xl text-center btn-text uppercase tracking-widest text-pencil-lead animate-pop-in-delayed hover-scale"
          style="animation-delay: 0.9s"
        >
          Back to Home
        </RouterLink>
      </div>
    </main>
  </div>
</template>
