<script setup lang="ts">
interface Props {
  padding?: 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

withDefaults(defineProps<Props>(), {
  padding: 'md',
  hoverable: false
})
</script>

<template>
  <div
    :class="[
      'base-card',
      `base-card--${padding}`,
      { 'base-card--hoverable': hoverable }
    ]"
  >
    <slot />
  </div>
</template>

<style scoped>
.base-card {
  background-color: var(--color-paper-white);
  border: var(--border-width) solid var(--color-pencil-lead);
  border-radius: var(--border-radius-lg);
  box-shadow: 0px 4px 0px var(--color-pencil-lead);
  transition: var(--transition-bounce);
}

/* Padding variants */
.base-card--sm {
  padding: 1rem;
}

.base-card--md {
  padding: 1.5rem;
}

.base-card--lg {
  padding: 2rem;
}

/* Hoverable effect */
.base-card--hoverable {
  cursor: pointer;
}

.base-card--hoverable:hover {
  transform: translateY(-2px);
  box-shadow: 0px 6px 0px var(--color-pencil-lead);
}

.base-card--hoverable:active {
  transform: translateY(2px);
  box-shadow: 0px 2px 0px var(--color-pencil-lead);
}

/* Responsive padding on mobile */
@media (max-width: 480px) {
  .base-card--sm {
    padding: 0.75rem;
  }

  .base-card--md {
    padding: 1rem;
  }

  .base-card--lg {
    padding: 1.5rem;
  }
}
</style>
