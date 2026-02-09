<template>
  <div
    class="min-h-screen w-screen flex flex-col items-center justify-center p-6 md:p-12 overflow-x-hidden relative"
  >
    <!-- Hamburger Menu (Mobile Only) -->
    <div class="fixed top-4 left-4 z-[9999] lg:hidden">
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
                <span class="text-gumball-blue shrink-0 mt-[6px] text-sm"
                  >⟡</span
                >
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
      <div
        class="flex flex-col md:flex-row justify-center items-center gap-6 pt-6 pb-6"
      >
        <button
          class="btn-pressable bg-mint-shake px-8 md:px-12 py-4 md:py-5 rounded-[22px] text-xl md:text-2xl btn-text uppercase tracking-widest text-pencil-lead animate-pop-in-delayed hover-scale"
          @click="handlePlay"
        >
          Play Game
        </button>

        <button
          class="btn-pressable bg-yuzu-yellow px-8 md:px-12 py-4 md:py-5 rounded-[22px] text-xl md:text-2xl btn-text uppercase tracking-widest text-pencil-lead animate-pop-in-delayed hover-scale"
          style="animation-delay: 0.9s"
          @click="handleBackHome"
        >
          Back to Home
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import HamburgerMenu from '../components/HamburgerMenu.vue'

const router = useRouter()

const sections = [
  {
    emoji: '🌍',
    title: 'What is GeoHearo?',
    content:
      'GeoHearo is a passion project of a solo developer, <a href="https://dustinmichels.com" target="_blank" class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors">Dustin Michels</a>. It\'s free and <a href="https://github.com/dustinmichels/geo-hearo" target="_blank" class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors">open-source</a>. There is no business model.',
  },
  {
    emoji: '💾',
    title: 'Data Sources',
    content: [
      'The country polygons are from <a href="https://www.naturalearthdata.com/" target="_blank" class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors">Natural Earth</a>. They are the ones that decide what counts as a country.',
      'The underlying radio data is borrowed, gratefully, from <a href="https://radio.garden/" target="_blank" class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors">Radio.Garden</a>. There are over 30,000 stations to choose from when you start a game.',
    ],
  },
  {
    emoji: '📏',
    title: 'Distance Considerations',
    content: [
      'The clue you get is based on the distance between countries, from border to border.',
      "I filter out polygons that makeup &lt; 20% of the country's land mass, so as to exclude overseas territories but include major islands. The idea is to direct the player towards the main borders of the country.",
    ],
  },
  {
    emoji: '📡',
    title: 'Radio Considerations',
    content: [
      'Stations can be weird! It\'s not always a bug. Sometimes you get a Lebanese station in Germany, because there really is a Lebanese station in Germany. The world is complicated! The "show stations" feature is provided so you can find out more about the stations you hear.',
      'Sometimes a radio stream gives you commercials localized to your location, which is confusing and unfortunate.',
      'Sometimes a station is just being weird, which is why I give you five to choose from!',
    ],
  },
  {
    emoji: '🤨',
    title: 'Technical Notes',
    content: [
      'I have streaming links for over 30,000 stations. They are stored in a jsonl file, where each line is a fixed number of bytes.',
      'I have an index file that lists the countries available and the locations of their stations in the mega jsonl file.',
      'When a new round begins, I randomly select a country and five stations, and load the relevant lines from the jsonl file using ranged Fetch requests.',
      'For the daily challenge, I use the date as a random seed so all players get the same mystery country.',
    ],
  },
]

const handleBackHome = () => {
  router.push({ name: 'Home' })
}

const handlePlay = () => {
  router.push({ name: 'Play' })
}
</script>

<style scoped>
/* Pressable Button Styles */
.btn-pressable {
  position: relative;
  box-shadow: 0 8px 0 0 #334155;
  border: 3px solid #334155;
  transform-origin: center center;
  cursor: pointer;
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease;
}

.hover-scale:hover {
  transform: scale(1.05) rotate(-2deg);
  box-shadow: 0 12px 0 0 #334155;
}

.hover-scale:active {
  transform: scale(0.95);
  box-shadow: 0 4px 0 0 #334155;
}

/* Animations */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleUpFade {
  from {
    opacity: 0;
    transform: translateY(40px); /* Matches typical fadeInUp but kept simple */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-slide-up {
  opacity: 0; /* Flash prevention */
  animation: slideUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-scale-up-fade {
  opacity: 0;
  animation: scaleUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-pop-in-delayed {
  opacity: 0;
  animation: popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.8s forwards;
}

/* Blobs */
@keyframes blobMove1 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(50px, 30px) scale(1.1);
  }
}
.animate-blob1 {
  animation: blobMove1 16s ease-in-out infinite;
}

@keyframes blobMove2 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-30px, -40px) scale(1.2);
  }
}
.animate-blob2 {
  animation: blobMove2 20s ease-in-out infinite;
}
</style>
