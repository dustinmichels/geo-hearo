package crawl

import (
	"math/rand"

	"github.com/dustinmichels/geo-hearo/radiogarden"
)

func samplePlaces(places []radiogarden.Place, n int) []radiogarden.Place {
	out := []radiogarden.Place{}
	for i := 0; i < n; i++ {
		p := places[rand.Intn(len(places))]
		out = append(out, p)
	}
	return out
}
