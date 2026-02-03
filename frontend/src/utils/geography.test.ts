import { describe, it, expect } from 'vitest'
import { getDistanceHint, nearestBorderDistance } from './geography'
import { polygon } from '@turf/helpers'

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
        emoji: '🟡',
        level: 1,
        distance: 0,
      })
    })

    it('returns Level 1 (Yellow) for close location (<= 2000km)', () => {
      // 10 degrees lat away ~ 1110 km
      const close = createSquare(10, 0)
      const result = getDistanceHint(close, secret)
      expect(result.level).toBe(1)
      expect(result.emoji).toBe('🟡')
      expect(result.distance).toBeGreaterThan(0)
    })

    it('returns Level 2 (Orange) for medium location (<= 6000km)', () => {
      // 40 degrees lat away ~ 4440 km
      const medium = createSquare(40, 0)
      const result = getDistanceHint(medium, secret)
      expect(result.level).toBe(2)
      expect(result.emoji).toBe('🟠')
    })

    it('returns Level 3 (Red) for far location (> 6000km)', () => {
      // 70 degrees lat away ~ 7770 km
      const far = createSquare(70, 0)
      const result = getDistanceHint(far, secret)
      expect(result.level).toBe(3)
      expect(result.emoji).toBe('🔴')
    })

    it('returns Level 1 (Yellow) and 0 distance for touching polygons', () => {
      // Secret: Square (0,0) to (2,2)
      // center is (1,1), size 2 -> half=1.
      // createSquare(1, 1, 2) makes box from (0,0) to (2,2)
      const secretFeature = createSquare(1, 1, 2)

      // Guess: Square (2,0) to (4,2) - Touching at x=2
      // center is (1,3) [lat,lng] -> no wait, x is lng.
      // center lat=1, center lng=3. size 2.
      // lng range: 3-1=2 to 3+1=4. lat range: 1-1=0 to 1+1=2.
      // So box is (2,0) to (4,2).
      const guessFeature = createSquare(1, 3, 2)

      const result = getDistanceHint(guessFeature, secretFeature)

      // The distance should be 0 because they share vertices/edge.
      // Vertex method:
      // secret vertices: (0,0), (2,0), (2,2), (0,2)...
      // guess vertices: (2,0), (4,0), (4,2), (2,2)...
      // Common vertices: (2,0) and (2,2).
      // Distance between identical points is 0.

      // Note: If using strict vertex-to-vertex, and they only touch at edge but no shared vertex (e.g. T-junction),
      // distance might be non-zero but very small if we sampled points.
      // But typically "touching" implies shared boundary.
      // In this specific constructed case, they share exact vertices.

      expect(result.distance).toBe(0)
      expect(result.level).toBe(1)
      expect(result.emoji).toBe('🟡')
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

      // Nearest points: (2, y) and (4, y) at same latitude (e.g. y=0, y=2) or diagonal?
      // Vertices of f1: (0,0), (2,0), (2,2), (0,2)
      // Vertices of f2: (4,0), (6,0), (6,2), (4,2)
      // Closest pairs: (2,0)-(4,0) and (2,2)-(4,2).
      // Distance is 2 degrees pure longitude at equator.
      // 2 * 111.32 km = 222.64 km.

      expect(dist).toBeGreaterThan(220)
      expect(dist).toBeLessThan(225)
    })
  })
})
