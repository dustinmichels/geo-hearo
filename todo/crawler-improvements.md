# Crawler improvements

Plan from a full test crawl on 2026-11-09. The crawl ran in a sandbox
(`/tmp/crawlrun`, Python steps in `/tmp/prep`), so nothing in the repo changed.
The crawler runs without errors, but it loses data in two quiet ways:

- **Pipeline safety:** a failed or partial run can overwrite good files, and
  `run_py.sh` / `copy.sh` delete current outputs before new ones exist.
- **Coverage:** about 1,500 Radio Garden stations a run get no stream URL
  because the crawler connects to each station's own server with Go's
  TLS stack. 955 of them are stations in the live data today.

Phases are in priority order. Phase 1 and items 6–8 are the recommended
first batch.

---

## Baseline (2026-11-09)

| Stage                                     | Radio Garden (RG)                | Radio Browser (RB)                                    | Merged                      |
| ----------------------------------------- | -------------------------------- | ----------------------------------------------------- | --------------------------- |
| Raw scrape                                | 38,335 (12,852/12,852 places OK) | 10,259 kept of 10,778 fetched (519 failed validation) | 48,594                      |
| After URL + name/city dedup               |                                  |                                                       | 46,325                      |
| After `03` (has URL, HTTPS only)          |                                  |                                                       | 39,092                      |
| After `04` (matched country, ≥5 stations) | 30,593                           | 7,862                                                 | **38,455** in 142 countries |
| Live (`frontend/public/data`)             | 29,659                           | 6,651                                                 | 36,310 in 143 countries     |

- Run time: about 45 min at `--threads=20`. RB finished in about 5 min. RG
  spent its last ~25 min resolving one German place's ~100 `*.radionetz.de`
  streams one at a time, each timing out at 15 s.
- Countries that would drop out (now under 5 stations): Vietnam, Uzbekistan,
  Tajikistan, Brunei, Burundi. New: Belize, Cambodia, Mongolia, Somalia.
  Cuba falls from 24 to 7.
- Live stations missing from the new run: 6,087. Of those, 4,507 are no longer
  listed by the source (normal churn), 555 were removed as duplicates, 52 now
  use `http://`, and **955 are RG stations the crawler failed to resolve**.

### Why RG stream resolution fails (1,484 failures)

| Reason                           | Count | Real problem?                                                                         |
| -------------------------------- | ----- | ------------------------------------------------------------------------------------- |
| TLS handshake failure            | 543   | No: Go 1.27 refuses older RSA-based TLS settings. Browsers and curl still play these. |
| Timeout                          | 201   | Mostly not: the station's server is slow or down; one host had 24.                    |
| HTTP 404                         | 160   | Yes, the stream is gone                                                               |
| Connection refused / reset / EOF | 148   | Mostly yes                                                                            |
| HTTP 401                         | 125   | Probably; may need a Referer header                                                   |
| HTTP 429                         | 92    | No: **radio.garden itself** rate-limiting us; there's no retry                        |
| HTTP 5xx                         | 114   | Often temporary                                                                       |
| Shoutcast `ICY` replies, other   | 47    | No: 28 are Shoutcast servers Go's HTTP client can't parse                             |
| HTTP 403                         | 34    | Mixed                                                                                 |
| Certificate error                | 9     | Yes                                                                                   |

Of the 955 live stations lost this way, 476 were TLS failures and 80 were 429s.

**TLS evidence:** `openssl s_client` against `backbonenetworks.streamguys1.com`
shows `TLSv1.2, Cipher AES256-GCM-SHA384`, an RSA-only key exchange. Go 1.27
removed the `tlsrsakex` opt-out: `GODEBUG=tlsrsakex=1` stops the program with
"removed GODEBUG … go-127". Setting `tls.Config.CipherSuites` explicitly to
include `TLS_RSA_WITH_AES_256_GCM_SHA384` makes the handshake succeed, tested
with a throwaway program.

---

## How to test changes safely

Never run a test crawl in `data-prep/crawl` itself:

