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
	"sync"
	"time"
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

const (
	validateThreads = 20
	validateTimeout = 5 * time.Second
)

var validateClient = &http.Client{
	Timeout: validateTimeout,
	// Do not follow redirects — we just want to know if the server responds.
	CheckRedirect: func(req *http.Request, via []*http.Request) error {
		return http.ErrUseLastResponse
	},
}

// validateStreamURL sends a minimal GET with Range: bytes=0-0 and returns true
// if the server responds with 200, 206, or a redirect (3xx), indicating the
// stream endpoint is alive. Many stream servers ignore HEAD, so we use GET.
func validateStreamURL(streamURL string) bool {
	req, err := http.NewRequest("GET", streamURL, nil)
	if err != nil {
		return false
	}
	req.Header.Set("Range", "bytes=0-0")

	resp, err := validateClient.Do(req)
	if err != nil {
		return false
	}
	resp.Body.Close()

	return resp.StatusCode == http.StatusOK ||
		resp.StatusCode == http.StatusPartialContent ||
		(resp.StatusCode >= 300 && resp.StatusCode < 400)
}

// validateBatch filters stations concurrently, returning only reachable ones.
func validateBatch(stations []*Station, threads int) []*Station {
	type result struct {
		station *Station
		ok      bool
	}

	results := make([]result, len(stations))
	ch := make(chan int, threads)
	var wg sync.WaitGroup

	wg.Add(len(stations))
	for i, st := range stations {
		go func(i int, st *Station) {
			defer wg.Done()
			ch <- i
			results[i] = result{station: st, ok: validateStreamURL(st.StreamURL)}
			<-ch
		}(i, st)
	}
	wg.Wait()

	var valid []*Station
	for _, r := range results {
		if r.ok {
			valid = append(valid, r.station)
		}
	}
	return valid
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

		var paginated []*Station
		for _, a := range batch {
			placeName := a.City
			if placeName == "" {
				placeName = a.State
			}
			paginated = append(paginated, &Station{
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

		valid := validateBatch(paginated, validateThreads)
		log.Printf("[radiobrowser] offset=%d: %d/%d stations reachable\n", offset, len(valid), len(paginated))
		all = append(all, valid...)

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
