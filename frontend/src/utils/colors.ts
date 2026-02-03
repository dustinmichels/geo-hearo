// Level 1: Yellow 2 (0-50 km) - Light Yellow
// Level 2: Yellow 1 (50-250 km) - Golden Yellow
// Level 3: Orange 2 (250-750 km) - Light Orange
// Level 4: Orange 1 (750-1500 km) - Dark Orange
// Level 5: Red 2 (1500-3000 km) - Medium Red
// Level 6: Red 1 (3000+ km) - Darkest Red

export const DISTANCE_COLORS = {
  1: '#FDE047', // Light yellow (Yellow 300)
  2: '#FBBF24', // Golden yellow (Amber 400)
  3: '#FB923C', // Light orange (Orange 400)
  4: '#F97316', // Dark orange (Orange 500)
  5: '#EF4444', // Medium red (Red 500)
  6: '#B91C1C', // Darkest red (Red 700)
}

export function getColorForDistanceLevel(level: number): string {
  // @ts-ignore
  return DISTANCE_COLORS[level] ?? '#A855F7'
}
