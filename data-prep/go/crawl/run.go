package crawl

import (
	"log"
	"sync"

	"github.com/dustinmichels/geo-hearo/radiogarden"
)

func Run() []*OutputRow {
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