```sh
mkdir -p /tmp/crawlrun
(cd data-prep/crawl && go build -o /tmp/crawlrun/crawl . && go build -o /tmp/crawlrun/merge ./merge)
(cd /tmp/crawlrun && ./crawl > crawl.log 2>&1)

# Python steps against the sandbox CSV (scripts use relative paths)
mkdir -p /tmp/prep/crawl/out && cp -r data-prep/scripts /tmp/prep/
cp /tmp/crawlrun/out/output.csv /tmp/prep/crawl/out/
cd /tmp/prep && for s in 01_load_data 02_centroids 03_filter_radio 04_match_radio 05_organize 06_split_chunks; do
  uv run --project ~/GitRepos/geo-hearo/data-prep scripts/$s.py
done
```

Compare `/tmp/prep/data/out/` with `frontend/public/data/` (counts per source
and country, and station IDs gained or lost) before running `copy.sh`. Item 13
automates this.

The live data in `frontend/public/data` is committed, so `git checkout` can
restore it.

---

## Phase 1: Data safety

### 1. Keep a source's previous file when its scraper fails

**Why:** `main.go` merges only `writtenFiles`. If one scraper returns an error,
`out/output.csv` is rebuilt from the other source alone, and the log shows
only `WARN: scraper errors`.

**Change** (`data-prep/crawl/main.go`):

1. When all scrapers run, merge `out/output_<name>.csv` for **every registered
   scraper** whose file exists, not just the ones written this run. A failed
   scraper never overwrites its CSV, so last run's file is still on disk.
2. For each source taken from a previous run, log the file's modification time
   loudly (`**** USING STALE radiobrowser data from 2026-10-01 ****`).
3. Exit non-zero when any scraper failed, so `run.sh` (`set -e`) stops before
   the Python steps.

**Verify:** make `radiobrowser.fetchPage` fail (point it at an invalid host) and
run in the sandbox. `output.csv` should still contain the RB rows from the
previous file, and the command should exit non-zero.

### 2. Refuse to save results that shrank sharply

**Why:** `radiogarden.Scrape` returns `output, nil` even when every place
fails. The empty result then replaces `output_radiogarden.csv`, and the merge
drops the whole source.

**Change:**

1. `radiogarden.Scrape`: return an error when fewer than 95% of places succeed
   (flag `--rg-min-place-success=0.95`). Keep logging the percentage.
2. `main.go`: before writing `out/output_<name>.csv`, count the rows in the
   existing file. If the new count is below `--min-ratio` (default `0.8`) of
   it, don't write. Log both counts and treat it as a scraper failure (item 1
   takes over). `--force` skips the check.
3. Apply the same check to `out/output.csv` after the merge.

**Verify:** temporarily cut the RG place list to 100 in the sandbox. The run
should refuse to save and leave the old CSV untouched.

### 3. Safe CSV writes

**Why:** `crawldata.WriteCSV` calls `os.Remove(path)` before writing. A crash or
full disk mid-write leaves neither the old file nor the new one. It also
creates files with `os.ModePerm` (0777).

**Change** (`data-prep/crawl/crawldata/merge.go`):

```go
func WriteCSV(stations []*Station, path string) error {
	tmp, err := os.CreateTemp(filepath.Dir(path), filepath.Base(path)+".*.tmp")
	if err != nil {
		return err
	}
	defer os.Remove(tmp.Name()) // no-op after a successful rename
	if err := gocsv.MarshalFile(stations, tmp); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	if err := os.Chmod(tmp.Name(), 0o644); err != nil {
		return err
	}
	return os.Rename(tmp.Name(), path)
}
```

**Verify:** the sandbox run writes the same row counts as before, and no
`*.tmp` files are left behind.

### 4. Timestamped backups with pruning

**Why:** backups are named `out/backup/output_<name>_<YYYY-MM-DD>.csv`. A second
run on the same day overwrites the backup of the good file with the first run's
output.

**Change** (`main.go`):

