<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  fullWidth: false,
})

const buttonClass = computed(() => {
  return [
    'base-button',
    `base-button--${props.variant}`,
    `base-button--${props.size}`,
    {
      'base-button--disabled': props.disabled,
      'base-button--full-width': props.fullWidth,
    },
  ]
})
</script>

<template>
  <button :class="buttonClass" :disabled="disabled">
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--font-family-heading);
  font-weight: 700;
  text-transform: uppercase;
  border: var(--border-width) solid var(--color-pencil-lead);
  border-radius: var(--border-radius-base);
  cursor: pointer;
  box-shadow: var(--shadow-pressable);
  transition: var(--transition-bounce);
  transform: translateY(0);
  min-height: 48px;
  max-width: fit-content;
}

.base-button:active:not(:disabled) {
  box-shadow: var(--shadow-pressable-active);
  transform: translateY(4px);
}

.base-button:focus-visible {
  outline: 3px solid var(--color-yuzu-yellow);
  outline-offset: 2px;
}

.base-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
}

/* Variants */
.base-button--primary {
  background-color: var(--color-gumball-blue);
  color: var(--color-paper-white);
}

.base-button--secondary {
  background-color: var(--color-paper-white);
  color: var(--color-pencil-lead);
}

.base-button--success {
  background-color: var(--color-mint-shake);
  color: var(--color-paper-white);
}

.base-button--danger {
  background-color: var(--color-berry-oops);
  color: var(--color-paper-white);
}

.base-button--accent {
  background-color: var(--color-bubblegum-pop);
  color: var(--color-paper-white);
}

/* Sizes */
.base-button--sm {
  font-size: 1rem;
  padding: 0.5rem 1rem;
}

.base-button--md {
  font-size: var(--font-size-btn);
  padding: 0.75rem 1.5rem;
}

.base-button--lg {
  font-size: 1.5rem;
  padding: 1rem 2rem;
}

/* Full width */
.base-button--full-width {
  width: 100%;
  max-width: 100%;
}

/* Mobile: full width by default */
@media (max-width: 480px) {
  .base-button:not(.base-button--full-width) {
    width: 100%;
    max-width: 100%;
  }
}
</style>
