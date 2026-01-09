export const ARROW_COLORS = [
  '#22C55E', // 0: Right (Green)
  '#84CC16', // 1: Close (Yellow-Green)
  '#EAB308', // 2: Closer (Yellow)
  '#F97316', // 3: Far (Reddish-Orange)
  '#EF4444', // 4+: Wrong (Red)
]

export function getColorForArrowCount(count: number): string {
  // 0 = Correct
  // 1 = Close
  // 2 = Closer
  // 3 = Far
  // Anything else = Wrong (Red)
  const index = Math.min(count, 4)
  return ARROW_COLORS[index] ?? '#EF4444' // Fallback to Red
}
