package main

import (
	"context"
	"log"
	"time"
)

const idleTimeout = 90 * time.Second

// Station represents a single monitored radio stream. It owns the client map
// exclusively inside run() — no locks needed for map access on the hot path.
type Station struct {
	url       string
	hub       *Hub
	clients   map[*Client]struct{}
	lastMeta  *Message
	broadcast chan Message
	subscribe chan *Client
	unsub     chan *Client
	ctx       context.Context
	cancel    context.CancelFunc
}

// run is the station manager goroutine. It is the sole writer to clients and
// lastMeta, which eliminates map-access races without locks on the hot path.
func (s *Station) run() {
	idle := time.NewTimer(idleTimeout)
	stopTimer(idle) // don't start idle until there are zero clients

	for {
		select {
		case c := <-s.subscribe:
			s.clients[c] = struct{}{}
			stopTimer(idle)
			if s.lastMeta != nil {
				select {
				case c.send <- *s.lastMeta:
				default:
				}
			}

		case c := <-s.unsub:
			delete(s.clients, c)
			if len(s.clients) == 0 {
				idle.Reset(idleTimeout)
				log.Printf("[station] %s: no subscribers, idle timer started", s.url)
			}

		case m := <-s.broadcast:
			s.lastMeta = &m
			for c := range s.clients {
				select {
				case c.send <- m:
				default:
					log.Printf("[station] %s: dropped message for slow client", s.url)
				}
			}

		case <-idle.C:
			log.Printf("[station] %s: idle timeout, stopping", s.url)
			s.hub.Remove(s.url, s)
			s.cancel()
			// Close all remaining client send channels so write pumps exit.
			for c := range s.clients {
				close(c.send)
				delete(s.clients, c)
			}
			return
		}
	}
}

// runStream reads the ICY stream and forwards metadata to the manager goroutine.
// Retries with exponential backoff on error. Exits when ctx is cancelled.
func (s *Station) runStream() {
	backoff := 2 * time.Second
	for {
		log.Printf("[stream] %s: connecting", s.url)
		err := ReadStream(s.ctx, s.url, func(m Message) {
			select {
			case s.broadcast <- m:
			case <-s.ctx.Done():
			}
		})

		if s.ctx.Err() != nil {
			log.Printf("[stream] %s: context cancelled, stopping", s.url)
			return
		}

		log.Printf("[stream] %s: error: %v — retrying in %s", s.url, err, backoff)
		select {
		case <-time.After(backoff):
		case <-s.ctx.Done():
			return
		}
		if backoff < 60*time.Second {
			backoff *= 2
		}
	}
}

func stopTimer(t *time.Timer) {
	if !t.Stop() {
		select {
		case <-t.C:
		default:
		}
	}
}
