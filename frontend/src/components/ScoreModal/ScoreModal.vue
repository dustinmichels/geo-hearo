<template>
  <div class="box">
    <p class="has-text-right" v-for="(number, index) in numbers" :key="index">
      {{ index === numbers.length - 1 ? '+' + number : number }}
    </p>
    <hr />
    <AnimatedScore :targetScore="100" :duration="1000" />
  </div>
</template>

<script lang="ts" setup>
import { defineProps, PropType } from 'vue'
import AnimatedScore from './AnimatedScore.vue'

defineProps({
  numbers: {
    type: Array as PropType<number[]>,
    required: true,
  },
})
</script>

<style scoped>
.box {
  max-width: 200px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f5f5f5;
}

.has-text-right {
  text-align: right;
  font-family: monospace;
  margin: 5px 0;
}

hr {
  border: none;
  border-top: 1px solid #ccc;
  margin: 10px 0;
}
</style>
