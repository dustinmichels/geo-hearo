import { polygon } from '@turf/helpers'
import { describe, expect, it } from 'vitest'
import { getDistanceHint, nearestBorderDistance } from './geography'

describe('geography utils', () => {
  // Helper to create a small square polygon around a center
  const createSquare = (centerLat: number, centerLng: number, size = 1) => {
    const half = size / 2
    return polygon([
      [
        [centerLng - half, centerLat - half],
        [centerLng + half, centerLat - half],
        [centerLng + half, centerLat + half],
        [centerLng - half, centerLat + half],
        [centerLng - half, centerLat - half],
      ],
    ])
  }

  const secret = createSquare(0, 0) // Square around (0,0)

  describe('getDistanceHint', () => {
    it('returns Level 1 (Yellow) for overlapping location', () => {
      // Same location
      expect(getDistanceHint(secret, secret)).toMatchObject({
        emoji: '🤏',
        level: 1,
        distance: 0,
      })
    })

    it('returns Level 4 (Orange-1) for close location (<= 1500km)', () => {
      // 10 degrees lat away ~ 1110 km
      const close = createSquare(10, 0)
      const result = getDistanceHint(close, secret)
      expect(result.level).toBe(4)
      expect(result.emoji).toBe('🟠')
      expect(result.distance).toBeGreaterThan(0)
    })

    it('returns Level 6 (Red-1) for medium location (<= 5000km)', () => {
      // 40 degrees lat away ~ 4440 km
      const medium = createSquare(40, 0)
      const result = getDistanceHint(medium, secret)
      expect(result.level).toBe(6)
      expect(result.emoji).toBe('🔴')
    })

    it('returns Level 6 (Red-1) for far location (> 5000km)', () => {
      // 70 degrees lat away ~ 7770 km
      const far = createSquare(70, 0)
      const result = getDistanceHint(far, secret)
      expect(result.level).toBe(6)
      expect(result.emoji).toBe('🔴')
    })

    it('returns Level 1 (Yellow) and 0 distance for polygons touching on major landmass', () => {
      // Secret: Square (0,0) to (2,2)
      // center is (1,1), size 2 -> half=1.
      // createSquare(1, 1, 2) makes box from (0,0) to (2,2)
      const secretFeature = createSquare(1, 1, 2)

      // Guess: Square (2,0) to (4,2) - Touching at x=2
      const guessFeature = createSquare(1, 3, 2)

      const result = getDistanceHint(guessFeature, secretFeature)
      expect(result.distance).toBe(0)
      expect(result.level).toBe(1)
      expect(result.emoji).toBe('🤏')
    })

    it('ignores overseas territories (small polygons < 20%) for intersection checks', () => {
      // Secret: MultiPolygon with Main Landmass (far) + Overseas Territory (touching)

      // Main Landmass: Large Square (10,0) to (20,10) -> Area 100
      const mainLandCoords = [
        [
          [10, 0],
          [20, 0],
          [20, 10],
          [10, 10],
          [10, 0],
        ],
      ]

      // Overseas Territory: Small Square (2,0) to (3,1) -> Area 1
      // This is 1% of the total area (100+1), so it should be IGNORED.
      const overseasCoords = [
        [
          [2, 0],
          [3, 0],
          [3, 1],
          [2, 1],
          [2, 0],
        ],
      ]

      const secretFeature: any = {
        type: 'Feature',
        geometry: {
          type: 'MultiPolygon',
          coordinates: [mainLandCoords, overseasCoords],
        },
        properties: {},
      }

      // Guess: Square (0,0) to (2,2) -> Intersects the overseas territory (2,0)-(3,1)
      const guessFeature = createSquare(1, 1, 2)

      const result = getDistanceHint(guessFeature, secretFeature)

      // Should measure distance to Main Land (x=10), not Overseas (touching/intersecting).
      // Distance from x=2 (guess edge) to x=10 (main secret edge) is 8 degrees. ~890km.
      expect(result.distance).toBeGreaterThan(500)
    })
  })

  describe('nearestBorderDistance', () => {
    it('calculates distance between nearest vertices', () => {
      // Feature 1: (0,0) to (2,2)
      const f1 = createSquare(1, 1, 2)

      // Feature 2: (4,0) to (6,2)
      // Gap of 2 degrees longitude between x=2 and x=4.
      // At equator, 2 degrees ~ 222 km.
      const f2 = createSquare(1, 5, 2)

      const dist = nearestBorderDistance(f1, f2) // f1 to f2

      expect(dist).toBeGreaterThan(220)
      expect(dist).toBeLessThan(225)
    })

    it('ignores smaller polygons (islands < 20%) in distance calculation', () => {
      // Main Landmass: Area 100 (10x10)
      const mainLand = [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ]

      // Small Island: Area 4 (2x2). Total Area 104.
      // 4 / 104 = ~3.8% -> IGNORED.
      // Located at x=20.
      const smallIsland = [
        [
          [20, 0],
          [22, 0],
          [22, 2],
          [20, 2],
          [20, 0],
        ],
      ]

      const secretWithSmallIsland: any = {
        type: 'Feature',
        geometry: {
          type: 'MultiPolygon',
          coordinates: [mainLand, smallIsland],
        },
        properties: {},
      }

      // Guess is at x=25.
      // Distance to Small Island (x=22 to x=25) = 3 degrees.
      // Distance to Main Land (x=10 to x=25) = 15 degrees.
      const guessFeature = createSquare(5, 26, 2) // center x=26, width 2 -> 25 to 27.

      const dist = nearestBorderDistance(guessFeature, secretWithSmallIsland)

      // Should ignore small island and measure to main land (15 degrees).
      // 15 deg * 111km = 1665km
      // 3 deg * 111km = 333km
      expect(dist).toBeGreaterThan(1000)
    })

    it('INCLUDES major islands (>= 20%) in distance calculation', () => {
      // Main Landmass: Area 100 (10x10)
      const mainLand = [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ]

      // Large Island: Area 36 (6x6). Total Area 136.
      // 36 / 136 = ~26% -> INCLUDED.
      // Located at x=20.
      const largeIsland = [
        [
          [20, 0],
          [26, 0],
          [26, 6],
          [20, 6],
          [20, 0],
        ],
      ]

      const secretWithLargeIsland: any = {
        type: 'Feature',
        geometry: {
          type: 'MultiPolygon',
          coordinates: [mainLand, largeIsland],
        },
        properties: {},
      }

      // Guess is at x=30.
      // Distance to Large Island (x=26 to x=30) = 4 degrees.
      // Distance to Main Land (x=10 to x=30) = 20 degrees.

      // center x=31, width 2 -> 30 to 32.
      const guessFeature = createSquare(3, 31, 2)

      const dist = nearestBorderDistance(guessFeature, secretWithLargeIsland)

      // Should INCLUDE large island and measure to it (4 degrees).
      // 4 deg * 111km = 444km
      // 20 deg * 111km = 2220km
      expect(dist).toBeLessThan(600)
    })
  })
})
