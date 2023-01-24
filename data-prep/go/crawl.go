package main

import (
	"log"
	"math/rand"
	"strings"
	"sync"

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

func Crawl() []*OutputRow {
	log.Println("GET Places")

	places, err := radiogarden.GetPlaces()
	if err != nil {
		panic(err)
	}

	return iterPlaces(places)
}

func iterPlaces(places []radiogarden.Place) []*OutputRow {

	places = samplePlaces(places, 10)
	output := []*OutputRow{}

	var wg sync.WaitGroup
	wg.Add(len(places))

	for i := range places {
		go func(i int) {
			defer wg.Done()
			place := places[i]
			log.Printf("GET [%d] - %s\n", i, place.Title)

			placeChannels, err := radiogarden.GetPlaceChannels(place.ID)
			if err != nil {
				log.Printf("ERROR [%d] - %s: %s\n", i, place.Title, err)
				return
			}

			for _, channel := range placeChannels {
				out := MakeOutputRow(&place, &channel)
				output = append(output, out)
			}
		}(i)
	}

	wg.Wait()
	return output
}

func samplePlaces(places []radiogarden.Place, n int) []radiogarden.Place {
	out := []radiogarden.Place{}
	for i := 0; i < n; i++ {
		p := places[rand.Intn(len(places))]
		out = append(out, p)
	}
	return out
}
