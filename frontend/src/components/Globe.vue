<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId: number

const drawGlobe = (
  ctx: CanvasRenderingContext2D,
  size: number,
  rotation: number
) => {
  ctx.clearRect(0, 0, size, size)

  const centerX = size / 2
  const centerY = size / 2
  const radius = size / 2 - 10

  // Draw globe shadow
  ctx.beginPath()
  ctx.arc(centerX + 5, centerY + 5, radius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
  ctx.fill()

  // Draw globe background
  const gradient = ctx.createRadialGradient(
    centerX - radius / 3,
    centerY - radius / 3,
    radius / 4,
    centerX,
    centerY,
    radius
  )
  gradient.addColorStop(0, '#4facfe')
  gradient.addColorStop(1, '#0575e6')

  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()

  // Draw latitude lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1

  for (let i = -2; i <= 2; i++) {
    const y = centerY + (i * radius) / 3
    const offset = Math.abs(i) * 15

    ctx.beginPath()
    ctx.ellipse(centerX, y, radius - offset, radius / 8, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Draw longitude lines
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + rotation
    // const x = centerX + Math.sin(angle) * radius * 0.3; // This variable x was unused in source

    ctx.beginPath()
    ctx.ellipse(
      centerX,
      centerY,
      Math.abs(Math.cos(angle)) * radius,
      radius,
      0,
      0,
      Math.PI * 2
    )
    ctx.stroke()
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const size = 280
  // Increase resolution for retina displays
  const dpr = window.devicePixelRatio || 1
  canvas.width = size * dpr
  canvas.height = size * dpr
  ctx.scale(dpr, dpr)

  // Style width/height
  canvas.style.width = `${size}px`
  canvas.style.height = `${size}px`

  let rotation = 0

  const animate = () => {
    drawGlobe(ctx, size, rotation)
    rotation += 0.005
    animationId = requestAnimationFrame(animate)
  }

  animate()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<template>
  <div
    class="flex items-center justify-center bg-gradient-to-b from-blue-50 to-white rounded-xl p-6 w-full"
  >
    <canvas ref="canvasRef" class="w-full max-w-[280px] h-auto" />
  </div>
</template>
