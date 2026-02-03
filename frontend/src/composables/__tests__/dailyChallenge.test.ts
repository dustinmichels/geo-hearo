import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { SeededRandom } from '../useRadio'

/**
 * Snapshot test for the daily challenge country selection algorithm.
 *
 * This ensures the SeededRandom LCG + country selection logic doesn't
 * accidentally change, which would break the daily challenge determinism
 * (all players must get the same country on the same day).
 *
 * The expected values were computed from the algorithm on 2026-02-03 and
 * locked in as constants.
 */

interface IndexStructure {
  config: { line_length: number }
  countries: Record<string, { start: number; count: number }>
}

/** Reproduce the seed computation: YYYYMMDD as an integer */
function makeSeed(year: number, month: number, day: number): number {
  return year * 10000 + month * 100 + day
}

/**
 * Reproduce the country + station selection algorithm from useRadio.ts.
 * Returns the selected country name and the station indices.
 */
function selectCountryAndStations(
  seed: number,
  sortedCountryNames: string[],
  countries: IndexStructure['countries']
): { country: string; stationIndices: number[] } {
  const rng = new SeededRandom(seed)
  const countryIdx = rng.nextInt(sortedCountryNames.length)
  const country = sortedCountryNames[countryIdx]

  const { count } = countries[country]
  const targetCount = Math.min(5, count)
  const pool = Array.from({ length: count }, (_, i) => i)
  const stationIndices: number[] = []

  for (let i = 0; i < targetCount; i++) {
    const poolIdx = rng.nextInt(pool.length)
    const selectedIndex = pool.splice(poolIdx, 1)[0]
    if (selectedIndex !== undefined) {
      stationIndices.push(selectedIndex)
    }
  }

  return { country, stationIndices }
}

describe('daily challenge country selection', () => {
  const indexPath = resolve(__dirname, '../../../public/data/index.json')
  const indexData: IndexStructure = JSON.parse(readFileSync(indexPath, 'utf-8'))
  const sortedNames = Object.keys(indexData.countries).sort()

  // Expected countries for Dec 1-15, 2025.
  // These were computed from the current algorithm and locked in.
  const expectedCountries: Record<string, string> = {
    '20251201': 'United States of America',
    '20251202': 'Slovenia',
    '20251203': 'Turkey',
    '20251204': 'Russia',
    '20251205': 'Tajikistan',
    '20251206': 'Poland',
    '20251207': 'Sudan',
    '20251208': 'Palestine',
    '20251209': 'Slovakia',
    '20251210': 'Nicaragua',
    '20251211': 'Romania',
    '20251212': 'Morocco',
    '20251213': 'Philippines',
    '20251214': 'Malaysia',
    '20251215': 'Hungary',
  }

  it.each(
    Object.entries(expectedCountries).map(([seedStr, expectedCountry]) => {
      const seed = parseInt(seedStr, 10)
      const day = seed % 100
      return { seed, day, expectedCountry }
    })
  )(
    'Dec $day, 2025 (seed=$seed) selects $expectedCountry',
    ({ seed, expectedCountry }) => {
      const { country, stationIndices } = selectCountryAndStations(
        seed,
        sortedNames,
        indexData.countries
      )

      // Print station indices for visibility (not asserted)
      console.log(
        `  seed=${seed} -> ${country} | station indices: ${stationIndices.join(', ')}`
      )

      expect(country).toBe(expectedCountry)
    }
  )

  it('SeededRandom produces consistent sequence for a given seed', () => {
    const rng = new SeededRandom(20251201)
    const values = Array.from({ length: 10 }, () => rng.nextInt(1000))

    // Lock in the first 10 values to detect any LCG changes
    expect(values).toEqual([478, 607, 100, 61, 50, 875, 488, 1, 742, 87])
  })

  it('country list has expected length', () => {
    // If countries are added/removed from index.json, country selection
    // indices will shift. This test catches that.
    expect(sortedNames.length).toBe(142)
  })
})
