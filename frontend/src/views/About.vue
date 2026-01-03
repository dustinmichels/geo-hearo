<template>
  <div
    class="min-h-screen w-screen no-scroll-container flex flex-col items-center justify-center p-6 md:p-12 overflow-x-hidden relative"
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
          <p
            class="text-lg md:text-xl text-pencil-lead/90 font-body leading-relaxed"
            v-html="section.content"
          ></p>
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
      'GeoHearo is a passion project of a solo developer, Dustin Michels. There is no business model.',
  },
  {
    emoji: '👏',
    title: 'Thanks!',
    content:
      'Thank you to friends and family for testing! Thanks to <a href="https://radio.garden/" target="_blank" class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors">radio garden</a> for the curated list of stations.',
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

@media (min-height: 700px) {
  .no-scroll-container {
    overflow: hidden;
    height: 100vh;
  }
}
</style>
