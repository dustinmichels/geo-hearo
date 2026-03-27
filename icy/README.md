# icy

WebSocket server that reads ICY stream metadata and pushes song-change events to subscribers.

## Usage

```sh
go run . [-addr :8080]
```

## WebSocket API

```sh
GET ws://localhost:8080/ws?url=<encoded-stream-url>
```

- Immediately receives last known metadata (if stream is already being monitored)
- Receives a message on every track change

**Message format:**

```json
{ "title": "Song Title", "artist": "Artist Name", "raw": "StreamTitle='...';" }
```

## Behavior

- Multiple clients subscribing to the same URL share one stream reader
- Stream reader stops automatically after 90s with no subscribers
- Reconnects with exponential backoff (2s → 60s cap) on stream errors
