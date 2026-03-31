package radiobrowser

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strconv"
)

const (
	baseURL   = "https://de1.api.radio-browser.info/json/stations/search"
	pageLimit = 500
	fields    = "name,url_resolved,url,favicon,countrycode,country,state,city,stationuuid,geo_lat,geo_long,tags,homepage,language"
)

type apiStation struct {
	Name        string  `json:"name"`
	URLResolved string  `json:"url_resolved"`
	StationUUID string  `json:"stationuuid"`
	Country     string  `json:"country"`
	CountryCode string  `json:"countrycode"`
	State       string  `json:"state"`
	City        string  `json:"city"`
	GeoLat      float64 `json:"geo_lat"`
	GeoLong     float64 `json:"geo_long"`
	Tags        string  `json:"tags"`
	Homepage    string  `json:"homepage"`
	Language    string  `json:"language"`
}

// Station is the normalized output type from this package.
type Station struct {
	ChannelID   string
	ChannelName string
	StreamURL   string
	Country     string
	CountryCode string
	GeoLat      float64
	GeoLon      float64
	PlaceName   string
	Tags        string
	Homepage    string
	Language    string
}

// Scraper implements the Radio Browser crawl.
type Scraper struct{}

func (s *Scraper) Name() string { return "radiobrowser" }

func (s *Scraper) Scrape(_ context.Context, _ int) ([]*Station, error) {
	var all []*Station
	offset := 0

	for {
		log.Printf("[radiobrowser] fetching offset=%d\n", offset)

		batch, err := fetchPage(offset)
		if err != nil {
			return nil, err
		}
		if len(batch) == 0 {
			break
		}

		for _, a := range batch {
			placeName := a.City
			if placeName == "" {
				placeName = a.State
			}
			all = append(all, &Station{
				ChannelID:   a.StationUUID,
				ChannelName: a.Name,
				StreamURL:   a.URLResolved,
				Country:     a.Country,
				CountryCode: a.CountryCode,
				GeoLat:      a.GeoLat,
				GeoLon:      a.GeoLong,
				PlaceName:   placeName,
				Tags:        a.Tags,
				Homepage:    a.Homepage,
				Language:    a.Language,
			})
		}

		offset += pageLimit
	}

	log.Printf("[radiobrowser] collected %d stations total\n", len(all))
	return all, nil
}

func fetchPage(offset int) ([]apiStation, error) {
	params := url.Values{}
	params.Set("offset", strconv.Itoa(offset))
	params.Set("limit", strconv.Itoa(pageLimit))
	params.Set("hidebroken", "true")
	params.Set("has_geo_info", "true")
	params.Set("order", "clickcount")
	params.Set("reverse", "true")
	params.Set("fields", fields)

	endpoint := fmt.Sprintf("%s?%s", baseURL, params.Encode())
	resp, err := http.Get(endpoint)
	if err != nil {
		return nil, fmt.Errorf("fetchPage: GET error: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("fetchPage: read error: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("fetchPage: API error %d: %s", resp.StatusCode, string(body))
	}

	var stations []apiStation
	if err := json.Unmarshal(body, &stations); err != nil {
		return nil, fmt.Errorf("fetchPage: unmarshal error: %w", err)
	}

	return stations, nil
}
