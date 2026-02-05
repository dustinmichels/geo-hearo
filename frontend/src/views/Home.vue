<template>
  <div
    class="min-h-screen w-screen no-scroll-container flex flex-col items-center justify-center p-6 md:p-12 overflow-x-hidden relative"
  >
    <!-- Decorative Background Shapes for "Pop" -->
    <div
      ref="blob1"
      class="absolute top-10 right-[-5%] w-64 h-64 bg-bubblegum-pop/5 rounded-full blur-3xl -z-10"
    ></div>
    <div
      ref="blob2"
      class="absolute bottom-10 left-[-5%] w-80 h-80 bg-gumball-blue/5 rounded-full blur-3xl -z-10"
    ></div>

    <!-- Main Content Container -->
    <main
      class="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-16 items-center"
    >
      <!-- Globe Section: Top on Mobile, Right on Desktop -->
      <div
        class="order-1 lg:order-2 flex justify-center items-center py-2 lg:py-0"
      >
        <div
          ref="globeContainer"
          class="relative scale-100 sm:scale-100 opacity-0"
        >
          <!-- Squishy Background Glow -->
          <div
            class="absolute inset-0 bg-mint-shake rounded-full blur-3xl opacity-25 scale-125"
          ></div>

          <!-- Globe Image -->
          <img
            ref="globe"
            :src="globeImage"
            alt="GeoHearo Globe"
            class="w-24 sm:w-64 md:w-80 lg:w-[480px] xl:w-[540px] object-contain relative z-10"
            @error="handleImageError"
          />

          <!-- Floating Sticker Decorations (Visible on mobile now) -->
          <div
            ref="sticker1"
            class="absolute -top-3 -right-3 sm:-top-6 sm:-right-6 bg-paper-white border-3 border-pencil-lead p-2 sm:p-4 rounded-xl sm:rounded-3xl shadow-lg rotate-12 z-20"
          >
            <span class="text-xl sm:text-4xl">🎵</span>
          </div>
          <div
            ref="sticker2"
            class="absolute bottom-6 -left-6 sm:bottom-10 sm:-left-10 bg-paper-white border-3 border-pencil-lead p-2 sm:p-4 rounded-xl sm:rounded-3xl shadow-lg -rotate-12 z-20"
          >
            <span class="text-xl sm:text-4xl">📢</span>
          </div>

          <!-- Buttons Overlay (Desktop Only) -->
          <div
            class="hidden lg:flex absolute inset-0 z-30 items-center justify-center gap-4 sm:gap-6 pointer-events-none"
          >
            <div
              ref="ctaButtonDesktop"
              class="relative group cursor-pointer pointer-events-auto opacity-0 scale-50"
              @click="handleTuneIn($event)"
              @mouseenter="onButtonHover($event.currentTarget as HTMLElement)"
              @mouseleave="onButtonLeave($event.currentTarget as HTMLElement)"
            >
              <div class="magic-container">
                <div
                  class="magic-wave wave-1 rounded-[30px] sm:rounded-[36px]"
                ></div>
                <div
                  class="magic-wave wave-2 rounded-[30px] sm:rounded-[36px]"
                ></div>
              </div>
              <button
                class="btn-pressable bg-yuzu-yellow px-12 sm:px-16 py-6 sm:py-8 rounded-[30px] sm:rounded-[36px] text-4xl sm:text-6xl btn-text uppercase tracking-widest text-pencil-lead relative z-10 block"
              >
                PLAY
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Copy Section: Bottom on Mobile, Left on Desktop -->
      <div
        class="space-y-4 sm:space-y-6 order-2 lg:order-1 text-center lg:text-left"
      >
        <div class="space-y-6 lg:space-y-10">
          <h1
            ref="mainTitle"
            class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-pencil-lead opacity-0 translate-y-10"
          >
            <span class="text-gumball-blue">GeoHearo</span> is the geo-guessing
            game where you
            <span class="text-gumball-blue inline-block italic"
              >win with your ears.</span
            >
          </h1>

          <div
            class="inline-block lg:block mx-auto border-4 border-dotted border-pencil-lead/30 rounded-3xl p-6 sm:p-8"
          >
            <ul
              class="space-y-4 md:space-y-6 text-base sm:text-lg lg:text-xl text-pencil-lead/90 font-body text-left"
            >
              <li
                v-for="(step, index) in steps"
                :key="index"
                ref="stepItems"
                class="flex items-center gap-4 sm:gap-6 opacity-0 -translate-x-10"
                @mouseenter="onStepHover($event.currentTarget as HTMLElement)"
                @mouseleave="onStepLeave($event.currentTarget as HTMLElement)"
              >
                <div :class="['step-badge', step.colorClass]">
                  {{ index + 1 }}
                </div>
                <span class="leading-snug" v-html="step.text"></span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Mobile Buttons (Original Position) -->
        <div class="lg:hidden space-y-6 sm:space-y-8">
          <div class="flex justify-center pt-0 pb-6 gap-4 sm:gap-6">
            <div
              ref="ctaButtonMobile"
              class="relative group cursor-pointer opacity-0 scale-50"
              @click="handleTuneIn($event)"
              @mouseenter="onButtonHover($event.currentTarget as HTMLElement)"
              @mouseleave="onButtonLeave($event.currentTarget as HTMLElement)"
            >
              <div class="magic-container">
                <div
                  class="magic-wave wave-1 rounded-[30px] sm:rounded-[36px]"
                ></div>
                <div
                  class="magic-wave wave-2 rounded-[30px] sm:rounded-[36px]"
                ></div>
              </div>
              <button
                class="btn-pressable bg-yuzu-yellow px-12 sm:px-16 py-6 sm:py-8 rounded-[30px] sm:rounded-[36px] text-4xl sm:text-6xl btn-text uppercase tracking-widest text-pencil-lead relative z-10 block"
              >
                PLAY
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <div
      class="absolute bottom-4 w-full text-center text-eraser-grey text-sm font-heading z-20 pointer-events-auto"
    >
      <router-link
        :to="{ name: 'About' }"
        class="hover:text-bubblegum-pop transition-colors underline decoration-2 decoration-bubblegum-pop/30 underline-offset-2"
        >About</router-link
      >
      &bull; Created by
      <a
        href="https://dustinmichels.com/"
        target="_blank"
        class="hover:text-bubblegum-pop transition-colors underline decoration-2 decoration-bubblegum-pop/30 underline-offset-2"
        >Dustin Michels</a
      >
      © 2026
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const globeImage = ref('/globe.png')

