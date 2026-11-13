<script setup lang="ts">
defineProps<{ playing: boolean }>();
</script>

<template>
  <svg
    viewBox="0 0 100 100"
    class="hero-mascot"
    :class="{ 'is-playing': playing }"
    aria-hidden="true"
    overflow="visible"
  >
    <!-- cape (still) -->
    <path d="M6 100 C8 80 22 71 50 71 C78 71 92 80 94 100 Z" fill="#7B3FB0" />
    <path d="M14 100 C17 84 30 76 50 76 C70 76 83 84 86 100 Z" fill="#5B2A8A" />
    <g class="hero-sway">
      <!-- arms -->
      <g fill="none" stroke="#E0344D" stroke-width="9" stroke-linecap="round">
        <path d="M32 86 C14 86 9 70 17 55" />
        <path d="M68 86 C86 86 91 70 83 55" />
      </g>
      <!-- chest + emblem (ends under the belt) -->
      <path d="M24.5 96 C24.5 86 35 78 50 78 C65 78 75.5 86 75.5 96 Z" fill="#E0344D" />
      <rect x="43" y="82" width="14" height="9.5" rx="2.5" fill="#FFFFFF" />
      <rect x="46.5" y="84.5" width="7" height="4.5" rx="1.2" fill="#E0344D" />
      <!-- neck -->
      <rect x="44" y="64" width="12" height="15" rx="4" fill="#F5B52E" />

      <g class="hero-head">
        <!-- hair back -->
        <path
          d="M24 46 C24 24 36 16 50 16 C64 16 76 24 76 46 C76 57 73 63 68 66 L32 66 C27 63 24 57 24 46 Z"
          fill="#F2A900"
        />
        <!-- face -->
        <ellipse cx="50" cy="47" rx="21" ry="22" fill="#FFCC3D" />
        <!-- bangs -->
        <path
          d="M27 44 C25 26 37 18 51 18 C65 18 76 27 73 44 C70 36 63 31 55 31 C50 35 40 37 27 44 Z"
          fill="#F7B500"
        />
        <!-- mask -->
        <path
          d="M28 41 C38 38 62 38 72 41 L72.5 50 C66 55 58 53 50 51 C42 53 34 55 27.5 50 Z"
          fill="#E0344D"
        />
        <g class="hero-eyes">
          <ellipse cx="41" cy="46" rx="5.2" ry="4.6" fill="#FFFFFF" />
          <ellipse cx="59" cy="46" rx="5.2" ry="4.6" fill="#FFFFFF" />
          <circle cx="41" cy="46" r="3.2" fill="#5A3A1E" />
          <circle cx="59" cy="46" r="3.2" fill="#5A3A1E" />
          <circle cx="42.2" cy="44.8" r="1" fill="#FFFFFF" />
          <circle cx="60.2" cy="44.8" r="1" fill="#FFFFFF" />
        </g>
        <!-- grin -->
        <path d="M41 58 Q50 68 59 58 Q50 61 41 58 Z" fill="#7A2E1E" />
        <path d="M42.5 58.6 Q50 61 57.5 58.6 L56.6 60.4 Q50 62.3 43.4 60.4 Z" fill="#FFFFFF" />
        <!-- headphones -->
        <path
          d="M24 48 C22 18 78 18 76 48"
          fill="none"
          stroke="#334155"
          stroke-width="4.5"
          stroke-linecap="round"
        />
        <rect x="17" y="40" width="11" height="17" rx="4.5" fill="#334155" />
        <rect x="72" y="40" width="11" height="17" rx="4.5" fill="#334155" />
        <rect x="25.5" y="42.5" width="3" height="12" rx="1.5" fill="#F472B6" />
        <rect x="71.5" y="42.5" width="3" height="12" rx="1.5" fill="#F472B6" />
        <!-- hands pressing the ear cups -->
        <g fill="#FFCC3D" stroke="#E8A317" stroke-width="0.8">
          <path
            d="M12 54 C10 46 13 40 18 39 C21 38.5 24 41 24 45 L24 54 C24 58 21 60 17 59.5 C14 59 12.5 57 12 54 Z"
          />
          <path
            d="M88 54 C90 46 87 40 82 39 C79 38.5 76 41 76 45 L76 54 C76 58 79 60 83 59.5 C86 59 87.5 57 88 54 Z"
          />
        </g>
        <path
          d="M15 43.5 L22 43.5 M14.5 47.5 L22.5 47.5 M15 51.5 L22 51.5 M85 43.5 L78 43.5 M85.5 47.5 L77.5 47.5 M85 51.5 L78 51.5"
          fill="none"
          stroke="#E8A317"
          stroke-width="0.8"
          stroke-linecap="round"
        />
      </g>
    </g>
    <!-- hips + belt (still), drawn over the chest's lower edge -->
    <path d="M23.5 93 H76.5 V100 H23.5 Z" fill="#E0344D" />
    <rect x="23" y="92" width="54" height="3.6" rx="1.8" fill="#F5B52E" />
    <rect x="47" y="91.2" width="6" height="5.2" rx="1" fill="#FFCC3D" stroke="#E8A317" stroke-width="0.6" />

    <!-- music notes -->
    <g fill="#334155">
      <g transform="translate(90 30)">
        <g class="hero-note">
          <path d="M0 0 V-11 L7 -13 V-2" fill="none" stroke="#334155" stroke-width="1.6" />
          <ellipse cx="-1.8" cy="0.4" rx="2.6" ry="2" />
          <ellipse cx="5.2" cy="-1.6" rx="2.6" ry="2" />
        </g>
      </g>
      <g transform="translate(6 26)">
        <g class="hero-note hero-note-late">
          <path d="M0 0 V-10 Q4 -8 5 -5" fill="none" stroke="#334155" stroke-width="1.6" />
          <ellipse cx="-1.8" cy="0.4" rx="2.6" ry="2" />
        </g>
      </g>
    </g>
  </svg>
