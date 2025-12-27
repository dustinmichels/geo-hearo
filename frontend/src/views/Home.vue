<template>
  <div
    class="min-h-screen w-screen no-scroll-container flex flex-col items-center justify-center p-6 md:p-12 overflow-x-hidden relative"
  >
    <!-- Decorative Background Shapes for "Pop" -->
    <div
      class="absolute top-10 right-[-5%] w-64 h-64 bg-bubblegum-pop/5 rounded-full blur-3xl -z-10"
    ></div>
    <div
      class="absolute bottom-10 left-[-5%] w-80 h-80 bg-gumball-blue/5 rounded-full blur-3xl -z-10"
    ></div>

    <!-- Main Content Container -->
    <main
      class="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
    >
      <!-- Globe Section: Top on Mobile, Right on Desktop -->
      <div
        class="order-1 lg:order-2 flex justify-center items-center py-4 lg:py-0"
      >
        <div class="relative scale-100 sm:scale-100">
          <!-- Squishy Background Glow -->
          <div
            class="absolute inset-0 bg-mint-shake rounded-full blur-3xl opacity-25 scale-125"
          ></div>

          <!-- Globe Image -->
          <img
            :src="globeImage"
            alt="GeoHearo Globe"
            class="w-52 sm:w-64 md:w-80 lg:w-[480px] xl:w-[540px] object-contain float-animation relative z-10"
            @error="handleImageError"
          />

          <!-- Floating Sticker Decorations (Visible on mobile now) -->
          <div
            class="absolute -top-3 -right-3 sm:-top-6 sm:-right-6 bg-paper-white border-3 border-pencil-lead p-3 sm:p-4 rounded-xl sm:rounded-3xl shadow-lg rotate-12 z-20"
          >
            <span class="text-2xl sm:text-4xl">🎵</span>
          </div>
          <div
            class="absolute bottom-6 -left-6 sm:bottom-10 sm:-left-10 bg-paper-white border-3 border-pencil-lead p-3 sm:p-4 rounded-xl sm:rounded-3xl shadow-lg -rotate-12 z-20"
          >
            <span class="text-2xl sm:text-4xl">📢</span>
          </div>
        </div>
      </div>

      <!-- Copy Section: Bottom on Mobile, Left on Desktop -->
      <div
        class="space-y-6 sm:space-y-10 order-2 lg:order-1 text-center lg:text-left"
      >
        <div class="space-y-6 lg:space-y-10">
          <h1
            class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-pencil-lead"
          >
            GeoHearo is the geo-guessing game where you
            <span class="text-gumball-blue">win with your ears.</span>
          </h1>

          <ul
            class="space-y-4 md:space-y-6 text-lg sm:text-xl lg:text-2xl text-pencil-lead/90 font-body text-left inline-block lg:block mx-auto"
          >
            <li class="flex items-center gap-4 sm:gap-6">
              <div class="step-badge bg-gumball-blue">1</div>
              <span class="leading-snug"
                >Stream live radio from a mystery country</span
              >
            </li>
            <li class="flex items-center gap-4 sm:gap-6">
              <div class="step-badge bg-bubblegum-pop">2</div>
              <span class="leading-snug"
                >Pay attention to languages and music</span
              >
            </li>
            <li class="flex items-center gap-4 sm:gap-6">
              <div class="step-badge bg-mint-shake">3</div>
              <span class="leading-snug"
                >Figure out where in the world you are</span
              >
            </li>
          </ul>
        </div>

        <div class="space-y-6 sm:space-y-8">
          <p
            class="text-xl sm:text-2xl md:text-3xl font-heading text-bubblegum-pop uppercase tracking-tight leading-none"
          >
            Do you have what it takes to be... <br />
            <span
              class="text-3xl sm:text-4xl md:text-5xl text-pencil-lead block mt-2"
              >The Geo Hearo?</span
            >
          </p>

          <div class="flex justify-center lg:justify-start pt-2 pb-6 lg:pb-0">
            <button
              class="btn-pressable bg-yuzu-yellow px-10 sm:px-14 py-4 sm:py-6 rounded-[22px] sm:rounded-[26px] text-2xl sm:text-3xl btn-text uppercase tracking-widest text-pencil-lead transition-transform active:scale-95"
              @click="handleTuneIn"
            >
              Tune In
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const globeImage = ref('/globe.png')

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'https://via.placeholder.com/400?text=<'
}

const handleTuneIn = () => {
  router.push({ name: 'Play' })
}
</script>

<style scoped>
/* The "Pressable" Button Effect */
.btn-pressable {
  position: relative;
  transition: all 0.1s ease;
  box-shadow: 0 8px 0 0 #334155;
  border: 3px solid #334155;
}

.btn-pressable:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 0 0 #334155;
}

.btn-pressable:active {
  transform: translateY(4px);
  box-shadow: 0 4px 0 0 #334155;
}

/* Floating Animation for the Globe */
@keyframes float {
  0% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-15px) rotate(4deg);
  }
  100% {
    transform: translateY(0px) rotate(0deg);
  }
}

.float-animation {
  animation: float 4.5s ease-in-out infinite;
}

/* Jiggle Animation for Badges */
@keyframes jiggle {
  0% {
    transform: rotate(0deg) scale(1.1);
  }
  25% {
    transform: rotate(-8deg) scale(1.1);
  }
  75% {
    transform: rotate(8deg) scale(1.1);
  }
  100% {
    transform: rotate(0deg) scale(1.1);
  }
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
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
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

.step-badge:hover,
.step-badge:active {
  animation: jiggle 0.3s ease-in-out infinite;
}

/* Handle high-aspect ratio devices (tall phones) to keep centered */
@media (min-height: 700px) {
  .no-scroll-container {
    overflow: hidden;
    height: 100vh;
  }
}
</style>
