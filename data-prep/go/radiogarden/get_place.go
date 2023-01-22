package radiogarden

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
			ItemsType string `json:"itemsType,omitempty"`
			Title     string `json:"title"`
			Type      string `json:"type"`
			Items     []struct {
				Map      string `json:"map"`
				Href     string `json:"href"`
				Title    string `json:"title"`
				Subtitle string `json:"subtitle"`
			} `json:"items"`
			RightAccessory string `json:"rightAccessory,omitempty"`
		} `json:"content"`
	} `json:"data"`
}
