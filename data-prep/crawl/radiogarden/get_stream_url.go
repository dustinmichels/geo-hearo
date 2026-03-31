package radiogarden

import (
	"fmt"
	"net/http"
)

func GetStreamURL(client *http.Client, channelId string) (string, error) {
	url := fmt.Sprintf("https://radio.garden/api/ara/content/listen/%s/channel.mp3", channelId)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("GetStreamURL: build request: %w", err)
	}
	req.Header.Set("User-Agent", userAgent())

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("GetStreamURL: GET error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("GetStreamURL: status not OK: %d", resp.StatusCode)
	}

	return resp.Request.URL.String(), nil
}
