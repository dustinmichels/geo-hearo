<template>
  <div
    class="min-h-screen w-screen no-scroll-container flex flex-col items-center justify-center p-6 md:p-12 overflow-x-hidden relative"
  >
    <!-- Hamburger Menu (Mobile Only) -->
    <div class="fixed top-4 left-4 z-[9999] lg:hidden">
      <HamburgerMenu />
    </div>

    <!-- Decorative Background Shapes for "Pop" -->
    <div
      class="absolute top-10 right-[-5%] w-64 h-64 bg-bubblegum-pop/5 rounded-full blur-3xl -z-10 animate-blob1"
    ></div>
    <div
      class="absolute bottom-10 left-[-5%] w-80 h-80 bg-gumball-blue/5 rounded-full blur-3xl -z-10 animate-blob2"
    ></div>

    <!-- Main Content Container -->
    <main
      class="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-16 items-center"
    >
      <!-- Globe Section: Top on Mobile, Right on Desktop -->
      <div
        class="order-1 lg:order-2 flex justify-center items-center py-2 lg:py-0"
      >
        <div class="relative scale-100 sm:scale-100 animate-fade-in-delayed">
          <!-- Squishy Background Glow -->
          <div
            class="absolute inset-0 bg-mint-shake rounded-full blur-3xl opacity-25 scale-125"
          ></div>

          <!-- Globe Image -->
          <img
            :src="globeImage"
            alt="GeoHearo Globe"
            class="w-24 sm:w-64 md:w-80 lg:w-[480px] xl:w-[540px] object-contain relative z-10 animate-float-globe"
            @error="handleImageError"
          />

          <!-- Floating Sticker Decorations (Visible on mobile now) -->
          <div
            class="absolute -top-3 -right-3 sm:-top-6 sm:-right-6 bg-paper-white border-3 border-pencil-lead p-2 sm:p-4 rounded-xl sm:rounded-3xl shadow-lg rotate-12 z-20 animate-float-sticker1"
          >
            <span class="text-xl sm:text-4xl">🎵</span>
          </div>
          <div
            class="absolute bottom-6 -left-6 sm:bottom-10 sm:-left-10 bg-paper-white border-3 border-pencil-lead p-2 sm:p-4 rounded-xl sm:rounded-3xl shadow-lg -rotate-12 z-20 animate-float-sticker2"
          >
            <span class="text-xl sm:text-4xl">📢</span>
          </div>

          <!-- Buttons Overlay (Desktop Only) -->
          <div
            class="hidden lg:flex absolute inset-0 z-30 items-center justify-center gap-4 sm:gap-6 pointer-events-none"
          >
            <div
              class="relative group cursor-pointer pointer-events-auto animate-pop-in-delayed hover-scale"
              @click="handleTuneIn"
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
                class="btn-pressable bg-yuzu-yellow px-12 sm:px-16 py-6 sm:py-8 rounded-[30px] sm:rounded-[36px] text-4xl sm:text-6xl btn-text uppercase tracking-widest text-pencil-lead relative z-10 block transition-transform duration-200"
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
            class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-pencil-lead animate-slide-up"
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
                class="flex items-center gap-4 sm:gap-6 animate-slide-in-right hover-step"
                :style="{ animationDelay: `${0.6 + index * 0.2}s` }"
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
              class="relative group cursor-pointer animate-pop-in-late hover-scale"
              @click="handleTuneIn"
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
                class="btn-pressable bg-yuzu-yellow px-12 sm:px-16 py-6 sm:py-8 rounded-[30px] sm:rounded-[36px] text-4xl sm:text-6xl btn-text uppercase tracking-widest text-pencil-lead relative z-10 block transition-transform duration-200"
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import HamburgerMenu from '../components/HamburgerMenu.vue'

const router = useRouter()
const globeImage = ref('/globe.png')

const steps = [
  {
    text: 'Stream five live, random radio stations from a mystery country',
    colorClass: 'bg-gumball-blue',
  },
  {
    text: 'Make a guess, get a hint, repeat',
    colorClass: 'bg-bubblegum-pop',
  },
  {
    text: 'Tomorrow will bring a new daily challenge',
    colorClass: 'bg-mint-shake',
  },
]

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'https://via.placeholder.com/400?text=< '
}

const handleTuneIn = (_event: Event) => {
  // Simple click animation feedback handled by :active CSS or small JS delay if critical
  // For now, just navigate immediately as CSS active state provides feedback
  router.push({ name: 'Play' })
}
</script>

<style scoped>
/* The "Pressable" Button Effect */
.btn-pressable {
  position: relative;
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease;
  box-shadow: 0 8px 0 0 #334155;
  border: 3px solid #334155;
  transform-origin: center center;
  cursor: pointer;
}

.hover-scale:hover .btn-pressable {
  transform: scale(1.05) rotate(-2deg);
  box-shadow: 0 12px 0 0 #334155;
}

.hover-scale:active .btn-pressable {
  transform: scale(0.95);
  box-shadow: 0 4px 0 0 #334155;
}

/* Badge Style and List Item Hover */
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
  cursor: default;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.hover-step {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.hover-step:hover {
  transform: translateX(10px) scale(1.05);
}

.hover-step:hover .step-badge {
  transform: scale(1.2) rotate(15deg);
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

/* Handle high-aspect ratio devices */
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

/* ------------------
   New CSS Animations
   ------------------ */

/* Fade/Slide In Animations */
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

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
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
  animation: slideUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-slide-in-right {
  opacity: 0; /* Starts hidden */
  animation: slideInRight 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.animate-fade-in-delayed {
  opacity: 0;
  animation: fadeIn 1s ease-out 0.5s forwards;
}

.animate-pop-in-delayed {
  opacity: 0;
  animation: popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1s forwards;
}

.animate-pop-in-late {
  opacity: 0;
  animation: popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1.2s forwards;
}

/* Floating / Continuous Animations */

/* Globe specific float */
@keyframes floatY {
  0%,
  100% {
    transform: translateY(-20px) rotate(2deg);
  }
  50% {
    transform: translateY(0px) rotate(-2deg);
  }
}
.animate-float-globe {
  animation: floatY 6s ease-in-out infinite;
}

/* Sticker 1 Float */
@keyframes floatSticker1 {
  0%,
  100% {
    transform: translateY(-10px) rotate(15deg);
  }
  50% {
    transform: translateY(0px) rotate(12deg);
  }
}
.animate-float-sticker1 {
  /* Starting rotation was 12deg in HTML class, animation will override, so baked into keyframes */
  animation: floatSticker1 5s ease-in-out infinite 0.5s;
}

/* Sticker 2 Float */
@keyframes floatSticker2 {
  0%,
  100% {
    transform: translateY(-12px) rotate(-15deg);
  }
  50% {
    transform: translateY(0px) rotate(-12deg);
  }
}
.animate-float-sticker2 {
  animation: floatSticker2 7s ease-in-out infinite 1s;
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
