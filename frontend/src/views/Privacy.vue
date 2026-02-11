<template>
  <div
    class="min-h-screen w-screen flex flex-col items-center justify-center p-6 md:p-12 overflow-x-hidden relative"
  >
    <!-- Hamburger Menu (Mobile Only) -->
    <div class="fixed top-4 left-4 z-[9999]">
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
          class="bg-paper-white border-3 border-pencil-lead rounded-3xl p-6 md:p-8 shadow-[6px_6px_0px_0px_#334155] animate-scale-up-fade"
          style="animation-delay: 0.2s"
        >
          <h2
            class="text-2xl md:text-3xl font-heading text-pencil-lead mb-4 flex items-center gap-3"
          >
            <span class="text-3xl md:text-4xl">🔒</span>
            Analytics
          </h2>
          <div
            class="text-base md:text-lg text-pencil-lead/90 font-body leading-relaxed"
          >
            I do some simple, privacy-preserving analytics through
            <a
              href="https://plausible.io"
              target="_blank"
              class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors"
              >Plausible.io</a
            >. No effort is made to track users around the web (as with Google
            Analytics). <br />
            <br />
            You can see what I see in the analytics dashboard here:
            <a
              href="https://plausible.io/geohearo.com"
              target="_blank"
              class="text-gumball-blue underline hover:text-gumball-blue/80 transition-colors"
            >
              https://plausible.io/geohearo.com
            </a>
          </div>
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
    transform: translateY(40px);
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
  opacity: 0;
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
