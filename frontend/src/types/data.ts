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

export interface Country {
  name: string
  two_code: string
  three_code: string
}
