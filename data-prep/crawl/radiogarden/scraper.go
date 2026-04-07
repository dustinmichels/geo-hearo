package radiogarden

import (
	"context"
	"fmt"
	"log"
	"strings"
	"sync"
)

// Station is the normalized output type from this package.
// Defined here to avoid an import cycle; main maps it to the shared Station type.
type Station struct {
	PlaceID     string
	ChannelID   string
	ChannelName string
	PlaceName   string
	Country     string
	GeoLat      float64
	GeoLon      float64
	StreamURL   string
	Homepage    string
}

// Scraper implements the radio garden crawl.
type Scraper struct{}

func (s *Scraper) Name() string { return "radiogarden" }

func (s *Scraper) Scrape(_ context.Context, threads int) ([]*Station, error) {
	client := newClient()

	log.Println("[radiogarden] GET Places")

	places, err := GetPlaces(client)
	if err != nil {
		return nil, fmt.Errorf("GetPlaces: %w", err)
	}
	log.Printf("[radiogarden] got %d places\n", len(places))

	var (
		mu      sync.Mutex
		wg      sync.WaitGroup
		output  []*Station
		errIdxs []int
	)

	wg.Add(len(places))
	ch := make(chan struct{}, threads)

	for i := range places {
		go func(i int) {
			defer wg.Done()
			ch <- struct{}{}

			place := places[i]
			log.Printf("[radiogarden] GET [%d] - %s\n", i, place.Title)

			placeChannels, err := GetPlaceChannels(client, place.ID)
			if err != nil {
				log.Printf("[radiogarden] ERROR [%d] - %s: %s\n", i, place.Title, err)
				mu.Lock()
				errIdxs = append(errIdxs, i)
				mu.Unlock()
				<-ch
				return
			}

			for _, channel := range placeChannels {
				channelID := strings.Split(channel.Page.URL, "/")[3]
				station := &Station{
					PlaceID:     place.ID,
					ChannelID:   channelID,
					ChannelName: channel.Page.Title,
					PlaceName:   place.Title,
					Country:     place.Country,
					GeoLat:      place.Geo[1],
					GeoLon:      place.Geo[0],
					Homepage:    channel.Page.Website,
				}

				resolved, err := GetStreamURL(client, channelID)
				if err != nil {
					log.Printf("[radiogarden] WARN: could not resolve stream for %s: %s\n", channelID, err)
				} else {
					station.StreamURL = resolved
				}

				mu.Lock()
				output = append(output, station)
				mu.Unlock()
			}

			<-ch
		}(i)
	}

	wg.Wait()

	total := len(places)
	succeeded := total - len(errIdxs)
	log.Printf("[radiogarden] %d/%d (%.2f%%) places succeeded\n", succeeded, total, float64(succeeded)/float64(total)*100)

	return output, nil
}
