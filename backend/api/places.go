package api

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
)

type PlacesResp struct {
	APIVersion int    `json:"apiVersion"`
	Version    string `json:"version"`
	Data       struct {
		List []struct {
			Size    int       `json:"size"`
			ID      string    `json:"id"`
			Geo     []float64 `json:"geo"`
			URL     string    `json:"url"`
			Boost   bool      `json:"boost"`
			Title   string    `json:"title"`
			Country string    `json:"country"`
		} `json:"list"`
	} `json:"data"`
}

func GetPlaces() PlacesResp {

	url := "https://radio.garden/api/ara/content/places"

	resp, err := http.Get(url)
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	// unmarshal the json
	var places PlacesResp
	json.Unmarshal(body, &places)

	return places
}
