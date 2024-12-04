<!-- 
  Based off: "RealCoolSnow/vue3-audio-player"
    > https://www.npmjs.com/package/vue3-audio-player
    > https://github.com/RealCoolSnow/vue3-audio-player
 -->

<template>
  <div class="audio__player">
    <div class="audio__player-play-and-title">
      <div class="audio__player-play-cont">
        <div class="audio__player-play" @click="togglePlayer">
          <img
            :src="option_.coverImage ? option_.coverImage : CoverImageDefault"
            :class="`${
              isPlaying && option_.coverRotate ? 'audio__player-spin-anim' : ''
            }`"
          />
          <div class="audio__player-play-icon">
            <img :src="isPlaying ? IconPause : IconPlay" />
          </div>
        </div>
      </div>
      <slot name="title">
        <div v-if="option_.title" class="audio__player-title">
          {{ option_.title }}
        </div>
      </slot>
    </div>
    <audio
      ref="audioPlayer"
      :src="option_.src"
      @play="onAudioPlay"
      @pause="onAudioPause"
    ></audio>
  </div>
</template>

<script lang="ts">
import {
  PropType,
  defineComponent,
  nextTick,
  reactive,
  ref,
  toRefs,
  watch,
} from 'vue'

import CoverImageDefault from '../../assets/images/cover.png'
import IconPause from '../../assets/images/pause.png'
import IconPlay from '../../assets/images/play.png'
import { AudioPlayerOption, AudioPlayerOptionDefault } from './types'

const mergeOption = (option: AudioPlayerOption): AudioPlayerOption => {
  return {
    src: option.src || AudioPlayerOptionDefault.src,
    title: option.title || AudioPlayerOptionDefault.title,
    coverImage: option.coverImage || AudioPlayerOptionDefault.coverImage,
    coverRotate: option.coverRotate || AudioPlayerOptionDefault.coverRotate,
    progressBarColor:
      option.progressBarColor || AudioPlayerOptionDefault.progressBarColor,
    indicatorColor:
      option.indicatorColor || AudioPlayerOptionDefault.indicatorColor,
  }
}

export default defineComponent({
  props: {
    option: {
      type: Object as PropType<AudioPlayerOption>,
      default: AudioPlayerOptionDefault,
    },
  },
  emits: [
    'loadedmetadata',
    'playing',
    'play',
    'play-error',
    'timeupdate',
    'pause',
    'ended',
    'progress-start',
    'progress-end',
    'progress-move',
    'progress-click',
  ],
  setup(props, { emit }) {
    const audioPlayer = ref()
    const option_ = ref(mergeOption(props.option))
    const state = reactive({
      isPlaying: false,
      isDragging: false,
      currentTime: 0,
      totalTime: 0,
      totalTimeStr: '00:00',
    })

    const play = () => {
      audioPlayer.value.play().catch((error: any) => {
        emit('play-error', error)
      })
    }
    const pause = () => {
      audioPlayer.value.pause()
      state.isPlaying = false
    }
    const togglePlayer = () => {
      if (state.isPlaying) {
        pause()
      } else {
        play()
      }
    }

    const onAudioPause = () => {
      console.log('onAudioPause')
      state.isPlaying = false
      emit('pause')
    }
    const onAudioPlay = () => {
      console.log('onAudioPlay')
      state.isPlaying = true
      emit('play')
    }

    watch(
      () => props.option,
      (newValue, oldValue) => {
        option_.value = mergeOption(newValue)
        nextTick(() => {
          play()
        })
      },
      { deep: true }
    )

    // onAudioPause()

    return {
      audioPlayer,
      option_,
      ...toRefs(state),
      onAudioPlay,
      onAudioPause,
      play,
      pause,
      togglePlayer,
      IconPlay,
      IconPause,
      CoverImageDefault,
    }
  },
})
</script>
<style scoped>
.audio__player {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.audio__player-play {
  position: relative;
}
.audio__player-play:active,
.audio__player-play img:active {
  opacity: 0.75;
}
.audio__player-play img {
  width: 6.8rem;
  height: 6.8rem;
  border-radius: 9999px;
}
.audio__player-play-icon {
  position: absolute;
  top: 1.8rem;
  left: 1.8rem;
  background: #f0f0f0;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  padding: 0.5rem 0.5rem;
  opacity: 0.8;
  will-change: filter;
}

.audio__player-play-icon:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.audio__player-play-icon img {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
}

@keyframes audio__player-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.audio__player-spin-anim {
  animation: audio__player-spin 5s linear infinite;
}
</style>
