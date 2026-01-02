<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?:
      | 'default'
      | 'destructive'
      | 'outline'
      | 'secondary'
      | 'ghost'
      | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    asChild?: boolean
  }>(),
  {
    variant: 'default',
    size: 'default',
    asChild: false,
  }
)

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'destructive':
      return 'bg-red-500 text-white hover:bg-red-500/90'
    case 'outline':
      return 'border border-gray-200 bg-white hover:bg-gray-100 text-gray-900'
    case 'secondary':
      return 'bg-gray-100 text-gray-900 hover:bg-gray-100/80'
    case 'ghost':
      return 'hover:bg-gray-100 hover:text-gray-900'
    case 'link':
      return 'text-gray-900 underline-offset-4 hover:underline'
    default:
      return 'bg-gray-900 text-white hover:bg-gray-900/90'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 px-3 text-xs'
    case 'lg':
      return 'h-10 px-8'
    case 'icon':
      return 'h-9 w-9'
    default:
      return 'h-9 px-4 py-2'
  }
})
</script>

<template>
  <component
    :is="asChild ? 'slot' : 'button'"
    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
    :class="[variantClasses, sizeClasses]"
  >
    <slot />
  </component>
</template>