1. Use `time.Now().Format("2006-01-02T150405")` in backup names.
2. After backing up, keep only the newest 10 backups per prefix
   (`--keep-backups=10`).
3. Use `os.Rename`-style safety here too: copy to `.tmp`, then rename.

**Verify:** two sandbox runs in a row leave two distinct backups.

### 5. Python pipeline and `copy.sh`: build first, then swap

**Why:**

- `run_py.sh` starts with `rm -rf data` and has no `set -e`, so a failing
  script lets later scripts run on missing input.
- `copy.sh` runs `rm -rf frontend/public/data` and `rm -rf
  frontend/public/country-pics` before copying, also without `set -e`. A
  missing source file leaves the frontend with partial data.

**Change:**

1. `run_py.sh`: add `set -euo pipefail`. Replace `rm -rf data` with:

   ```sh
   [ -d data ] && mv data data.prev
   trap '[ -d data.prev ] && { rm -rf data; mv data.prev data; echo "restored previous data/"; }' ERR
   ...scripts...
   trap - ERR
   rm -rf data.prev
   ```

   This keeps the scripts' hard-coded `data/out` paths.

2. `copy.sh`: add `set -euo pipefail`, then:
   1. Check that every source file exists (`index.json`,
      `stations_*.jsonl`, `country_details_with_pics.json`,
      `ne_110m_admin_only.geojson`, `country-pics/`).
   2. Compare the new `index.json` with the current one: total station count
      (sum of `count`) and number of countries. Abort if stations drop below
      90% or countries drop by more than 3, unless `FORCE=1`. Print the
      countries added and removed.
   3. Copy into `frontend/public/data.new/`, then swap
      (`mv data data.old && mv data.new data && rm -rf data.old`). Do the same
      for `country-pics`.

**Verify:** in a scratch clone, delete `data-prep/data/out/index.json` and run
`copy.sh`. It should abort with `frontend/public/data` untouched. Then run
`run_py.sh` with a script forced to fail, and check that `data/` is restored.

---

## Phase 2: Coverage

### 6. Read RG's redirect instead of following it

**Why:** `GetStreamURL` follows radio.garden's redirect and connects to the
station's own server. Any problem with that server (TLS, slowness, Shoutcast
replies) counts as "no URL", even though radio.garden already gave us the URL.
`curl -I https://radio.garden/api/ara/content/listen/<id>/channel.mp3` returns
`302` with `location: <stream URL>`.

**Change** (`data-prep/crawl/radiogarden/client.go`, `get_stream_url.go`):

1. Use a separate client for this call with
   `CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }`.
2. On 301/302/307/308, return `resp.Location()` (this also handles relative
   locations). If radio.garden replies 200 itself, return the request URL as
   today. Treat 404 from radio.garden as "no stream". Other statuses are
   errors, which item 7 retries.

**Dependency:** this stops checking whether RG streams are alive, so dead
streams (the 404s, 401s and refused connections in the baseline table) would
reach the frontend. **Ship this together with item 8**, which brings back a
reachability check as a column instead of a drop.

**Expected:** about 543 TLS and 28 Shoutcast failures, plus most stream-server
timeouts, get a URL again. Resolution only talks to radio.garden, which is
much faster.

**Verify:** sandbox crawl. RG rows with an empty `channel_resolved_url` should
go from about 1,483 to around 100 or fewer (radio.garden 404s only). Spot-check
5 recovered URLs with `curl -I`.

### 7. Retry with backoff, plus a request-rate limit for radio.garden

**Why:** radio.garden returned 429 for 92 channels, and they were dropped (80
are in the live data). `GetPlaces` and `GetPlaceChannels` don't retry either.

**Change** (new `data-prep/crawl/radiogarden/retry.go`, used by all three API
calls):

1. `doWithRetry(ctx, client, req, attempts=4)`: retry on 429, 500, 502, 503,
   504 and network timeouts. Wait 1 s, 2 s, then 4 s, with ±20% jitter, and
   follow `Retry-After` when present. Rebuild the request on each attempt.
