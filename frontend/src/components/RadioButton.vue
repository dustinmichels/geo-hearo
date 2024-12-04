<template>
  <div class="radio__button">
    <img :src="RadioOff" alt="Radio Off" />
    <img :src="RadioOn" alt="Radio On" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RadioOff from '../assets/images/radio_off.png'
import RadioOn from '../assets/images/radio_on.png'

const isSelected = ref(false)

const toggleRadio = () => {
  isSelected.value = !isSelected.value
}
</script>

<style scoped></style>
