<script setup lang="ts">
import { CirclePlay, Home, Info, Menu, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const isOpen = ref(false)

const currentRouteName = computed(() => route.name)

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const closeMenu = () => {
  isOpen.value = false
}
</script>

<template>
  <div class="inline-flex">
    <button
      @click="toggleMenu"
      class="bg-paper-white/90 backdrop-blur-sm text-pencil-lead rounded-lg p-2 hover:bg-paper-white transition-colors duration-200 cursor-pointer flex items-center justify-center relative z-50 shadow-sm"
      aria-label="Open Menu"
    >
      <Menu :size="20" :stroke-width="2.5" />
    </button>

    <!-- Drawer & Overlay -->
    <Teleport to="body">
      <!-- Overlay -->
      <Transition name="fade">
        <div
          v-if="isOpen"
          class="fixed inset-0 bg-pencil-lead/50 backdrop-blur-sm z-[100001]"
          @click="closeMenu"
        ></div>
      </Transition>

      <!-- Drawer -->
      <Transition name="slide">
        <div
          v-if="isOpen"
          class="fixed top-0 left-0 h-full w-[280px] bg-paper-white border-r-3 border-pencil-lead z-[100002] flex flex-col p-6 shadow-2xl"
        >
          <!-- Header -->
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-2xl font-heading text-pencil-lead">Menu</h2>
            <button
              @click="closeMenu"
              class="bg-berry-oops text-white border-2 border-pencil-lead rounded-full p-1 hover:scale-110 transition-transform cursor-pointer"
              aria-label="Close Menu"
            >
              <X :size="20" :stroke-width="3" />
            </button>
          </div>

          <!-- Links -->
          <nav class="flex flex-col gap-4">
            <RouterLink
              to="/"
              class="group flex items-center gap-4 p-3 rounded-xl border-2 border-transparent hover:border-pencil-lead hover:bg-cloud-white transition-all duration-200"
              :class="{
                'opacity-50 grayscale pointer-events-none':
                  currentRouteName === 'Home',
              }"
              @click="closeMenu"
            >
              <div
                class="w-10 h-10 rounded-full bg-gumball-blue/20 text-gumball-blue flex items-center justify-center border-2 border-gumball-blue group-hover:scale-110 transition-transform"
              >
                <Home :size="20" :stroke-width="2.5" />
              </div>
              <span class="font-heading text-lg text-pencil-lead">Home</span>
            </RouterLink>

            <RouterLink
              to="/play"
              class="group flex items-center gap-4 p-3 rounded-xl border-2 border-transparent hover:border-pencil-lead hover:bg-cloud-white transition-all duration-200"
              :class="{
                'opacity-50 grayscale pointer-events-none':
                  currentRouteName === 'Play',
              }"
              @click="closeMenu"
            >
              <div
                class="w-10 h-10 rounded-full bg-mint-shake/20 text-emerald-600 flex items-center justify-center border-2 border-emerald-600 group-hover:scale-110 transition-transform"
              >
                <CirclePlay :size="20" :stroke-width="2.5" />
              </div>
              <span class="font-heading text-lg text-pencil-lead">Play</span>
            </RouterLink>

            <RouterLink
              to="/about"
              class="group flex items-center gap-4 p-3 rounded-xl border-2 border-transparent hover:border-pencil-lead hover:bg-cloud-white transition-all duration-200"
              :class="{
                'opacity-50 grayscale pointer-events-none':
                  currentRouteName === 'About',
              }"
              @click="closeMenu"
            >
              <div
                class="w-10 h-10 rounded-full bg-yuzu-yellow/20 text-[#d97706] flex items-center justify-center border-2 border-[#d97706] group-hover:scale-110 transition-transform"
              >
                <Info :size="20" :stroke-width="2.5" />
              </div>
              <span class="font-heading text-lg text-pencil-lead">About</span>
            </RouterLink>
          </nav>

          <!-- Footer Decoration -->
          <div class="mt-auto">
            <div
              class="w-full h-32 bg-bubblegum-pop/10 rounded-2xl border-2 border-bubblegum-pop/30 relative overflow-hidden"
            >
              <div
                class="absolute -bottom-4 -right-4 w-20 h-20 bg-bubblegum-pop/20 rounded-full blur-xl"
              ></div>
              <div
                class="absolute top-4 left-4 w-12 h-12 bg-mint-shake/20 rounded-full blur-lg"
              ></div>
              <div
                class="absolute inset-0 flex items-center justify-center text-pencil-lead/50 font-heading text-sm"
              >
                Become the GeoHearo
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
