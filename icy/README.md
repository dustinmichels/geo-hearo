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

## Architecture

```
WebSocket client
      │  GET /ws?url=<stream-url>
      ▼
   main.go  (ServeWS)
      │  upgrade → gorilla WebSocket conn
      │  Hub.GetOrCreate(url)
      ▼
    Hub  (hub.go)
      │  registry: url → *Station (RWMutex-protected)
      ▼
   Station  (station.go)  ── one per unique stream URL
      │
      ├── run()        goroutine — event loop (subscribe/unsub/broadcast/idle)
      │                sole writer to clients map and lastMeta; no hot-path locking
      │
      └── runStream()  goroutine — reads ICY byte stream via ReadStream()
                       forwards metadata to broadcast channel; retries with backoff

   Client  (client.go)  ── one per WebSocket connection
      ├── writePump()  blocks on send channel; marshals JSON; sends pings every 30s
      └── readPump()   discards inbound bytes; handles pongs; triggers unsub on close
```

**ICY stream parsing** (`icy.go`): sends `Icy-Metadata: 1` header, then reads the interleaved stream — skip `metaint` audio bytes, read 1 length byte (`× 16` = metadata block size), parse `StreamTitle='Artist - Title';` from the block. Fires callback only when metadata changes.

**Metadata parsing** (`metadata.go`): regex extracts `StreamTitle` value; splits on ` - ` to separate artist from title. Raw string is always included in the message.

**Lifecycle**: a `Station` is created on first subscriber, cancelled via context when the idle timer fires (90s with zero clients), and removed from the Hub registry. Client `send` channels are closed to signal write pumps to exit cleanly.
