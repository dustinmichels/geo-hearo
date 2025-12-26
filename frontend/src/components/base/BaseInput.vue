<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputClass = computed(() => {
  return [
    'base-input__field',
    {
      'base-input__field--error': props.error,
      'base-input__field--disabled': props.disabled
    }
  ]
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="base-input">
    <label v-if="label" class="base-input__label">
      {{ label }}
    </label>
    <input
      :class="inputClass"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="handleInput"
    />
    <span v-if="error" class="base-input__error">
      {{ error }}
    </span>
  </div>
</template>

<style scoped>
.base-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.base-input__label {
  font-family: var(--font-family-body);
  font-weight: 700;
  font-size: var(--font-size-body);
  color: var(--color-pencil-lead);
}

.base-input__field {
  font-family: var(--font-family-body);
  font-size: var(--font-size-body);
  color: var(--color-pencil-lead);
  background-color: var(--color-paper-white);
  border: var(--border-width) solid var(--color-pencil-lead);
  border-radius: var(--border-radius-base);
  padding: 0.75rem 1rem;
  min-height: 48px;
  transition: var(--transition-bounce);
  box-shadow: 0px 2px 0px var(--color-pencil-lead);
}

.base-input__field::placeholder {
  color: var(--color-eraser-grey);
}

.base-input__field:focus {
  outline: 3px solid var(--color-yuzu-yellow);
  outline-offset: 2px;
  box-shadow: 0px 3px 0px var(--color-pencil-lead);
}

.base-input__field:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  background-color: var(--color-cloud-white);
}

.base-input__field--error {
  border-color: var(--color-berry-oops);
  box-shadow: 0px 2px 0px var(--color-berry-oops);
}

.base-input__field--error:focus {
  outline-color: var(--color-berry-oops);
  box-shadow: 0px 3px 0px var(--color-berry-oops);
}

.base-input__error {
  font-family: var(--font-family-body);
  font-size: 0.875rem;
  color: var(--color-berry-oops);
  font-weight: 700;
}
</style>
