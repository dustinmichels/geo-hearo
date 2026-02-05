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

const elementSources = new WeakMap<
  HTMLMediaElement,
  MediaElementAudioSourceNode
>()

export function setupAudioMonitoring(
  audioElement: HTMLAudioElement,
  onSilence: () => void,
  silenceThreshold = -100, // dB (lowered threshold to be safe)
  silenceDuration = 2000 // ms
) {
  // Initialize AudioContext lazily
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    } else {
      console.warn('AudioContext not supported')
      return () => {}
    }
  }

  // Ensure context is running
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }

  let source: MediaElementAudioSourceNode
  if (elementSources.has(audioElement)) {
    source = elementSources.get(audioElement)!
  } else {
    try {
      source = audioCtx!.createMediaElementSource(audioElement)
      elementSources.set(audioElement, source)
    } catch (e) {
      console.error('Failed to create MediaElementSource', e)
      return () => {}
    }
  }

  const analyser = audioCtx!.createAnalyser()
  analyser.fftSize = 2048

  // output of element -> source -> analyser -> destination
  source.connect(analyser)
  analyser.connect(audioCtx!.destination)

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  let silenceStart: number | null = null
  let animationFrame: number | null = null
  let isMonitoring = true

  const monitor = () => {
    if (!isMonitoring) return

    analyser.getByteFrequencyData(dataArray)

    // Calculate average volume
    let sum = 0
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i]
    }
    const average = sum / bufferLength

    // If stream CORS is wrong, we get all 0s.
    // If stream is loading, we might get 0s?
    // We should probably rely on `play` event which is when this is triggered.

    // Convert to decibels
    // 255 is max value. 20*log10(avg/255)
    // If avg is 0, db is -Infinity

    let db = -Infinity
    if (average > 0) {
      db = 20 * Math.log10(average / 255)
    }

    if (db < silenceThreshold) {
      if (!silenceStart) {
        silenceStart = Date.now()
      } else if (Date.now() - silenceStart > silenceDuration) {
        onSilence()
        // Reset to prevent spamming
        silenceStart = Date.now()
      }
    } else {
      silenceStart = null
    }

    animationFrame = requestAnimationFrame(monitor)
  }

  monitor()

  return () => {
    isMonitoring = false
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
    try {
      source.disconnect(analyser)
      analyser.disconnect()
    } catch (e) {
      // ignore errors on cleanup
    }
  }
}
