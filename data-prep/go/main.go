package main

import (
	"fmt"

	"github.com/dustinmichels/geo-hearo/radiogarden"
)

func main() {

	places, err := radiogarden.GetPlaces()
	if err != nil {
		panic(err)
	}

	p := places.Data.List[0]

	// fmt.Printf("Places: %+v\n", places)
	fmt.Printf("Place: %+v\n", p)

}
