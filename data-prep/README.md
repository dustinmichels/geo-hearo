# Data Prep

- The Go code in `crawl/` scrapes Radio Garden and Radio Browser for radio stations and merges them into `crawl/out/output.csv`. See `crawl/README.md`.
- The Python scripts in `scripts/` turn that CSV plus Natural Earth and country data into the files the frontend loads.

Run the full pipeline (crawl, then all Python scripts) with `./run.sh`. Re-run only the Python steps against the existing crawl output with `./run_py.sh`.

## Scripts

### 01_load_data.py

Downloads Natural Earth GeoJSON datasets (country boundaries) from GitHub at 10m, 50m, and 110m scales and saves them to `data/ne/`.

### 02_centroids.py

Computes a representative centroid point for each country. Extracts the largest polygon (mainland) per country, reprojects to Equal Earth (EPSG:8857) for accurate centroid calculation, then converts back to WGS84. Outputs `data/out/centers.geojson` with country name and centroid geometry.

### 03_filter_radio.py

Loads the crawled radio station CSV (`crawl/out/output.csv`) and filters out stations that have no resolved stream URL or use insecure (non-HTTPS) streams. Outputs `data/out/all_radio_filtered.json`.

### 04_match_radio.py

Matches filtered radio stations to Natural Earth country records by name. Drops unmatched stations and countries with fewer than 5 stations. Enriches each station with country metadata (ADMIN, ISO codes, continent). Outputs `data/out/all_radio_with_countries.json`.

### 05_organize.py

Converts the enriched radio JSON into a fixed-width JSONL file (`data/out/stations.jsonl`) where every line is padded to the same byte length. Builds a compact index (`data/out/index.json`) mapping each country to a byte offset and station count, enabling O(1) HTTP range-request lookups by the frontend.

### 06_split_chunks.py

Splits `data/out/stations.jsonl` into `data/out/stations_<n>.jsonl` chunks of at most 45 MB each, never splitting a country across files. Rewrites `data/out/index.json` so each country's entry is `{ file, start, count }`, with `start` local to chunk `file`.

### country-details/01_scrape.py

Scrapes the World Population Review "Languages by Country" page and cross-references it with the Natural Earth 110m country dataset. Matches countries by name, producing a JSON file (`data/out/country_details.json`) with each country's languages plus ISO A3 code.

### country-details/02_get_pics.py

Fetches a representative landscape photo for each country from the Pexels API. Reads the country details JSON, searches Pexels for `"{country} landscape"`, downloads a medium-resolution JPEG, and writes an enriched JSON (`data/out/country_details_with_pics.json`) with Pexels metadata and local image paths. Requires a `PEXELS_API_KEY` environment variable.

## Output

`../copy.sh` copies these from `data/` into `frontend/public/`:

- **`data/out/stations_<n>.jsonl`** -- All radio stations as fixed-width JSONL (one station per line, all lines the same byte length), split into chunks.
- **`data/out/index.json`** -- Maps each country to `{ file, start, count }` (chunk number, byte offset within that chunk, station count), plus a `line_length` config value. The frontend fetches a random station for a country with a single HTTP range request on `stations_<file>.jsonl` at `start + (randomIndex * line_length)`.
- **`data/out/country_details_with_pics.json`** and **`data/out/country-pics/`** -- Country languages and photos.
- **`data/ne/ne_110m_admin_only.geojson`** -- Country boundaries for the map.

## Radio Sources

| Tag | Full Name                 | Website                 |
| --- | ------------------------- | ----------------------- |
| RG  | Radio Garden              | <https://radio.garden/> |
| RB  | Radiocast / Radio Browser | <https://radiocast.co/> |