// Refs for GSAP
const blob1 = ref(null)
const blob2 = ref(null)
const globeContainer = ref(null)
const globe = ref(null)
const sticker1 = ref(null)
const sticker2 = ref(null)
const mainTitle = ref(null)
const stepItems = ref<HTMLElement[]>([])
const heroQuestion = ref(null)
const ctaButtonDesktop = ref(null)
const ctaButtonMobile = ref(null)

const steps = [
  {
    text: 'Stream live radio station from a mystery country (you get 5 stations)',
    colorClass: 'bg-gumball-blue',
  },
  {
    text: 'Make a guess, get a hint, repeat',
    colorClass: 'bg-bubblegum-pop',
  },
  {
    text: 'Tomrrow will bring a new daily challenge',
    colorClass: 'bg-mint-shake',
  },
]

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'https://via.placeholder.com/400?text=< '
}

const handleTuneIn = (event: Event) => {
  // Animate button press before navigating
  const btn = event.currentTarget as HTMLElement
  gsap.to(btn, {
    scale: 0.95,
    duration: 0.1,
    yoyo: true,
    repeat: 1,
    onComplete: () => {
      router.push({ name: 'Play' })
    },
  })
}

// Hover effects
const onStepHover = (el: HTMLElement) => {
  gsap.to(el, {
    scale: 1.05,
    x: 10,
    duration: 0.3,
    ease: 'back.out(1.7)',
  })

  // Animate the badge inside
  const badge = el.querySelector('.step-badge')
  if (badge) {
    gsap.to(badge, {
      rotate: 15,
      scale: 1.2,
      duration: 0.3,
      ease: 'back.out(2)',
    })
  }
}

const onStepLeave = (el: HTMLElement) => {
  gsap.to(el, {
    scale: 1,
    x: 0,
    duration: 0.3,
    ease: 'power2.out',
  })

  const badge = el.querySelector('.step-badge')
  if (badge) {
    gsap.to(badge, {
      rotate: 0,
      scale: 1,
      duration: 0.3,
      ease: 'power2.out',
    })
  }
}

