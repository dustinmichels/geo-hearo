import data from '../assets/data/radio.json'
import { RadioData } from '../types'

export function loadData() {
  return data as RadioData[]
}

export function getCountries(radioData: RadioData[]) {
  // return a list of unique countries, including country, two_code, and three_code
  return radioData.reduce((acc, { country, two_code, three_code }) => {
    if (!acc.some((c) => c.country === country)) {
      acc.push({ country, two_code, three_code })
    }
    return acc
  }, [] as { country: string; two_code: string; three_code: string }[])
}
