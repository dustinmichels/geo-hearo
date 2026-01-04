package main

import (
	"fmt"
	"log"
	"math/rand"
	"strings"
	"sync"

	"github.com/dustinmichels/geo-hearo/crawl/radiogarden"
)

type OutputRow struct {
	PlaceID           string  `json:"placeId" csv:"place_id"`
	ChannelID         string  `json:"channelId" csv:"channel_id"`
	ChannelURL        string  `json:"channelURL" csv:"channel_url"`
	PlaceName         string  `json:"placeName" csv:"place_name"`
	ChannelName       string  `json:"channelName" csv:"channel_name"`
	ChannelStream     string  `json:"channelStream" csv:"channel_stream"`
	ChannelSecure     bool    `json:"channelSecure" csv:"channel_secure"`
	PlaceSize         int     `json:"placeSize" csv:"place_size"`
	Boost             bool    `json:"boost" csv:"boost"`
	Country           string  `json:"country" csv:"country"`
	Latitude          float64 `json:"latitude" csv:"geo_lat"`
	Longitude         float64 `json:"longitude"  csv:"geo_lon"`
	ResolvedStreamURL string  `json:"resolvedStreamURL" csv:"channel_resolved_url"`
}

func MakeOutputRow(p *radiogarden.Place, c *radiogarden.Channel) *OutputRow {
	return &OutputRow{
		PlaceID:       p.ID,
		ChannelID:     strings.Split(c.Page.URL, "/")[3],
		ChannelURL:    c.Page.URL,
		PlaceName:     p.Title,
		ChannelName:   c.Page.Title,
		ChannelStream: c.Page.Stream,
		ChannelSecure: c.Page.Secure,
		PlaceSize:     p.Size,
		Boost:         p.Boost,
		Country:       p.Country,
		Latitude:      p.Geo[1],
		Longitude:     p.Geo[0],
	}
}

func Crawl(n_threads int) []*OutputRow {
	log.Println("GET Places")

	places, err := radiogarden.GetPlaces()
	if err != nil {
		panic(err)
	}

	// print msg
	log.Printf("Successfully got %d places\n", len(places))

	// places = SamplePlaces(places, 10)
	output := []*OutputRow{}
	errors := []int{}

	var wg sync.WaitGroup
	wg.Add(len(places))

	ch := make(chan int, n_threads) // buffer requests

	for i := range places {
		go func(i int) {
			defer wg.Done()

			ch <- i // add to channel; block if full

			place := places[i]
			log.Printf("GET [%d] - %s\n", i, place.Title)

			placeChannels, err := radiogarden.GetPlaceChannels(place.ID)
			if err != nil {
				log.Printf("ERROR [%d] - %s: %s\n", i, place.Title, err)
				errors = append(errors, i)
				return
			}

			for _, channel := range placeChannels {
				out := MakeOutputRow(&place, &channel)

				// Resolve streaming URL
				resolved, err := radiogarden.GetStreamURL(out.ChannelID)
				if err != nil {
					log.Printf("WARN: could not resolve stream for %s: %s\n", out.ChannelID, err)
				} else {
					out.ResolvedStreamURL = resolved
				}

				output = append(output, out)
			}

			<-ch // free the channel #FreeTheChannel

		}(i)
	}

	wg.Wait()

	log.Printf("Successfully got %d/%d (%.2f%%) places\n", len(places)-len(errors), len(places), float64(len(places)-len(errors))/float64(len(places))*100)
	fmt.Println("Errors:")
	for _, idx := range errors {
		fmt.Printf("  !! - [%d] - %s, %s", idx, places[idx].Title, places[idx].Country)
	}

	return output

}

func SamplePlaces(places []radiogarden.Place, n int) []radiogarden.Place {
	out := []radiogarden.Place{}
	for i := 0; i < n; i++ {
		p := places[rand.Intn(len(places))]
		out = append(out, p)
	}
	return out
}
