package main

import (
	"regexp"
	"strings"
)

// Message is the JSON payload sent to WebSocket clients on each track change.
type Message struct {
	Title  string `json:"title"`
	Artist string `json:"artist"`
	Raw    string `json:"raw"`
}

var streamTitleRe = regexp.MustCompile(`(?i)StreamTitle='(.*?)';`)

func parseMetadata(raw string) Message {
	m := Message{Raw: raw}
	match := streamTitleRe.FindStringSubmatch(raw)
	if len(match) < 2 {
		return m
	}
	full := strings.TrimSpace(match[1])
	if idx := strings.Index(full, " - "); idx != -1 {
		m.Artist = strings.TrimSpace(full[:idx])
		m.Title = strings.TrimSpace(full[idx+3:])
	} else {
		m.Title = full
	}
	return m
}
