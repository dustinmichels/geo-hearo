package api

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

// A particular place
type PageResp struct {
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

func GetPage(placeId string) PageResp {

	url := fmt.Sprintf("https://radio.garden/api/ara/content/page/%s", placeId)

	resp, err := http.Get(url)
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	// unmarshal the json
	var page PageResp
	json.Unmarshal(body, &page)

	// fmt.Printf("%+v", places)

	return page
	// fmt.Println(string(body))

}
