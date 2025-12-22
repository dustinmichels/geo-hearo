import { Country, RadioStation } from '../types'

// choose random country from list
export const getRandomCountry = (countries: Country[]): Country => {
  return countries[Math.floor(Math.random() * countries.length)]
}

// select n random radio stations from a country from the complete list
export const pickRadioStations = (
  radioData: RadioStation[],
  country: Country,
  n: number
): RadioStation[] => {
  const stations = radioData.filter(
    (station) => station.country === country.name
  )
  const shuffled = stations.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, n)
}
