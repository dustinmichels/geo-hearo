package radiogarden

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Channel struct {
	Href  string `json:"href"`
	Title string `json:"title"`
}

func GetPlaceChannels(placeId string) ([]Channel, error) {

	url := fmt.Sprintf("https://radio.garden/api/ara/content/page/%s/channels", placeId)
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("GetPlaceChannels: GET error: %w", err)
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("GetPlaceChannels: could not read body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GetPlaceChannels: API error: %s", string(body))
	}

	var placeChannelsResponse getPlaceChannelsResponse
	if err := json.Unmarshal(body, &placeChannelsResponse); err != nil {
		return nil, fmt.Errorf("GetPlaceChannels: unmarshal error: %w", err)
	}

	return placeChannelsResponse.Data.Content[0].Items, nil

}

type getPlaceChannelsResponse struct {
	APIVersion int    `json:"apiVersion"`
	Version    string `json:"version"`
	Data       struct {
		Map       string `json:"map"`
		URL       string `json:"url"`
		Type      string `json:"type"`
		Count     int    `json:"count"`
		Title     string `json:"title"`
		Subtitle  string `json:"subtitle"`
		UtcOffset int    `json:"utcOffset"`
		Content   []struct {
			ItemsType string    `json:"itemsType"`
			Type      string    `json:"type"`
			Items     []Channel `json:"items"`
		} `json:"content"`
	} `json:"data"`
}
