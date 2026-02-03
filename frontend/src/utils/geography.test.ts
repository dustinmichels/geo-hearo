import { describe, it, expect } from 'vitest'
import { getDistanceHint, getDistance } from './geography'

describe('geography utils', () => {
  const secret = { lat: 0, lng: 0 } // Null Island

  describe('getDistanceHint', () => {
    it('returns Level 1 (Yellow) for very close / correct location', () => {
      // Same location
      expect(getDistanceHint(secret, secret)).toEqual({
        emoji: '🟡',
        level: 1,
      })
      // Very close (0.5 degrees)
      expect(getDistanceHint({ lat: 0.5, lng: 0 }, secret)).toEqual({
        emoji: '🟡',
        level: 1,
      })
    })

    it('returns Level 1 (Yellow) for close location (<= 20 deg)', () => {
      // 10 degrees away
      expect(getDistanceHint({ lat: 10, lng: 0 }, secret)).toEqual({
        emoji: '🟡',
        level: 1,
      })
    })

    it('returns Level 2 (Orange) for medium location (<= 60 deg)', () => {
      // 40 degrees away
      expect(getDistanceHint({ lat: 40, lng: 0 }, secret)).toEqual({
        emoji: '🟠🟠',
        level: 2,
      })
    })

    it('returns Level 3 (Red) for far location (> 60 deg)', () => {
      // 70 degrees away
      expect(getDistanceHint({ lat: 70, lng: 0 }, secret)).toEqual({
        emoji: '🔴🔴🔴',
        level: 3,
      })
    })
  })

  describe('getDistance', () => {
    it('calculates simple euclidean distance', () => {
      const p1 = { lat: 0, lng: 0 }
      const p2 = { lat: 3, lng: 4 }
      expect(getDistance(p1, p2)).toBe(5)
    })

    it('handles antimeridian wrapping', () => {
      const p1 = { lat: 0, lng: -170 }
      const p2 = { lat: 0, lng: 170 }
      // Direct distance would be 340
      // Wrapped distance should be 20
      expect(getDistance(p1, p2)).toBe(20)
    })
  })
})
