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
    it('calculates great circle distance (approx)', () => {
      const p1 = { lat: 0, lng: 0 }
      const p2 = { lat: 3, lng: 4 }
      // 3 lat ~ 333km, 4 lng ~ 444km ... but on sphere it's different.
      // Actual result ~ 555.8 km
      expect(getDistance(p1, p2)).toBeCloseTo(555.8, 1)
    })

    it('handles antimeridian wrapping', () => {
      const p1 = { lat: 0, lng: -170 }
      const p2 = { lat: 0, lng: 170 }
      // Wrapped longitudinal distance is 20 degrees.
      // 20 degrees * ~111.19 km/deg = ~2223.9 km
      expect(getDistance(p1, p2)).toBeCloseTo(2223.9, 1)
    })
  })
})
