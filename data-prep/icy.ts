/**
 * ICY Metadata Protocol Implementation
 * Optimized for Bun Runtime with enhanced Debugging
 */

const STREAM_URL = "https://azura1.cmaudioevideo.com:8190/radio.mp3";

interface StreamMetadata {
  title?: string;
  artist?: string;
  raw: string;
}

async function getIcyMetadata(url: string) {
  try {
    console.log(`[Bun] Connecting to: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Icy-Metadata": "1",
        "User-Agent": "Bun/1.0 ICY-Parser",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const metaintHeader = response.headers.get("icy-metaint");
    if (!metaintHeader) {
      console.warn("ERROR: 'icy-metaint' header missing. This URL might not support ICY metadata.");
      return;
    }

    const metaint = parseInt(metaintHeader, 10);
    console.log(`Confirmed Metadata Interval: ${metaint} bytes`);

    const body = response.body;
    if (!body) throw new Error("No response body.");

    let audioBytesToSkip = metaint;
    let state: "AUDIO" | "LENGTH" | "METADATA" = "AUDIO";
    let metadataLength = 0;
    let metadataBuffer = Buffer.alloc(0);
    let totalBytesSeen = 0;
    let currentSongRaw = "";
    let checkpointCount = 0;

    console.log("Streaming started. Monitoring for song changes...\n");

    for await (const chunk of body) {
      const value = chunk as Uint8Array;
      totalBytesSeen += value.length;

      let offset = 0;
      while (offset < value.length) {
        if (state === "AUDIO") {
          const availableInChunk = value.length - offset;
          if (availableInChunk >= audioBytesToSkip) {
            offset += audioBytesToSkip;
            state = "LENGTH";
            audioBytesToSkip = metaint;
          } else {
            audioBytesToSkip -= availableInChunk;
            offset = value.length;
          }
        } else if (state === "LENGTH") {
          const lengthByte = value[offset];
          metadataLength = lengthByte * 16;
          offset++;
          checkpointCount++;

          if (metadataLength === 0) {
            // Only print progress if we haven't found a song yet,
            // otherwise just stay quiet until a change happens.
            if (!currentSongRaw && checkpointCount % 5 === 0) {
              process.stdout.write(".");
            }
            state = "AUDIO";
          } else {
            state = "METADATA";
            metadataBuffer = Buffer.alloc(0);
          }
        } else if (state === "METADATA") {
          const needed = metadataLength - metadataBuffer.length;
          const available = value.length - offset;
          const toCopy = Math.min(needed, available);

          const part = value.subarray(offset, offset + toCopy);
          metadataBuffer = Buffer.concat([metadataBuffer, part]);
          offset += toCopy;

          if (metadataBuffer.length === metadataLength) {
            const rawMetadata = new TextDecoder().decode(metadataBuffer).replace(/\0/g, "");

            // Only act if the metadata string is different from the last one we saw
            if (rawMetadata !== currentSongRaw) {
              const parsed = parseMetadata(rawMetadata);

              if (parsed.title) {
                currentSongRaw = rawMetadata;
                console.log(
                  `\n\x1b[32m[${new Date().toLocaleTimeString()}] 🎵 NEW TRACK DETECTED\x1b[0m`,
                );
                console.log(`   \x1b[1mArtist:\x1b[0m ${parsed.artist || "Unknown Artist"}`);
                console.log(`   \x1b[1mTitle: \x1b[0m ${parsed.title}`);
                console.log(`   \x1b[90m(Interval Checkpoint: ${checkpointCount})\x1b[0m\n`);
              }
            }

            state = "AUDIO";
          }
        }
      }
    }
  } catch (error) {
    console.error("\nStream connection error:", error);
  }
}

function parseMetadata(raw: string): StreamMetadata {
  const result: StreamMetadata = { raw };
  const match = raw.match(/StreamTitle=['"](.*?)['"];/i);

  if (match && match[1]) {
    const fullTitle = match[1].trim();
    if (fullTitle.includes(" - ")) {
      const parts = fullTitle.split(" - ");
      result.artist = parts[0].trim();
      result.title = parts.slice(1).join(" - ").trim();
    } else {
      result.title = fullTitle;
      result.artist = "";
    }
  }
  return result;
}

getIcyMetadata(STREAM_URL);
