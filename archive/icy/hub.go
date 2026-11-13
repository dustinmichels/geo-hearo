package main

import (
	"context"
	"sync"
)

// Hub maintains the registry of active stations, keyed by stream URL.
type Hub struct {
	mu       sync.RWMutex
	stations map[string]*Station
}

func NewHub() *Hub {
	return &Hub{stations: make(map[string]*Station)}
}

// GetOrCreate returns the existing Station for url, or creates and starts a
// new one. Safe for concurrent use.
func (h *Hub) GetOrCreate(url string) *Station {
	h.mu.RLock()
	s, ok := h.stations[url]
	h.mu.RUnlock()
	if ok {
		return s
	}

	h.mu.Lock()
	defer h.mu.Unlock()
	// Double-check after acquiring write lock.
	if s, ok = h.stations[url]; ok {
		return s
	}
	ctx, cancel := context.WithCancel(context.Background())
	s = &Station{
		url:       url,
		hub:       h,
		clients:   make(map[*Client]struct{}),
		broadcast: make(chan Message, 16),
		subscribe: make(chan *Client),
		unsub:     make(chan *Client),
		ctx:       ctx,
		cancel:    cancel,
	}
	h.stations[url] = s
	go s.run()
	go s.runStream()
	return s
}

// Remove deletes the station from the registry. It only deletes if the pointer
// matches, preventing a race where a new station was created for the same URL.
func (h *Hub) Remove(url string, s *Station) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.stations[url] == s {
		delete(h.stations, url)
	}
}
