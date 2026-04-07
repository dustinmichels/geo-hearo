package crawldata

import (
	"os"
	"strings"

	"github.com/gocarina/gocsv"
)

// DeduplicateByURL keeps the record with the highest score when two stations
// share the same channel_resolved_url.
func DeduplicateByURL(stations []*Station) []*Station {
	best := make(map[string]*Station)
	var noURL []*Station

	for _, s := range stations {
		key := strings.TrimSpace(s.StreamURL)
		if key == "" {
			noURL = append(noURL, s)
			continue
		}
		if existing, ok := best[key]; !ok || better(s, existing) {
			best[key] = s
		}
	}

	result := make([]*Station, 0, len(best)+len(noURL))
	for _, s := range best {
		result = append(result, s)
	}
	return append(result, noURL...)
}

// DeduplicateByNameCity keeps the record with the highest score when two
// stations share the same normalized (lowercase+trimmed) channel_name and place_name.
func DeduplicateByNameCity(stations []*Station) []*Station {
	best := make(map[string]*Station)
	var noKey []*Station

	for _, s := range stations {
		name := Norm(s.ChannelName)
		city := Norm(s.PlaceName)
		if name == "" || city == "" {
			noKey = append(noKey, s)
			continue
		}
		key := name + "|" + city
		if existing, ok := best[key]; !ok || better(s, existing) {
			best[key] = s
		}
	}

	result := make([]*Station, 0, len(best)+len(noKey))
	for _, s := range best {
		result = append(result, s)
	}
	return append(result, noKey...)
}

// better reports whether candidate should replace existing.
// A record with a resolved stream URL always beats one without, regardless of
// other field counts. When both have (or both lack) a URL, fall back to Score.
func better(candidate, existing *Station) bool {
	hasURL := func(s *Station) bool { return strings.TrimSpace(s.StreamURL) != "" }
	if hasURL(candidate) != hasURL(existing) {
		return hasURL(candidate)
	}
	return Score(candidate) > Score(existing)
}

// Score counts the number of populated fields in a station record.
func Score(s *Station) int {
	n := 0
	for _, f := range []string{s.ChannelName, s.StreamURL, s.Country, s.CountryCode, s.PlaceName, s.Tags, s.Homepage, s.Language} {
		if strings.TrimSpace(f) != "" {
			n++
		}
	}
	if s.GeoLat != 0 {
		n++
	}
	if s.GeoLon != 0 {
		n++
	}
	return n
}

// Norm lowercases and trims a string for comparison.
func Norm(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}

func ReadCSV(path string) ([]*Station, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var stations []*Station
	if err := gocsv.UnmarshalFile(f, &stations); err != nil {
		return nil, err
	}
	return stations, nil
}

func WriteCSV(stations []*Station, path string) error {
	os.Remove(path)
	f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE, os.ModePerm)
	if err != nil {
		return err
	}
	defer f.Close()
	return gocsv.MarshalFile(stations, f)
}
