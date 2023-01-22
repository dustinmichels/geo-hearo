package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/dustinmichels/geo-hearo/radiogarden"
)

func main() {

	// ---------- Get All Places ----------

	log.Println("GET Places")
	placesResp, err := radiogarden.GetPlaces()
	if err != nil {
		panic(err)
	}

	// Save JSON
	file, err := json.MarshalIndent(placesResp, "", " ")
	if err != nil {
		panic(err)
	}
	createDirIfNotExist("./out")
	err = os.WriteFile("./out/places.json", file, 0644)
	if err != nil {
		log.Fatalf("WriteFile: %s", err)
	}
	log.Println("WROTE out/places.json")

	// ---------- Get Each Place ----------

	places := placesResp.Data.List[:10]

	var wg sync.WaitGroup
	wg.Add(len(places))

	for i := range places {
		go func(i int) {
			defer wg.Done()

			place := places[i]
			log.Printf("GET [%d] - %s\n", i, place.Title)

			// GET Request
			resp, err := radiogarden.GetPlaceChannels(place.ID)
			if err != nil {
				log.Printf("ERROR [%d] - %s: %s\n", i, place.Title, err)
				return
			}

			// Save JSON
			file, err := json.MarshalIndent(resp, "", " ")
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

}

func createDirIfNotExist(dir string) {
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		err = os.MkdirAll(dir, 0755)
		if err != nil {
			panic(err)
		}
	}
}
