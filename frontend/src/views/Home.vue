<script setup lang="ts">
import { BaseButton } from '@/components/base'
</script>

<template>
  <div class="flex h-screen w-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--color-cloud-white)] to-[#fff3e6]">
    <div class="grid w-full max-w-[1400px] grid-cols-1 items-center gap-[var(--spacing-section)] px-[var(--spacing-container-padding)] md:grid-cols-2 md:gap-12 lg:gap-16">
      <div class="text-center md:text-left">
        <h1 class="title">GeoHearo</h1>

        <div class="mb-6 flex items-center justify-center gap-4 md:justify-start">
          <p class="tagline">
            The geo-guessing game where you win with your ears.
          </p>
          <div class="mobile-globe flex shrink-0 items-center justify-center md:hidden">
            <img src="/globe.png" alt="Globe" class="globe" />
          </div>
        </div>

        <ul class="features">
          <li>Stream live radio from a mystery country</li>
          <li>
            Pay attention to languages, music, commercials, and commentary
          </li>
          <li>Figure out where in the world you are</li>
        </ul>

        <p class="challenge">
          Do you have what it takes to be...<br />
          The Geo Hearo?
        </p>

        <router-link to="/play" class="inline-block no-underline">
          <BaseButton size="lg" class="cta-button">TUNE IN</BaseButton>
        </router-link>
      </div>

      <div class="desktop-globe hidden items-center justify-center md:flex">
        <img src="/globe.png" alt="Globe" class="globe" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.title {
  color: var(--color-gumball-blue);
  margin-bottom: 0.5rem;
  font-size: var(--font-size-h1);
  text-shadow: 2px 2px 0px var(--color-yuzu-yellow);
}

.tagline {
  font-size: var(--font-size-h2);
  font-weight: 700;
  margin-bottom: 0;
  color: var(--color-pencil-lead);
  flex: 1;
  max-width: none;
}

.features {
  text-align: left;
  list-style: none;
  padding: 0;
  margin: 1.5rem auto;
  font-size: var(--font-size-body);
  max-width: 600px;
}

.features li {
  margin-bottom: 1rem;
  padding-left: 2rem;
  position: relative;
  line-height: 1.5;
}

.features li::before {
  content: '🎧';
  font-size: 1.5rem;
  position: absolute;
  left: 0;
}

.challenge {
  font-size: var(--font-size-h3);
  font-weight: 700;
  font-family: var(--font-family-heading);
  margin: 1.5rem 0 1rem 0;
  color: var(--color-bubblegum-pop);
  line-height: 1.2;
}

.cta-button {
  margin-top: 1rem;
  background: linear-gradient(
    135deg,
    var(--color-gumball-blue) 0%,
    #2563eb 100%
  );
  letter-spacing: 0.05em;
}

.cta-button:hover:not(:active) {
  background: linear-gradient(
    135deg,
    #2563eb 0%,
    var(--color-gumball-blue) 100%
  );
}

.globe {
  width: 100%;
  max-width: 120px;
  height: auto;
  filter: drop-shadow(4px 4px 0px var(--color-pencil-lead));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-15px) rotate(2deg);
  }
}

@media (min-width: 768px) {
  .features {
    margin: 2rem 0;
  }

  .title {
    text-shadow: 3px 3px 0px var(--color-yuzu-yellow);
  }

  .challenge {
    margin: 2rem 0 1.5rem 0;
  }

  .globe {
    max-width: 400px;
    filter: drop-shadow(8px 8px 0px var(--color-pencil-lead));
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0px) rotate(0deg);
    }
    50% {
      transform: translateY(-20px) rotate(2deg);
    }
  }
}

@media (min-width: 1200px) {
  .globe {
    max-width: 500px;
  }
}
</style>
