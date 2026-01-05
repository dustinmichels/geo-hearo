import { ref } from 'vue'

export interface RadioStation {
  place_name: string
  place_id: string
  channel_id: string
  channel_url: string
  channel_name: string
  channel_stream: string
  channel_secure: boolean
  place_size: number
  boost: boolean
  country: string
  geo_lat: number
  geo_lon: number
  channel_resolved_url: string
  center: [number, number]
}

const allStations = ref<RadioStation[]>([])
const countries = ref<string[]>([])
const selectedCountry = ref<string>('')
const currentStations = ref<RadioStation[]>([])
const isLoading = ref(false)

export function useRadio() {
  const loadStations = async () => {
    if (allStations.value.length > 0) return // Already loaded

    isLoading.value = true
    try {
      const response = await fetch('/data/radio.json')
      const data = await response.json()
      allStations.value = data

      // Extract unique countries
      const uniqueCountries = new Set<string>()
      data.forEach((station: RadioStation) => {
        if (station.country) uniqueCountries.add(station.country)
      })
      countries.value = Array.from(uniqueCountries)
    } catch (error) {
      console.error('Failed to load radio stations:', error)
    } finally {
      isLoading.value = false
    }
  }

  const selectRandomCountry = () => {
    if (countries.value.length === 0) return

    const randomIndex = Math.floor(Math.random() * countries.value.length)
    const country = countries.value[randomIndex]
    if (country) {
      selectedCountry.value = country

      // Filter stations for this country
      const countryStations = allStations.value.filter(
        (s) => s.country === selectedCountry.value,
      )

      // We want 5 stations. If less, take all. If more, shuffle or take first 5.
      // Since the user says "Radio stations as vue variables as well", let's store them.
      currentStations.value = countryStations.slice(0, 5)
    }
  }

  return {
    allStations,
    countries,
    selectedCountry,
    currentStations,
    isLoading,
    loadStations,
    selectRandomCountry,
  }
}
