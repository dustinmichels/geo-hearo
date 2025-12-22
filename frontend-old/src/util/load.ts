import centers from '../assets/data/centers.json'
import data from '../assets/data/radio.json'
import { Centers, Country, RadioStation } from '../types'

export function loadData() {
  return data as RadioStation[]
}

export function loadCenters() {
  return centers as Centers
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