const onButtonHover = (el: HTMLElement) => {
  gsap.to(el, {
    scale: 1.05,
    rotation: -2,
    duration: 0.2,
    ease: 'power1.out',
  })

  // Handle shadow on child button if wrapped
  const target = el.classList.contains('btn-pressable')
    ? el
    : el.querySelector('.btn-pressable')
  if (target) {
    gsap.to(target, {
      boxShadow: '0 12px 0 0 #334155',
      duration: 0.2,
      ease: 'power1.out',
    })
  }
}

const onButtonLeave = (el: HTMLElement) => {
  gsap.to(el, {
    scale: 1,
    rotation: 0,
    duration: 0.2,
    ease: 'power1.out',
  })

  const target = el.classList.contains('btn-pressable')
    ? el
    : el.querySelector('.btn-pressable')
  if (target) {
    gsap.to(target, {
      boxShadow: '0 8px 0 0 #334155',
      duration: 0.2,
      ease: 'power1.out',
    })
  }
}

onMounted(() => {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  // 1. Entrance Animations
  tl.to(mainTitle.value, {
    y: 0,
    opacity: 1,
    duration: 1,
  })
    .to(
      stepItems.value,
      {
        x: 0,
        opacity: 1,
        stagger: 0.2,
        duration: 0.8,
        ease: 'back.out(1.2)',
      },
      '-=0.6'
    )
    .to(
      heroQuestion.value,
      {
        opacity: 1,
        duration: 0.8,
      },
      '-=0.4'
    )
    .to(
      [ctaButtonDesktop.value, ctaButtonMobile.value],
      {
        scale: 1,
        opacity: 1,
        stagger: 0.1,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
      },
      '-=0.4'
    )
    .to(
      globeContainer.value,
      {
        opacity: 1,
        duration: 1,
      },
      '-=1.5'
    )
    .from(
      [sticker1.value, sticker2.value],
      {
        scale: 0,
        rotation: 0,
        opacity: 0,
        stagger: 0.2,
        duration: 0.6,
        ease: 'back.out(2)',
      },
      '-=0.8'
    )

  // 2. Continuous Animations (Looping)
  // Float the globe
  gsap.to(globe.value, {
    y: -20,
    rotation: 2,
    duration: 3,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
  })

  // Float the stickers slightly differently
  gsap.to(sticker1.value, {
    y: -10,
    rotation: 15,
    duration: 2.5,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
    delay: 0.5,
  })

  gsap.to(sticker2.value, {
    y: -12,
    rotation: -15,
    duration: 3.5,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
    delay: 1,
  })

  // Move blobs around
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
/* The "Pressable" Button Effect - Base styles only, GSAP handles hover/active mostly */
.btn-pressable {
  position: relative;
  /* transition: all 0.1s ease;  <-- Removing transition to let GSAP handle it */
  box-shadow: 0 8px 0 0 #334155;
  border: 3px solid #334155;
  transform-origin: center center;
  cursor: pointer;
}

/* Badge Style */
.step-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: 3px solid #334155;
  border-radius: 10px;
  font-family: 'Fredoka', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  color: white;
  box-shadow: 3px 3px 0px 0px #334155;
  /* transition removed for GSAP */
  cursor: default;
}

@media (min-width: 768px) {
  .step-badge {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    font-size: 1.25rem;
    box-shadow: 4px 4px 0px 0px #334155;
  }
}

/* Handle high-aspect ratio devices (tall phones) to keep centered */
@media (min-height: 700px) {
  .no-scroll-container {
    overflow: hidden;
    height: 100vh;
  }
}

/* Magic Ripple Effect */
@keyframes ripple {
  0% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.magic-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.magic-wave {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  animation: ripple 3s infinite cubic-bezier(0, 0, 0.2, 1);
}

.wave-1 {
  background-color: rgba(244, 114, 182, 0.5); /* Bubblegum Pop */
  animation-delay: 0s;
}

.wave-2 {
  background-color: rgba(244, 114, 182, 0.5); /* Bubblegum Pop */
  animation-delay: 1.5s;
}
</style>
