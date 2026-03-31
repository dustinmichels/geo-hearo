package crawldata

// Station is the normalized output record shared across all scrapers.
type Station struct {
	Source      string  `csv:"source"`
	ChannelID   string  `csv:"channel_id"`
	ChannelName string  `csv:"channel_name"`
	StreamURL   string  `csv:"channel_resolved_url"`
	Country     string  `csv:"country"`
	CountryCode string  `csv:"country_code"`
	GeoLat      float64 `csv:"geo_lat"`
	GeoLon      float64 `csv:"geo_lon"`
	PlaceName   string  `csv:"place_name"`
	Tags        string  `csv:"tags"`
	Homepage    string  `csv:"homepage"`
	Language    string  `csv:"language"`
}
