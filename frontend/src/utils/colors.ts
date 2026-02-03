// Level 1: Yellow (Close)
// Level 2: Orange (Medium)
// Level 3: Red (Far)

export const DISTANCE_COLORS = {
  1: '#EAB308', // Yellow
  2: '#F97316', // Orange
  3: '#EF4444', // Red
}

export function getColorForDistanceLevel(level: number): string {
  // @ts-ignore
  return DISTANCE_COLORS[level] ?? '#A855F7'
}
