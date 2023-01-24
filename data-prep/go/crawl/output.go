package crawl

import (
	"strings"

	"github.com/dustinmichels/geo-hearo/radiogarden"
)

type OutputRow struct {
	PlaceID     string  `json:"placeId" csv:"place_id"`
	ChannelID   string  `json:"channelId" csv:"channel_id"`
	PlaceName   string  `json:"placeName" csv:"place_name"`
	ChannelName string  `json:"channelName" csv:"channel_name"`
	PlaceSize   int     `json:"placeSize" csv:"place_size"`
	Boost       bool    `json:"boost" csv:"boost"`
	Country     string  `json:"country" csv:"country"`
	GeoLat      float64 `json:"geoLat" csv:"geo_lat"`
	GeoLon      float64 `json:"geoLon"  csv:"geo_lon"`
}

func MakeOutputRow(p *radiogarden.Place, c *radiogarden.Channel) *OutputRow {
	return &OutputRow{
		PlaceID:     p.ID,
		ChannelID:   strings.Split(c.Href, "/")[2],
		PlaceName:   p.Title,
		ChannelName: c.Title,
		PlaceSize:   p.Size,
		Boost:       p.Boost,
		Country:     p.Country,
		GeoLat:      p.Geo[1],
		GeoLon:      p.Geo[0],
	}
}
