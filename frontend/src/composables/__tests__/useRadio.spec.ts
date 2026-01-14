import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRadio } from '../useRadio'

// Mock fetch
const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()
vi.stubGlobal('sessionStorage', sessionStorageMock)

describe('useRadio Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    const { resetData } = useRadio()
    resetData()
  })

  it('correctly identifies USA when guessed', async () => {
    // 1. Mock Data
    const mockRadioData = [
      {
        country: 'United States',
        ISO_A2: 'US',
        place_name: 'New York',
        channel_resolved_url: 'http://test.com',
        channel_id: '1',
      },
      {
        country: 'Canada',
        ISO_A2: 'CA',
        place_name: 'Toronto',
        channel_resolved_url: 'http://test.com',
        channel_id: '2',
      },
    ]

    const mockCentersData = {
      features: [
        {
          properties: { name: 'United States', iso_a2: 'US' },
          geometry: { coordinates: [-95, 37] },
        },
        {
          properties: { name: 'Canada', iso_a2: 'CA' },
          geometry: { coordinates: [-106, 56] },
        },
      ],
    }

    // 2. Setup Fetch Mock
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('radio.json')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockRadioData),
        })
      }
      if (url.includes('centers.geojson')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockCentersData),
        })
      }
      return Promise.reject(new Error(`Unknown URL: ${url}`))
    })

    // 3. Initialize Composable
    const { loadStations, secretCountry, getCountryIso, addGuess, guesses } =
      useRadio()

    // 4. Load Data
    await loadStations()

    // 5. Set Scene: Secret Country is USA (ISO)
    secretCountry.value = 'US'

    // 6. Act: User guesses USA
    // Simulating PlayDesktop logic: Get ISO for guess, then compare
    const guessName = 'United States'
    const guessIso = getCountryIso(guessName)

    // Assert mapping works
    expect(guessIso).toBe('US')

    // Simulate game logic
    if (guessIso === secretCountry.value) {
      addGuess(guessIso as string)
    }

    // 7. Assert
    expect(guesses.value).toContain('US')
    expect(secretCountry.value).toBe('US')
  })

  it('correctly handles Turkey vs Türkiye mismatch using ISO codes', async () => {
    // 1. Mock Data with Mismatch
    // Radio data has "Türkiye", Centers data has "Turkey"
    const mockRadioData = [
      {
        country: 'Türkiye',
        ISO_A2: 'TR',
        place_name: 'Ankara',
        channel_resolved_url: 'http://test.com',
        channel_id: '3',
      },
    ]

    const mockCentersData = {
      features: [
        {
          properties: { name: 'Turkey', iso_a2: 'TR' },
          geometry: { coordinates: [35, 39] },
        },
      ],
    }

    // 2. Setup Fetch Mock
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('radio.json')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockRadioData),
        })
      }
      if (url.includes('centers.geojson')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockCentersData),
        })
      }
      return Promise.reject(new Error(`Unknown URL: ${url}`))
    })

    // 3. Initialize Composable
    const { loadStations, secretCountry, selectRandomCountry, checkGuess } =
      useRadio()

    await loadStations()
    selectRandomCountry() // Should select Türkiye

    // 4. Act: User guesses "Turkey"
    const guessName = 'Turkey'
    const secretName = secretCountry.value // Should be "Türkiye"

    // Verify raw strings don't match
    expect(guessName.toLowerCase()).not.toBe(secretName.toLowerCase())

    // Verify checkGuess returns true via ISO comparison
    expect(checkGuess(guessName)).toBe(true)

    // Verify an incorrect guess returns false
    expect(checkGuess('Germany')).toBe(false)
  })
})
