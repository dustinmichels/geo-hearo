import { join } from "path";

const PORT = 3000;
const PUBLIC_DIR = join(import.meta.dir, "data/out/public");

console.log(`Serving files from ${PUBLIC_DIR}`);

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Basic CORS for local development if needed
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Default to index.json or handle root if necessary, but request was specifically for json files
    let path = url.pathname;
    if (path === "/") {
      return new Response("Use /{filename} to access files in data/out/public");
    }

    const filePath = join(PUBLIC_DIR, path);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      // Handle Range requests
      const range = req.headers.get("Range");
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : file.size - 1;

        // Bun's slice is start-inclusive, end-exclusive?
        // Blob.slice(start, end).
        // HTTP Range is inclusive-inclusive.
        const chunk = file.slice(start, end + 1);

        return new Response(chunk, {
          status: 206, // Partial Content
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Range": `bytes ${start}-${end}/${file.size}`,
            "Content-Length": String(chunk.size),
            // Let Bun infer Content-Type or default to application/json
            "Content-Type": "application/json",
          },
        });
      }

      return new Response(file, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Listening on http://localhost:${server.port}`);
