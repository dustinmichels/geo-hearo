<template>
  <div
    class="min-h-screen w-screen flex flex-col items-center justify-center p-6 md:p-12 overflow-x-hidden relative"
  >
    <!-- Decorative Background Shapes -->
    <div
      ref="blob1"
      class="absolute top-10 right-[-5%] w-64 h-64 bg-bubblegum-pop/5 rounded-full blur-3xl -z-10"
    ></div>
    <div
      ref="blob2"
      class="absolute bottom-10 left-[-5%] w-80 h-80 bg-mint-shake/5 rounded-full blur-3xl -z-10"
    ></div>

    <!-- Main Content Container -->
    <main class="max-w-4xl w-full space-y-8 md:space-y-12">
      <!-- Header -->
      <div class="text-center space-y-4">
        <h1
          ref="title"
          class="text-4xl sm:text-5xl md:text-6xl leading-[1.1] tracking-tight text-pencil-lead opacity-0 translate-y-10"
        >
          <span class="text-gumball-blue">About</span>
        </h1>
      </div>

      <!-- Content Sections -->
      <div class="space-y-8 md:space-y-10">
        <section
          v-for="(section, index) in sections"
          :key="index"
          ref="sectionRefs"
          class="bg-paper-white border-3 border-pencil-lead rounded-3xl p-6 md:p-8 shadow-[6px_6px_0px_0px_#334155] opacity-0 translate-y-10"
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
          ref="playButton"
          class="btn-pressable bg-mint-shake px-8 md:px-12 py-4 md:py-5 rounded-[22px] text-xl md:text-2xl btn-text uppercase tracking-widest text-pencil-lead opacity-0 scale-50"
          @click="handlePlay"
          @mouseenter="onButtonHover"
          @mouseleave="onButtonLeave"
        >
          Play Game
        </button>

        <button
          ref="backButton"
          class="btn-pressable bg-yuzu-yellow px-8 md:px-12 py-4 md:py-5 rounded-[22px] text-xl md:text-2xl btn-text uppercase tracking-widest text-pencil-lead opacity-0 scale-50"
          @click="handleBackHome"
          @mouseenter="onButtonHover"
          @mouseleave="onButtonLeave"
        >
          Back to Home
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Refs for GSAP
const blob1 = ref(null)
const blob2 = ref(null)
const title = ref(null)
const sectionRefs = ref<HTMLElement[]>([])
const backButton = ref(null)
const playButton = ref(null)

const sections = [
  {
    emoji: '🌍',
    title: 'What is GeoHearo?',
    content:
      'GeoHearo is a passion project of a solo developer, <a href="https://dustinmichels.com" target="_blank" class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors">Dustin Michels</a>. Its free and <a href="https://github.com/dustinmichels/geo-hearo" target="_blank" class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors">open-source</a>. There is no business model.',
  },
  {
    emoji: '💾',
    title: 'Data Sources',
    content: [
      'The country polygons are from <a href="https://www.naturalearthdata.com/" target="_blank" class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors">Natural Earth</a>. They are the ones that decide what counts as a country.',
      'The underlying radio data is borrowed, gratefully, from <a href="https://radio.garden/" target="_blank" class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors">Radio.Garden</a>. There are over 30,000 stations to chose from when you start a game.',
    ],
  },
  {
    emoji: '📏',
    title: 'Distance Considerations',
    content: [
      'The clue you get is based on this distance between countries, from border to border.',
      'I filter out polygons that makeup &lt; 20% of the countrys land mass, so as to exclude overseas terriroties but include major islands. The idea is to direct the player towards the main borders of the country.',
    ],
  },
  {
    emoji: '📡',
    title: 'Radio Considerations',
    content: [
      'Stations can be weird! Its not always a bug. Sometimes you get a Labanese station in Germany, because there really is a Labanese station in Germany. The world is complicated! The "show stations" feature is provided so you can find out more about the stations you hear.',
      'Sometimes a radio stream gives you commercials localized to your location, which is confusing and unfortunate.',
      'Sometimes a station is just being weird, which is why I give you five to choose from!',
    ],
  },
  {
    emoji: '🤨',
    title: 'Technical Notes',
    content: [
      'I have streaming links for over 30,000 stations. They are stored in a jsonl files, where each line is a fixed number of bytes.',
      'I have an index file that lists the countries available the locations of their stations in the mega jsonl file.',
      'When a new round begins, I randomly select a country and five stations, and load the relevant lines from the jsonl file using ranged Fetch requests',
      'For the daily challenge, I use the date as a random seed so all players get the same mystery country.',
    ],
  },
]

const handleBackHome = () => {
  gsap.to(backButton.value, {
    scale: 0.95,
    duration: 0.1,
    yoyo: true,
    repeat: 1,
    onComplete: () => {
      router.push({ name: 'Home' })
    },
  })
}

const handlePlay = () => {
  gsap.to(playButton.value, {
    scale: 0.95,
    duration: 0.1,
    yoyo: true,
    repeat: 1,
    onComplete: () => {
      router.push({ name: 'Play' })
    },
  })
}

const onButtonHover = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  gsap.to(target, {
    scale: 1.05,
    rotation: -2,
    boxShadow: '0 12px 0 0 #334155',
    duration: 0.2,
    ease: 'power1.out',
  })
}

const onButtonLeave = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  gsap.to(target, {
    scale: 1,
    rotation: 0,
    boxShadow: '0 8px 0 0 #334155',
    duration: 0.2,
    ease: 'power1.out',
  })
}

onMounted(() => {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  // Entrance Animations
  tl.to(title.value, {
    y: 0,
    opacity: 1,
    duration: 1,
  })
    .to(
      sectionRefs.value,
      {
        y: 0,
        opacity: 1,
        stagger: 0.15,
        duration: 0.8,
      },
      '-=0.6'
    )
    .to(
      [backButton.value, playButton.value],
      {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'elastic.out(1, 0.5)',
      },
      '-=0.4'
    )

  // Continuous blob animations
  gsap.to(blob1.value, {
    x: 50,
    y: 30,
    scale: 1.1,
    duration: 8,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
  })

  gsap.to(blob2.value, {
    x: -30,
    y: -40,
    scale: 1.2,
    duration: 10,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
  })
})
</script>

<style scoped>
.btn-pressable {
  position: relative;
  box-shadow: 0 8px 0 0 #334155;
  border: 3px solid #334155;
  transform-origin: center center;
  cursor: pointer;
}
</style>
