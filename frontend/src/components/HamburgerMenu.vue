<script setup lang="ts">
import { Bell, CirclePlay, Home, Info, Menu, Shield, X } from "lucide-vue-next";
import { computed, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { isDailyReminderOn, setDailyReminder } from "../lib/dailyReminder";
import { isNative } from "../lib/platform";
import { useGameStore } from "../stores/game";

const route = useRoute();
const store = useGameStore();
const isOpen = ref(false);

const currentRouteName = computed(() => route.name);

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
  // Finishing the first daily can turn reminders on, so read the setting on each open.
  if (isOpen.value) reminderOn.value = isDailyReminderOn();
};

// App only: daily reminder notification.
const reminderOn = ref(false);
const reminderDenied = ref(false);

const toggleReminder = async () => {
  const want = !reminderOn.value;
  const allowed = await setDailyReminder(want);
  reminderOn.value = want && allowed;
  reminderDenied.value = !allowed;
};

const closeMenu = () => {
  isOpen.value = false;
};

const menuItems = [
  {
    to: "/",
    name: "Home",
    label: "Home",
    icon: Home,
    iconBgClass: "bg-gumball-blue/20 text-gumball-blue border-gumball-blue",
  },
  {
    to: "/play",
    name: "Play",
    label: "Play",
    icon: CirclePlay,
    iconBgClass: "bg-mint-shake/20 text-emerald-600 border-emerald-600",
  },
  {
    to: "/about",
    name: "About",
    label: "About",
    icon: Info,
    iconBgClass: "bg-yuzu-yellow/20 text-[#d97706] border-[#d97706]",
  },
  {
    to: "/privacy",
    name: "Privacy",
    label: "Privacy",
    icon: Shield,
    iconBgClass: "bg-bubblegum-pop/20 text-bubblegum-pop border-bubblegum-pop",
  },
];
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
          class="fixed top-0 left-0 h-full w-[280px] bg-paper-white border-r-3 border-pencil-lead z-[100002] flex flex-col px-6 pt-safe-6 pb-safe-6 shadow-2xl"
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
              v-for="item in menuItems"
              :key="item.name"
              :to="item.to"
              class="group relative flex items-center gap-4 p-3 rounded-xl border-2 border-transparent hover:border-pencil-lead hover:bg-cloud-white transition-all duration-200"
              :class="{
                'pointer-events-none': currentRouteName === item.name,
              }"
              @click="closeMenu"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center border-2 group-hover:scale-110 transition-transform"
                :class="[
                  item.iconBgClass,
                  {
                    'opacity-50 grayscale': currentRouteName === item.name,
                  },
                ]"
              >
                <component :is="item.icon" :size="20" :stroke-width="2.5" />
              </div>

              <div class="relative">
                <span
                  class="font-heading text-lg text-pencil-lead"
                  :class="{
                    'opacity-50 grayscale': currentRouteName === item.name,
                  }"
                >
                  {{ item.label }}
                </span>
                <!-- Scribble Underline -->
                <div
                  v-if="currentRouteName === item.name"
                  class="absolute -bottom-2 -left-1 -right-1 h-3 bg-scribble bg-no-repeat bg-center bg-contain opacity-100"
                ></div>
              </div>
            </RouterLink>
          </nav>

          <!-- Daily reminder (app only) -->
          <button
            v-if="isNative"
            type="button"
            role="switch"
            :aria-checked="reminderOn"
            class="mt-4 flex items-center gap-4 p-3 rounded-xl border-2 border-transparent hover:border-pencil-lead hover:bg-cloud-white transition-all duration-200 cursor-pointer text-left"
            @click="toggleReminder"
          >
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-[#B45309]/10 text-[#B45309] border-[#B45309]"
            >
              <Bell :size="20" :stroke-width="2.5" />
            </div>
            <span class="flex-1 font-heading text-lg leading-tight text-pencil-lead"
              >Daily reminder</span
            >
            <span
              class="relative w-11 h-6 rounded-full border-2 border-pencil-lead transition-colors duration-200"
              :class="reminderOn ? 'bg-mint-shake' : 'bg-cloud-white'"
            >
              <span
                class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-pencil-lead transition-transform duration-200"
                :class="{ 'translate-x-5': reminderOn }"
              ></span>
            </span>
          </button>
          <p v-if="isNative && reminderDenied" class="px-3 text-sm text-pencil-lead/70">
            Notifications are off for GeoHearo. Turn them on in Settings.
          </p>
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
                Be the GeoHearo <span v-if="store.hasEverPlayed">🦸</span>
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

.bg-scribble {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 20' preserveAspectRatio='none'%3E%3Cpath d='M0 13 Q 25 18 50 12 T 100 15' stroke='%23fcd34d' stroke-width='10' fill='none' stroke-linecap='round' stroke-linejoin='round' /%3E%3C/svg%3E");
}
</style>
