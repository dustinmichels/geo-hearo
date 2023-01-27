import data from '../assets/data/source.json'

export interface SourceData {
  name: string
  two_code: string
  three_code: string
}

export function loadSourceData() {
  return data as SourceData[]
}

export function getCountryNames(): string[] {
  const countries = data.map((country) => country.name)
  return Array.from(new Set(countries))
}

export function getRandomCountry(): string {
  const countries = getCountryNames()
  const randomIndex = Math.floor(Math.random() * countries.length)
  return countries[randomIndex]
}
