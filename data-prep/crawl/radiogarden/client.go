package radiogarden

import (
	"net/http"
	"os"
	"time"
)

const (
	fallbackUA   = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
	envUserAgent = "RG_USER_AGENT"
)

func newClient() *http.Client {
	return &http.Client{Timeout: 15 * time.Second}
}

// userAgent returns the configured User-Agent or a Chrome fallback.
func userAgent() string {
	if ua := os.Getenv(envUserAgent); ua != "" {
		return ua
	}
	return fallbackUA
}