2. A shared request-rate limit for all radio.garden requests
   (`golang.org/x/time/rate`, flag `--rg-rps`). Start at 10 requests/s and
   adjust based on the 429 count in the run report (item 13). The rate
   radio.garden accepts is unknown, so start low.
3. Keep `--threads` as the cap on concurrent requests.

**Verify:** the sandbox run log shows retries, and the final count of 429
failures is 0.

### 8. Record reachability as a column instead of dropping stations

**Why:** RB's `validateBatch` permanently drops any station that fails one
5-second check (519 this run). After item 6, RG has no check at all.
Filtering belongs downstream, where the rule can change without re-crawling.

**Change:**

1. `crawldata.Station`: add `StreamOK string \`csv:"stream_ok"\`` (`yes`/`no`/ empty for unchecked) and`StreamCheckError string \`csv:"stream_check_error"\``.
2. New package `data-prep/crawl/streamcheck`: `Check(ctx, url) (ok bool, reason
   string)`, moved out of `radiobrowser.validateStreamURL` (GET with
   `Range: bytes=0-0`, don't follow redirects, 2xx/3xx = OK). Two attempts.
   Uses the transport from item 9.
3. `main.go`: after scraping, run the check on every merged station (both
   sources), using a worker pool (item 10).
4. `radiobrowser.Scrape`: remove `validateBatch` and keep every fetched
   station.
5. `crawldata.better`: when both records have a URL, prefer `stream_ok=yes`
   before comparing `Score`.
6. `03_filter_radio.py`: add a filter step `stream_ok != "no"`, logged via
   `filter_with_report`.
7. `04_match_radio.py` or `05_organize.py`: drop `stream_ok` and
   `stream_check_error` before writing. `05` serialises **every** column into
   `stations_*.jsonl`, and these columns are useless to the frontend.

**Verify:** the sandbox crawl shows how many stations get `stream_ok=no` and the
top reasons. The final count after `03` should be at least today's 39,092.

### 9. Make the reachability check behave like a browser

**Why:** item 8's check would otherwise mark the same 543 TLS failures and 28
Shoutcast servers as dead.

**Change** (`streamcheck` transport):

1. TLS: start from the IDs in `tls.CipherSuites()`, then add
   `TLS_RSA_WITH_AES_128_GCM_SHA256`, `TLS_RSA_WITH_AES_256_GCM_SHA384`,
   `TLS_RSA_WITH_AES_128_CBC_SHA` and `TLS_RSA_WITH_AES_256_CBC_SHA`. Set
   them on a cloned `http.DefaultTransport`'s `TLSClientConfig`. Tested
   working against `backbonenetworks.streamguys1.com`.
2. Shoutcast: when the error contains `malformed HTTP version "ICY"`, the
   server did answer, so count it as `ok`. Alternatively, read the status line
   over a raw connection and accept `ICY 200`. Start with the error-string
   match: it's simpler, and the case is rare (28 stations).
3. Keep the 5 s timeout, but use 2 attempts (item 8).

**Verify:** a throwaway Go program checks the 543 TLS-failure URLs from today's
log (`/tmp/crawlrun/crawl.log`, `handshake failure`). Most should now be OK.

### 10. One shared queue of channels, not one worker per place

**Why:** inside a place, `radiogarden.Scrape` resolves each channel one after
another. One place with ~100 slow streams kept the crawl running about 25 min
after everything else finished.

**Change:**

1. Stage A: a pool of `--threads` workers fetches `GetPlaceChannels` for each
   place and pushes `(place, channel)` jobs into a channel.
2. Stage B: a separate pool resolves the jobs (item 6, rate-limited by
   item 7).
3. Item 8's reachability pool also limits connections per host (2
   concurrent) so one dead host can't fill the pool.

**Verify:** sandbox crawl run time (baseline about 45 min). Expect it to be
limited by `--rg-rps` instead of the slowest place.

---

## Phase 3: Robustness and visibility

### 11. Panic guards

