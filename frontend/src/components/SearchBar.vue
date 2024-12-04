<script setup lang="ts">
defineProps<{ msg: string }>()
</script>

<template>
  <h1>{{ msg }}</h1>
  <div class="field">
    <p class="control has-icons-left">
      <input class="input" type="text" placeholder="Search..." />
      <span class="icon is-left">
        <i class="fas fa-search"></i>
      </span>
    </p>
  </div>
</template>

<style scoped></style>