</template>

<style scoped>
/* One sway (left → right → left) spans 4 head-bob beats. */
.hero-mascot {
  --beat: 0.42s;
}

.hero-mascot * {
  transform-box: view-box;
}

/* Upper body twists around the waist; cape and hips stay put. */
.hero-sway {
  transform-origin: 50px 94px;
  animation: hero-sway calc(var(--beat) * 4) ease-in-out infinite;
}

.hero-head {
  transform-origin: 50px 66px;
  animation: hero-bob var(--beat) ease-in-out infinite alternate;
}

.hero-eyes {
  transform-origin: 50px 46px;
  animation: hero-blink 3.7s steps(1) infinite;
}

.hero-note {
  opacity: 0;
  animation: hero-note calc(var(--beat) * 4) ease-out infinite;
}
.hero-note-late {
  animation-delay: calc(var(--beat) * 2);
}

/* Freeze in place (instead of snapping) while sliding out of view. */
.hero-mascot:not(.is-playing) * {
  animation-play-state: paused;
}
.hero-mascot:not(.is-playing) .hero-note {
  visibility: hidden;
}

@keyframes hero-sway {
  0%,
  100% {
    transform: translateX(-1px) rotate(-8deg);
  }
  50% {
    transform: translateX(1px) rotate(8deg);
  }
}

@keyframes hero-bob {
  from {
    transform: translateY(0) rotate(0deg);
  }
  to {
    transform: translateY(2px) rotate(-2deg);
  }
}

@keyframes hero-blink {
  0%,
  96% {
    transform: scaleY(1);
  }
  97% {
    transform: scaleY(0.1);
  }
}

@keyframes hero-note {
  0% {
    opacity: 0;
    transform: translateY(0) rotate(-10deg) scale(0.6);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-22px) rotate(12deg) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-mascot * {
    animation: none !important;
  }
  .hero-note {
    visibility: hidden;
  }
}
</style>
