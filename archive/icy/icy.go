package main

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"strconv"
)

// ReadStream connects to url, reads the ICY byte stream, and calls onMeta
// whenever a new (changed) track metadata is detected. Blocks until ctx is
// cancelled or a fatal I/O error occurs.
func ReadStream(ctx context.Context, url string, onMeta func(Message)) error {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Icy-Metadata", "1")
	req.Header.Set("User-Agent", "GeoHearo/1.0 ICY-Parser")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	metaintStr := resp.Header.Get("icy-metaint")
	if metaintStr == "" {
		return fmt.Errorf("icy-metaint header missing; stream may not support ICY metadata")
	}
	metaint, err := strconv.Atoi(metaintStr)
	if err != nil || metaint <= 0 {
		return fmt.Errorf("invalid icy-metaint value: %q", metaintStr)
	}

	reader := bufio.NewReaderSize(resp.Body, 32*1024)
	var lastRaw string
	audioBytesToSkip := int64(metaint)

	for {
		// --- AUDIO phase: skip audio bytes ---
		if _, err := reader.Discard(int(audioBytesToSkip)); err != nil {
			return err
		}

		// --- LENGTH phase: read 1 byte ---
		lenByte, err := reader.ReadByte()
		if err != nil {
			return err
		}
		metaLen := int(lenByte) * 16

		if metaLen == 0 {
			audioBytesToSkip = int64(metaint)
			continue
		}

		// --- METADATA phase: read metaLen bytes ---
		buf := make([]byte, metaLen)
		if _, err := io.ReadFull(reader, buf); err != nil {
			return err
		}

		raw := string(bytes.TrimRight(buf, "\x00"))
		if raw != lastRaw {
			lastRaw = raw
			msg := parseMetadata(raw)
			if msg.Title != "" {
				onMeta(msg)
			}
		}

		audioBytesToSkip = int64(metaint)
	}
}
