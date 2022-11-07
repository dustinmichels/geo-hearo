<template>
  <div
    id="container"
    ref="container"
    style="position: relative; width: 500px; height: 300px"
  ></div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const container = document.getElementById('container')
  //   const container = this.$refs.container
  const map = new Datamap({
    element: container,
  })
})
</script>
