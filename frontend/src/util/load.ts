import data from '../assets/data/radio.json'
import { Country, RadioStation } from '../types'

export function loadData() {
  return data as RadioStation[]
}

// Create a list of unique countries from the radio data
export function getCountries(radioData: RadioStation[]): Country[] {
  return radioData.reduce((acc, { country, two_code, three_code }) => {
    if (!acc.some((c) => c.name === country)) {
      acc.push({ name: country, two_code, three_code })
    }
    return acc
  }, [] as { name: string; two_code: string; three_code: string }[])
}
