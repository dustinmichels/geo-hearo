package radiogarden

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Place struct {
	APIVersion int    `json:"apiVersion"`
	Version    string `json:"version"`
	Data       struct {
		Type      string `json:"type"`
		Count     int    `json:"count"`
		Map       string `json:"map"`
		Title     string `json:"title"`
		Subtitle  string `json:"subtitle"`
		URL       string `json:"url"`
		UtcOffset int    `json:"utcOffset"`
		Content   []struct {
			Items []struct {
				Href  string `json:"href"`
				Title string `json:"title"`
			} `json:"items"`
			ItemsType      string `json:"itemsType,omitempty"`
			Title          string `json:"title"`
			Type           string `json:"type"`
			RightAccessory string `json:"rightAccessory,omitempty"`
		} `json:"content"`
	} `json:"data"`
}

func GetPlace(placeId string) (*Place, error) {

	url := fmt.Sprintf("https://radio.garden/api/ara/content/page/%s", placeId)
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("GetPlace: GET error: %w", err)
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("GetPlace: could not read body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GetPlace: API error: %s", string(body))
	}

	var place Place
	if err := json.Unmarshal(body, &place); err != nil {
		return nil, fmt.Errorf("GetPlace: unmarshal error: %w", err)
	}

	return &place, nil
}
