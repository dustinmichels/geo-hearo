import data from '../assets/data/radio.json'

export interface RadioData {
  country: string
  id: string
  title: string
  ne_idx: number
  code: string
}

export function loadRadioData() {
  return data as RadioData[]
}

export function getStationsByCountry(country: string): RadioData[] {
  const stations = data.filter((station) => station.country === country)
  return stations
}

export function getStationUrls(data: RadioData[]): string[] {
  return data.map((station) => getStreamingUrlFromStationId(station.id))
}

export function getStreamingUrlFromStationId(channelId: string): string {
  return `https://radio.garden/api/ara/content/listen/${channelId}/channel.mp3`
}
