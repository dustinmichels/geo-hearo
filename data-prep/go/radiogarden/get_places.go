package radiogarden

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type PlacesResp struct {
	APIVersion int    `json:"apiVersion"`
	Version    string `json:"version"`
	Data       struct {
		List    []PlacesResp_Place `json:"list"`
		Version string             `json:"version"`
	} `json:"data"`
}

type PlacesResp_Place struct {
	Size    int       `json:"size"`
	ID      string    `json:"id"`
	Geo     []float64 `json:"geo"`
	URL     string    `json:"url"`
	Boost   bool      `json:"boost"`
	Title   string    `json:"title"`
	Country string    `json:"country"`
}

func GetPlaces() (*PlacesResp, error) {

	url := "https://radio.garden/api/ara/content/places"
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("GetPlaces: GET error: %w", err)
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("GetPlaces: could not read body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GetPlaces: API error: %s", string(body))
	}

	var places PlacesResp
	if err := json.Unmarshal(body, &places); err != nil {
		return nil, fmt.Errorf("GetPlaces: unmarshal error: %w", err)
	}

	return &places, nil
}
