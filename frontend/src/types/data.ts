// ----- radio station json -----
export interface RadioStation {
  place_id: string
  channel_id: string
  channel_url: string
  place_name: string
  channel_name: string
  place_size: number
  boost: boolean
  country: string
  geo_lat: number
  geo_lon: number
  three_code: string
  two_code: string
}

export interface RadioStationWithStreamingUrl extends RadioStation {
  streamingUrl: string
}

// ----- centers json -----
export interface Centers {
  type: string
  crs: {
    type: string
    properties: {
      name: string
    }
  }
  features: CenterFeature[]
}

interface CenterFeature {
  type: string
  properties: {
    COUNTRYAFF: string
    AFF_ISO: string
  }
  geometry: {
    type: string
    coordinates: number[]
  }
}

// ----- country object -----
export interface Country {
  name: string
  two_code: string
  three_code: string
}

export type Bearing = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'

export interface CountryWithDistance extends Country {
  distance: number // km
  direction: Bearing
}

// A JSON.stringify-ed version of a country object
export type CountryString = 'string'
