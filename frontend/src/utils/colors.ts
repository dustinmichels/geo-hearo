export const GUESS_COLORS = [
  '#34D399', // 1 arrow (Mint Shake) - Best
  '#74D386', // 2 arrows
  '#B4D373', // 3 arrows
  '#FCD34D', // 4 arrows (Yuzu Yellow) - Worst... wait user said 6 arrows.
  // Wait, I calculated 6 steps above.
  // 1: #34D399
  // 2: #5CD38A
  // 3: #84D37B
  // 4: #ACD36B
  // 5: #D4D35C
  // 6: #FCD34D
]

// Actually, let's explicitly define the 6 colors I calculated.
export const ARROW_COLORS = [
  '#34D399', // 1 arrow  (Green)
  '#5CD38A', // 2 arrows
  '#84D37B', // 3 arrows
  '#ACD36B', // 4 arrows
  '#D4D35C', // 5 arrows
  '#FCD34D', // 6 arrows (Yellow)
]

export function getColorForArrowCount(count: number): string {
  // Clamp count between 1 and 6
  const index = Math.max(1, Math.min(6, count)) - 1
  return ARROW_COLORS[index] ?? '#FCD34D'
}
