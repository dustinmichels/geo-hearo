<script setup lang="ts">
import AudioPlayer from './components/AudioPlayer/Player.vue'
import Search from './components/Search.vue'

const guessed: string[] = []
</script>

<template>
  <AudioPlayer
    :option="{
      src: 'https://radio.garden/api/ara/content/listen/dKofB-bG/channel.mp3',
    }"
  />

  <Search />
</template>

<style scoped></style>
