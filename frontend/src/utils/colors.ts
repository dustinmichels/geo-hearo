export const ARROW_COLORS = [
  '#4ADE80', // 1 dot (Green-ish - Very Close)
  '#A3E635', // 2 dots (Lime - Close)
  '#FACC15', // 3 dots (Yellow - Far)
  '#FB923C', // 4 dots (Orange-ish - Very Far)
]

export function getColorForArrowCount(count: number): string {
  // Clamp count between 1 and 4
  const index = Math.max(1, Math.min(4, count)) - 1
  return ARROW_COLORS[index] ?? '#FB923C'
}
