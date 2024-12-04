import { RadioStation, RadioStationWithStreamingUrl } from '../types'

export const getStreamingUrl = (station: string) => {
  return `https://radio.garden/api/ara/content/listen/${station}/channel.mp3`
}

export const addStreamingUrl = (
  radioData: RadioStation[]
): RadioStationWithStreamingUrl[] => {
  return radioData.map((station) => ({
    ...station,
    streamingUrl: getStreamingUrl(station.channel_id),
  }))
}
