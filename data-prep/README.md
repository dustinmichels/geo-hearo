# Data Prep

- The Go code in `crawl/` scrapes the Radio Garden API to get radio stations from different places.
- The Python scripts in `scripts/` prepare the data for the frontend.

Run all scripts in sequence with `./run_py.sh`.

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

Converts the enriched radio JSON into a fixed-width JSONL file (`data/out/public/data/stations.jsonl`) where every line is padded to the same byte length. Builds a compact index (`data/out/public/data/index.json`) mapping each country to a byte offset and station count, enabling O(1) HTTP range-request lookups by the frontend.

## Output

The final output in `data/out/public/data/` consists of two files:

- **`stations.jsonl`** -- All radio stations as fixed-width JSONL (one station per line, all lines the same byte length).
- **`index.json`** -- An index mapping each country to `{ start, count }` byte offsets into `stations.jsonl`, plus a `line_length` config value. The frontend uses this to fetch a random station for a given country with a single HTTP range request: `start + (randomIndex * line_length)`.

Additionally, `data/out/centers.geojson` provides country centroid points used by the frontend to place markers on the map.
