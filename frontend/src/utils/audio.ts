let audioCtx: AudioContext | null = null

export function playRadioStatic(duration = 2) {
  // Initialize AudioContext lazily to handle browser policies
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    } else {
      console.warn('AudioContext not supported')
      return undefined
    }
  }

  // Ensure context is running (it might be suspended if created before user interaction)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }

  const bufferSize = audioCtx.sampleRate * duration
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const source = audioCtx.createBufferSource()
  source.buffer = buffer

  const filter = audioCtx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 2000
  filter.Q.value = 0.8

  const gainNode = audioCtx.createGain()
  gainNode.gain.value = 0.1

  source.connect(filter)
  filter.connect(gainNode)
  gainNode.connect(audioCtx.destination)

  source.start()

  return source
}
