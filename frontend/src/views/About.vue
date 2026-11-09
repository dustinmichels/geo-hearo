<script setup lang="ts">
import Footer from "../components/Footer.vue";
import HamburgerMenu from "../components/HamburgerMenu.vue";

const sections = [
  {
    emoji: "🌍",
    title: "What is GeoHearo?",
    content:
      'GeoHearo is a passion project of a solo developer, <a href="https://dustinmichels.com" target="_blank" class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors">Dustin Michels</a>. It\'s free and <a href="https://github.com/dustinmichels/geo-hearo" target="_blank" class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors">open-source</a>. There is no business model.',
  },
  {
    emoji: "💾",
    title: "Data Sources",
    content: [
      'The country polygons are from <a href="https://www.naturalearthdata.com/" target="_blank" class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors">Natural Earth</a>. They are the ones that decide what counts as a country.',
      'The underlying radio data is borrowed, gratefully, from <a href="https://radio.garden/" target="_blank" class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors">Radio.Garden</a>, among other sources. There are over 36,000 stations to choose from (from 143 countries) when you start a game.',
    ],
  },
  {
    emoji: "📏",
    title: "Distance Considerations",
    content: [
      "The clue you get is based on the distance between countries, from border to border.",
      "I filter out polygons that makeup &lt; 20% of the country's land mass, so as to exclude overseas territories but include major islands. The idea is to direct the player towards the main borders of the country.",
    ],
  },
  {
    emoji: "📡",
    title: "Radio Considerations",
    content: [
      'Stations can be weird! It\'s not always a bug. Sometimes you get a Lebanese station in Germany, because there really is a Lebanese station in Germany. The world is complicated! The "show stations" feature is provided so you can find out more about the stations you hear.',
      "Sometimes a radio stream gives you commercials localized to your location, which is confusing and unfortunate.",
      "Sometimes a station is just being weird, which is why I give you five to choose from!",
    ],
  },
  {
    emoji: "✉️",
    title: "Contact",
    content:
      'Found a bug, have an idea, or run a station you\'d like removed from the game? Email me at <a href="mailto:bronco-eaten-bash@duck.com" class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors">bronco-eaten-bash@duck.com</a>.',
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
          <span class="text-gumball-blue">About</span>
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
          <div v-if="Array.isArray(section.content)">
            <ul class="space-y-3">
              <li
                v-for="(item, i) in section.content"
                :key="i"
                class="flex items-start gap-3 text-base md:text-lg text-pencil-lead/90 font-body leading-relaxed"
              >
                <span class="text-gumball-blue shrink-0 mt-[6px] text-sm">⟡</span>
                <span v-html="item"></span>
              </li>
            </ul>
          </div>
          <div
            v-else
            class="text-base md:text-lg text-pencil-lead/90 font-body leading-relaxed"
            v-html="section.content"
          ></div>
        </section>
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

    <!-- Footer -->
    <Footer class="text-sm" />
  </div>
</template>
