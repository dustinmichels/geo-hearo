package radiogarden

import (
	"fmt"
	"net/http"
)

func GetStreamURL(channelId string) (string, error) {
	url := fmt.Sprintf("https://radio.garden/api/ara/content/listen/%s/channel.mp3", channelId)

	// We use a custom client or just http.Get, but we need to check the final URL.
	// http.Get automatically follows redirects.
	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("GetStreamURL: GET error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("GetStreamURL: status not OK: %d", resp.StatusCode)
	}

	// The final URL is in resp.Request.URL because http.Get follows redirects.
	return resp.Request.URL.String(), nil
}
