export interface NeCountryProperties {
  ADMIN: string
  [key: string]: any
}

export interface RadioStation {
  place_name: string
  place_id: string
  channel_id: string
  channel_url: string
  channel_name: string
  place_size: number
  country: string // This is the country name from the radio table (might differ from ADMIN)
  geo_lat: number
  geo_lon: number
  channel_resolved_url: string
  ADMIN: string // The linking key
  ISO_A3: string
  CONTINENT: string
}

export interface IndexStructure {
  config: {
    line_length: number
  }
  countries: Record<string, { start: number; count: number }>
}

export interface GameHistoryItem {
  country: string
  score: string
  numericScore: number
  date: string
  mode: 'daily' | 'free'
}
