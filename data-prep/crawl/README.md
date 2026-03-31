# Data Prep - Crawl

Scrapes radio station data from multiple sources. Running all scrapers together automatically merges results into a single deduplicated CSV.

## Build

```sh
go build -o crawl . 
go build -o merge ./merge/
```

## Radio Garden: User-Agent

The Radio Garden scraper sends a Chrome User-Agent by default. To override it:

```sh
export RG_USER_AGENT="Mozilla/5.0 ..."
./crawl --scrapers=radiogarden
```

## Typical workflow

### Run everything at once

Scrapes all sources concurrently, writes per-source CSVs, then automatically merges into `out/output.csv`:

```sh
./crawl
```

### Run scrapers separately, then merge manually

```sh
./crawl --scrapers=radiogarden
./crawl --scrapers=radiobrowser
./merge
```

This is useful when you want to re-scrape only one source without re-running the other.

### Configure concurrency

```sh
./crawl --threads=20
```

## Output files

| File | Description |
|------|-------------|
| `out/output_radiogarden.csv` | Raw Radio Garden results |
| `out/output_radiobrowser.csv` | Raw Radio Browser results |
| `out/output.csv` | Merged, deduplicated output (produced by `./crawl` or `./merge`) |

Previous runs are backed up to `out/output_<name>_previous.csv` before each new run.

## Merge options

```sh
./merge --inputs=out/output_radiogarden.csv,out/output_radiobrowser.csv
./merge --output=out/output.csv
```

Two dedup passes are applied in order:

1. **By `channel_resolved_url`** — stations sharing the same stream URL are collapsed; the record with the most populated fields is kept.
2. **By name + city** — stations sharing the same lowercased, trimmed `channel_name` and `place_name` are collapsed; again the more complete record is kept.

## Output columns

| Column | Description |
|--------|-------------|
| `source` | Which scraper produced this row (`radiogarden` or `radiobrowser`) |
| `channel_id` | Unique station identifier |
| `channel_name` | Station name |
| `channel_resolved_url` | Final stream URL (dedup key) |
| `country` | Country name string (used by downstream pipeline) |
| `country_code` | ISO 3166-1 alpha-2 code (Radio Browser only) |
| `geo_lat` / `geo_lon` | Station coordinates |
| `place_name` | City or state (best available) |
| `tags` | Comma-separated genre/format tags (Radio Browser only) |
| `homepage` | Station website URL |
| `language` | Broadcast language (Radio Browser only) |

## Adding a new scraper

1. Create a new package under `crawl/<name>/` implementing `Scrape(_ context.Context, threads int) ([]*Station, error)` and `Name() string`
2. Add an adapter in `main.go` (same pattern as `radiogardenAdapter` / `radiobrowserAdapter`)
3. Register it in the `registry` map in `main.go`
