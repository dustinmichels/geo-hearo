package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
	"strings"
	"sync"

	"github.com/dustinmichels/geo-hearo/radiogarden"
	"github.com/gocarina/gocsv"
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

	channelHrefParts := strings.Split(c.Href, "/")
	channelID := channelHrefParts[len(channelHrefParts)-1]

	return &OutputRow{
		PlaceID:     p.ID,
		ChannelID:   channelID,
		PlaceName:   p.Title,
		ChannelName: c.Title,
		PlaceSize:   p.Size,
		Boost:       p.Boost,
		Country:     p.Country,
		GeoLat:      p.Geo[1],
		GeoLon:      p.Geo[0],
	}
}

func main() {

	createDirIfNotExist("./out")
	os.Remove("./out/output.csv")

	// ---------- Get All Places ----------

	log.Println("GET Places")
	places, err := radiogarden.GetPlaces()
	if err != nil {
		panic(err)
	}

	// Save JSON
	file, err := json.MarshalIndent(places, "", " ")
	if err != nil {
		panic(err)
	}
	err = os.WriteFile("./out/places.json", file, 0644)
	if err != nil {
		log.Fatalf("WriteFile: %s", err)
	}
	log.Println("WROTE out/places.json")

	// ---------- Iterate over places ----------

	GetPlaces(places)

}

func GetPlaces(fullPlaces []radiogarden.Place) {

	// places := fullPlaces[:10]
	places := samplePlaces(fullPlaces, 10)

	output := []*OutputRow{}

	var wg sync.WaitGroup
	wg.Add(len(places))

	for i := range places {
		go func(i int) {
			defer wg.Done()

			place := places[i]
			log.Printf("GET [%d] - %s\n", i, place.Title)

			// GET Request
			placeChannels, err := radiogarden.GetPlaceChannels(place.ID)
			if err != nil {
				log.Printf("ERROR [%d] - %s: %s\n", i, place.Title, err)
				return
			}

			log.Printf("  > [%d] - # channels %d\n", i, len(placeChannels))

			for _, channel := range placeChannels {
				log.Printf("ADDING CHANNEL [%d] - %s", i, channel.Title)
				out := MakeOutputRow(&place, &channel)
				output = append(output, out)
			}

			// Save JSON
			file, err := json.MarshalIndent(placeChannels, "", " ")
			if err != nil {
				panic(err)
			}
			err = os.WriteFile(fmt.Sprintf("./out/place_%d.json", i), file, 0644)
			if err != nil {
				log.Fatalf("WriteFile: %s", err)
			}
			log.Printf("WROTE out/place_%d.json", i)

		}(i)
	}

	wg.Wait()

	// Save CSV
	saveToCsv(output)

}

func createDirIfNotExist(dir string) {
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		err = os.MkdirAll(dir, 0755)
		if err != nil {
			panic(err)
		}
	}
}

func saveToCsv(output []*OutputRow) {
	outCSV, err := os.OpenFile("out/output.csv", os.O_RDWR|os.O_CREATE, os.ModePerm)
	if err != nil {
		panic(err)
	}
	defer outCSV.Close()

	gocsv.MarshalFile(output, outCSV)
}

func samplePlaces(places []radiogarden.Place, n int) []radiogarden.Place {
	out := []radiogarden.Place{}
	for i := 0; i < n; i++ {
		p := places[rand.Intn(len(places))]
		out = append(out, p)
	}
	return out
}
