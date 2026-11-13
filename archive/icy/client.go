package main

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeDeadline = 10 * time.Second
	pingInterval  = 30 * time.Second
	pongDeadline  = 60 * time.Second
)

// Client represents a single WebSocket connection subscribed to a Station.
type Client struct {
	station *Station
	conn    *websocket.Conn
	send    chan Message
}

// writePump drains the send channel and writes JSON messages to the WebSocket.
// Also sends periodic pings. Blocks until the connection closes.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingInterval)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeDeadline))
			if !ok {
				// Channel was closed by the station (e.g. idle shutdown).
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			data, err := json.Marshal(msg)
			if err != nil {
				log.Printf("[client] marshal error: %v", err)
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeDeadline))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// readPump discards inbound messages and handles pong frames to keep the
// connection alive. Required by gorilla/websocket to detect client disconnect.
// When it returns, it signals the write pump by closing the send channel, then
// unsubscribes from the station.
func (c *Client) readPump() {
	defer func() {
		c.station.unsub <- c
		// Drain and close send so writePump exits if it hasn't already.
		// Use a non-blocking drain in case writePump already exited.
		select {
		case <-c.send:
		default:
		}
	}()

	c.conn.SetReadDeadline(time.Now().Add(pongDeadline))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongDeadline))
		return nil
	})

	for {
		if _, _, err := c.conn.ReadMessage(); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("[client] unexpected close: %v", err)
			}
			return
		}
	}
}