`radiogarden/scraper.go` indexes `strings.Split(channel.Page.URL, "/")[3]` and
`place.Geo[0]`/`place.Geo[1]` without checking lengths. One malformed API
record panics a goroutine and kills the whole crawl. Check lengths, skip the
record, and count it as a logged warning.

### 12. Cancellation and an overall deadline

Both `Scrape` methods ignore `ctx` (`_ context.Context`). Use
`http.NewRequestWithContext` everywhere, make `main` use
`signal.NotifyContext(ctx, os.Interrupt)`, and add a `--timeout` flag
(default 2 h). On Ctrl-C, nothing is written (Phase 1 keeps old files).

### 13. Run report and comparison with the previous run

Write `out/report_<timestamp>.json` at the end of each run:

- stations per source (raw, after dedup) and per `country`;
- RG place success rate;
- failure counts by reason (the categories in the baseline table);
- 429 count and retries used;
- comparison with the previous report: stations gained and lost per source,
  and countries whose count crossed the 5-station minimum (`MIN_STATIONS` in
  `04_match_radio.py`).

Print a short summary to the log. Items 1, 2 and 5 can read the same numbers.

### 14. Bump `go.mod`

`go.mod` says `go 1.19`, but `mise.toml` pins Go 1.27, so behaviour defaults
follow 1.19 while running on 1.27 (and `tlsrsakex` is gone either way). Set
`go 1.27`, run `go mod tidy`, and run one sandbox crawl to confirm nothing else
changed.

### 15. Stop one long record from inflating every line

`05_organize.py` pads every line to the longest record + 16 bytes. The live
data has `line_length` 6,742 because of one RB `channel_resolved_url` of
5,292 characters (station `20396ef5-f4ba-4df8-a631-9bdec7e85451`). That makes
the chunks 233 MB instead of about 61 MB. Today's longest record is 1,635
bytes (an RB `tags` field of 790 characters). The 99th percentile is 977 bytes.

1. In `03_filter_radio.py`, drop stations whose `channel_resolved_url` is
   longer than 512 characters, and cut `tags` to 200 characters.
2. In `05_organize.py`, print the 5 longest records with their longest field,
   so outliers show up in the log.
3. Optional: use `json.dumps(..., ensure_ascii=False)`. Non-ASCII names
   currently become 6-byte `\uXXXX` escapes. Check that the frontend reads the
   ranges as raw bytes and decodes UTF-8 before changing this.

### 16. Tests

In `data-prep/crawl`, using Go's standard `testing` package:

- `crawldata`: `better` (a record with a URL beats one without, then `Score`,
  then `stream_ok` after item 8), `DeduplicateByURL`,
  `DeduplicateByNameCity` (empty name or city is kept and not merged).
- `radiogarden.GetStreamURL` against an `httptest.Server` returning 302 with a
  `Location` header (item 6) and 429-then-200 (item 7).
- `streamcheck`: a TLS test server limited to
  `TLS_RSA_WITH_AES_256_GCM_SHA384` (item 9).

Add a `mise` task `crawl:test` (`go test ./...` in `data-prep/crawl`).

---

## Decisions needed

- **RB coverage.** `has_geo_info=true` keeps 10,778 of 52,545 RB stations.
  Dropping it could add a lot of RB stations, but `useMapStations.ts` draws a
  dot per station using `geo_lat`/`geo_lon`, so stations without coordinates
  would need a fallback (e.g. the country centre from `02_centroids.py`) or
  would have to be hidden on the map. Needs a product decision.
- **Source labels.** The crawler now writes `RG`/`RB`, while the live data and
  `crawl/README.md` use `radiogarden`/`radiobrowser`. Nothing downstream reads
  `source`. Pick one and update the README to match.
- **Thresholds.** `--min-ratio 0.8`, place success `0.95`, `copy.sh` 90%
  stations / 3 countries, and `--rg-rps 10` are starting guesses. Adjust after
  two or three runs using the report from item 13.

## After a refresh

- `frontend/src/views/About.vue` says "over 36,000 stations … from 143
  countries". Update it to the new numbers.
- Add a `CHANGELOG.md` entry with the before and after counts.
