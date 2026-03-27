package main

import (
	"flag"
	"log"
	"net/http"
	"net/url"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, // permissive for dev
}

func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
	rawURL := r.URL.Query().Get("url")
	if rawURL == "" {
		http.Error(w, "missing url query param", http.StatusBadRequest)
		return
	}
	parsed, err := url.ParseRequestURI(rawURL)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		http.Error(w, "invalid url: must be http or https", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[ws] upgrade error: %v", err)
		return
	}

	station := h.GetOrCreate(rawURL)
	client := &Client{
		station: station,
		conn:    conn,
		send:    make(chan Message, 8),
	}

	station.subscribe <- client

	go client.readPump()
	client.writePump() // blocks until disconnect
}

func main() {
	addr := flag.String("addr", ":8080", "listen address")
	flag.Parse()

	hub := NewHub()
	http.HandleFunc("/ws", hub.ServeWS)

	log.Printf("ICY WebSocket server listening on %s", *addr)
	log.Fatal(http.ListenAndServe(*addr, nil))
}
