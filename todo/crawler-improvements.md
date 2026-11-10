# Crawler improvements

Plan from a full test crawl on 2026-11-09. The crawl ran in a sandbox
(`/tmp/crawlrun`, Python steps in `/tmp/prep`), so nothing in the repo changed.
The crawler runs without errors, but it loses data in two quiet ways:

- **Pipeline safety:** a failed or partial run can overwrite good files,
  `run_py.sh` / `copy.sh` delete current outputs before new ones exist, and
  several Python scripts exit `0` on error.
- **Coverage:** about 1,500 Radio Garden stations a run get no stream URL
  because the crawler connects to each station's own server with Go's
  TLS stack, and following redirect chains bakes short-lived CDN tokens into
  resolved URLs. 955 of the failed stations are in the live data today.

Phases are in priority order. The recommended first batch is Phase 1, item
16, items 6–10, and item 17's column whitelist. Item 16 must land before item
9 is measured, because it changes Go's TLS and HTTP defaults. Item 8 depends on
item 9's transport and item 10's per-host limit, and item 6 must ship with
item 8's Content-Type check. Before deploying any refresh, see "Before and
after a refresh" (the daily challenge reshuffles when the country set changes).

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

| Reason                           | Count | Real problem?                                                                                                   |
| -------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------- |
| TLS handshake failure            | 543   | No: Go 1.27 refuses older RSA-based TLS settings. Browsers and curl still play these.                           |
| Timeout                          | 201   | Mostly not: the station's server is slow or down; one host had 24.                                              |
| HTTP 404                         | 160   | Mostly yes (82 are in live data, meaning radio.garden redirected to a now-404 stream server)                    |
| Connection refused / reset / EOF | 148   | Mostly yes                                                                                                      |
| HTTP 401                         | 125   | Probably; may need a Referer or browser User-Agent header                                                       |
| HTTP 429                         | 92    | No: **destination stream hosts** rate-limiting us (89 on `*.streamabc.net`, 3 on `listen.vdfm.ru:8000`)         |
| HTTP 5xx                         | 114   | Often temporary                                                                                                 |
| Shoutcast `ICY` replies, other   | 47    | No: 28 are Shoutcast servers Go's HTTP client can't parse                                                       |
| HTTP 403                         | 34    | Mixed                                                                                                           |
| Certificate error                | 9     | Yes                                                                                                             |

Of the 955 live stations lost this way, 476 were TLS failures and 80 were 429s.

- **TLS evidence:** `openssl s_client` against `backbonenetworks.streamguys1.com`
  shows `TLSv1.2, Cipher AES256-GCM-SHA384`, an RSA-only key exchange. Go 1.27
  removed the `tlsrsakex` opt-out: `GODEBUG=tlsrsakex=1` stops the program with
  "removed GODEBUG … go-127". Setting `tls.Config.CipherSuites` explicitly to
  include `TLS_RSA_WITH_AES_256_GCM_SHA384` makes the handshake succeed, tested
  with a throwaway program.
- **429 evidence:** `GetStreamURL` logged `status not OK: 429` after following
  `radio.garden`'s `302` redirect without logging `resp.Request.URL.Host`.
  Cross-referencing the 92 channel IDs against the live data and
  `output_radiogarden.csv` shows 89 are German stations (`bigFM` in Stuttgart,
  `Radio Regenbogen` in Mannheim, etc.) on `audiotainment-sw.streamabc.net` and
  `sunsl.streamabc.net`, hit dozens of times back-to-back by one place worker,
  and 3 are on `listen.vdfm.ru:8000`. `radio.garden` itself returned 0 429s
  across 12,852 place requests.
- **Redirect / expiring-token evidence:** following the full redirect chain in
  `GetStreamURL` (and using `url_resolved` unconditionally in RB) replaces
  stable redirector URLs (`stream.radiojar.com`, `rcs.revma.com`,
  `dispatcher.rndfnk.com`, `amperwave.net`) with single-use CDN edge URLs
  containing short-lived tokens (`?rj-ttl=5&rj-tok=...` on 756 RG rows,
  `?token=...` on 139 `rndfnk.com` rows, `?session-id=...` on 50
  `amperwave.net` rows). ~240 of those `radiojar` redirects also downgraded
  from `https://` to `http://` edge nodes and were dropped by
  `03_filter_radio.py`; the remaining 515 are in `frontend/public/data/` today
  with expired 5-second tokens.

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
cd /tmp/prep && for s in 01_load_data 03_filter_radio 04_match_radio 05_organize 06_split_chunks; do
  uv run --project ~/GitRepos/geo-hearo/data-prep scripts/$s.py
done
```

Compare `/tmp/prep/data/out/` with `frontend/public/data/` (counts per source
and country, and station IDs gained or lost) before running `copy.sh`. Item 15
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
   scraper** (in a fixed sorted order, not map iteration order) whose file
   exists, not just the ones written this run. A failed scraper never
   overwrites its CSV, so last run's file is still on disk.
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
2. `main.go`: before writing `out/output_<name>.csv`, count the rows with a
   non-empty `channel_resolved_url` in the existing file and in the new
   result. Counting all rows is not enough: if `radio.garden` blocks the
   `/listen` endpoint, every place still succeeds and every row is still
   written, just with an empty URL. If the new count is below `--min-ratio`
   (default `0.8`) of the old one, don't write. Log both counts and treat it as
   a scraper failure (item 1 takes over). `--force` skips the check.
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

**Why:** backups are named `out/backup/output_<name>_<YYYY-MM-DD>.csv` and run
at startup before scraping begins. A second run on the same day overwrites the
backup of the good file, and a failed run still rotates backups.

**Change** (`main.go`):

1. Back up an existing CSV right before overwriting it (after scraping and the
   shrink check in item 2 pass), not at startup.
2. Use `time.Now().Format("2006-01-02T150405")` in backup names, and name the
   merged backup `output_merged_<timestamp>.csv` (today it is
   `output_<date>.csv`, which shares the `output_` prefix with
   `output_radiogarden_…` and `output_radiobrowser_…`).
3. After backing up, keep only the newest 10 backups per source
   (`--keep-backups=10`). Match each source's backups with an exact pattern
   (`^output_<name>_\d{4}-\d{2}-\d{2}T\d{6}\.csv$`), not a prefix glob.
4. Use `os.Rename`-style safety here too: copy to `.tmp`, then rename.

**Verify:** two sandbox runs in a row leave two distinct backups; a failed run
creates no new backup.

### 5. Python pipeline and `copy.sh`: exit non-zero on error, decouple country pics, and swap safely

**Why:**

- `01_load_data.py`, `04_match_radio.py`, `05_organize.py`,
  `country-details/01_scrape.py`, and `country-details/02_get_pics.py` catch
  errors or missing inputs and `return` (exit code `0`), so `set -e` / `trap
  ERR` in `run_py.sh` would never fire.
- `run_py.sh` starts with `rm -rf data` (wiping cached Natural Earth files and
  `country-pics/`) and runs `country-details/01_scrape.py` and
  `02_get_pics.py` on every run. Without `PEXELS_API_KEY`, `02_get_pics.py`
  produces no `country_details_with_pics.json` or `country-pics/`; with it, it
  re-downloads 168 Pexels photos and overwrites manually curated images in
  `frontend/public/country-pics/`.
- `01_load_data.py` downloads 5 Natural Earth GeoJSONs (~70 MB) on every run
  even though only `110m` is ever read, and `02_centroids.py` (`centers.geojson`)
  is unused.
- `copy.sh` runs `rm -rf frontend/public/data` and `rm -rf
  frontend/public/country-pics` before copying, without `set -e`.

**Change:**

1. Python scripts (`01_load_data.py`, `04_match_radio.py`, `05_organize.py`,
   `country-details/01_scrape.py`, `country-details/02_get_pics.py`): replace
   `return` on error with `sys.exit(1)` (or let exceptions propagate).
2. `01_load_data.py`: only download the `110m` dataset (producing
   `ne_110m_admin_0_countries.geojson` and `ne_110m_admin_only.geojson`), and
   skip downloading if both files already exist in `data/ne/` unless `--force`
   is passed.
3. Separate `country-details` from `run_py.sh`:
   - Move `country-details/01_scrape.py` and `02_get_pics.py` to a separate
     task (`mise run prep:countries` / `run_countries.sh`) so station refreshes
     don't require `PEXELS_API_KEY` or overwrite curated country photos.
   - Write their outputs to `data/countries/` (`country_details.json`,
     `country_details_with_pics.json`, `country-pics/`) instead of `data/out/`.
     Otherwise step 4's swap of `data/out` deletes them on every station
     refresh, and `copy.sh --with-countries` finds nothing unless
     `prep:countries` ran after the last `prep`.
   - Remove unused `02_centroids.py` from `run_py.sh` (unless needed for the RB
     fallback in "Decisions needed").
4. `run_py.sh`: add `set -euo pipefail` and only swap `data/out` (keeping
   `data/ne` cached):

   ```sh
   rm -rf data/out.prev
   [ -d data/out ] && mv data/out data/out.prev
   trap '[ -d data/out.prev ] && { rm -rf data/out; mv data/out.prev data/out; echo "restored previous data/out/"; }' ERR
   mkdir -p data/out
   ...scripts 01, 03, 04, 05, 06...
   trap - ERR
   rm -rf data/out.prev
   ```

5. `copy.sh`: add `set -euo pipefail`, then:
   1. Check that the station and boundary files exist (`data-prep/data/out/index.json`,
      at least one `data-prep/data/out/stations_*.jsonl`,
      `data-prep/data/ne/ne_110m_admin_only.geojson`, and the existing
      `frontend/public/data/country_details_with_pics.json`).
   2. Compare the new `index.json` with `frontend/public/data/index.json`:
      total station count (sum of `count`) and number of countries. Abort if
      stations drop below 90% or countries drop by more than 3, unless
      `FORCE=1`. Print the countries added and removed.
   3. Stage into a clean `frontend/.data.new/`, **outside** `public/` (Vite
      copies everything in `public/` into `dist`, so a leftover `data.new/` or
      `data.old/` there would ship ~233 MB to Netlify). Copy the new
      `ne_countries.geojson`, `stations_*.jsonl`, and `index.json`, and keep
      `frontend/public/data/country_details_with_pics.json` unless
      `--with-countries` is passed. Then swap:
      `mv frontend/public/data frontend/.data.old && mv frontend/.data.new frontend/public/data && rm -rf frontend/.data.old`.
      Add a `trap` that removes `frontend/.data.new` and moves
      `frontend/.data.old` back if the swap fails partway. Two `mv`s are not
      atomic, but deploys go through git, so what matters is that a failure
      leaves a consistent tree.
   4. Only update `frontend/public/country-pics` when `--with-countries` is
      passed and `data-prep/data/countries/country-pics` exists.

**Verify:** in a scratch clone, delete `data-prep/data/out/index.json` and run
`copy.sh`. It should abort with `frontend/public/data` and
`frontend/public/country-pics` untouched. Then run `run_py.sh` with a script
forced to fail (including a missing input file in `04` or `05`), and check that
`data/out/` is restored.

---

## Phase 2: Coverage

### 6. Keep canonical redirect URLs in RG and RB instead of following to edge tokens

**Why:**

- `radiogarden.GetStreamURL` follows `radio.garden`'s redirect and connects to
  the station's own server. Any problem with that server (TLS, slowness,
  Shoutcast replies, per-host 429s) counts as "no URL", even though
  `radio.garden` already gave us the URL (`curl -I
  https://radio.garden/api/ara/content/listen/<id>/channel.mp3` returns `302`
  with `location: <stream URL>`).
- Following the full redirect chain also turns redirector URLs
  (`stream.radiojar.com`, `rcs.revma.com`, `dispatcher.rndfnk.com`,
  `amperwave.net`) into single-use edge URLs with expiring tokens (`rj-ttl=5`,
  `rj-tok=`, `token=`, `session-id=`) or `http://` edge redirects.
- `radiobrowser` has the same issue when it uses `url_resolved` unconditionally
  instead of `url`.

**Change:**

1. `data-prep/crawl/radiogarden/client.go`, `get_stream_url.go`:
   - Use a separate client for `GetStreamURL` with
     `CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }`.
   - On 301/302/307/308, return `resp.Location()` (handles relative locations).
     If `radio.garden` replies 200 itself, return the request URL as today.
     Treat 404 from `radio.garden` as "no stream". Other statuses are errors,
     which item 7 retries.
2. `data-prep/crawl/radiobrowser/scraper.go`:
   - Add `URL string \`json:"url"\`` to `apiStation` (`url` is already in
     `fields`).
   - Prefer `a.URL` over `a.URLResolved` when `a.URL` starts with `https://`,
     is not a playlist (path does not end in `.pls`, `.m3u`, `.m3u8`, `.asx`,
     or `.xspf`), and `a.URLResolved` is empty, starts with `http://`, or
     contains ephemeral token parameters (`rj-tok=`, `rj-ttl=`, `token=`,
     `session-id=`). RB's `url` is the URL users submitted and is often a
     playlist; `url_resolved` is the stream inside it. An https playlist that
     wraps an http stream is exactly the case this rule would otherwise pick,
     and `<audio>` can't play it. Item 8's Content-Type check is the backstop
     for playlists without a file extension.

**Dependency:** stopping at `radio.garden`'s `302` means `GetStreamURL` no
longer checks whether RG streams are alive, so dead streams would reach the
frontend. **Ship this together with items 8–10**, which run a browser-like
reachability check across all stations before merging.

**Dedup check:** RG and RB share 1,872 resolved URLs in the baseline run, and
URL dedup collapses those pairs. In a sample of 20, `radio.garden`'s `302`
`Location` exactly matched the current resolved URL in all 20, so
single-hop pairs still collapse. Only redirector chains (radiojar, revma) will
stop matching RB's `url_resolved` and rely on name+city dedup. Note that
`radio.garden` answers `HEAD` with `403`; use `GET`.

**Expected:** about 543 TLS, 89 `*.streamabc.net` 429s, and 28 Shoutcast
failures, plus most stream-server timeouts, get a URL again, and ~900
token-bearing URLs keep their stable entry-point URL. Resolution only talks to
`radio.garden`, which is much faster.

**Verify:** sandbox crawl. RG rows with an empty `channel_resolved_url` should
go from 1,484 to around 100 or fewer (`radio.garden` 404s only), and `rj-ttl=`
count in `output_radiogarden.csv` should drop from 756 to near 0.

### 7. Retry with backoff for scraper API calls

**Why:** `GetPlaces`, `GetPlaceChannels`, `GetStreamURL`, and
`radiobrowser.fetchPage` have no retry on transient 429/5xx or network hiccups.

**Change** (new `data-prep/crawl/radiogarden/retry.go`, used by all three RG API
calls, plus retry in `radiobrowser.fetchPage`):

1. `doWithRetry(ctx, client, req, attempts=4)`: retry on 429, 500, 502, 503,
   504 and network timeouts. Wait 1 s, 2 s, then 4 s, with ±20% jitter, and
   follow `Retry-After` when present. Rebuild the request on each attempt.
2. Optional request-rate limiter for `radio.garden` (`golang.org/x/time/rate`,
   flag `--rg-rps`, default `0` = unthrottled, bounded by `--threads=20`). Do
   not default `--rg-rps` to `10`: RG makes 51,187 requests (12,852 places +
   38,335 channels), which at 10 req/s would enforce an 85-minute floor, and
   `radio.garden` produced zero 429s in the baseline run.

**Verify:** unit test against an `httptest.Server` returning 429/503 then 200.

### 8. Record reachability as a column (before merging) instead of dropping stations

**Why:** RB's `validateBatch` permanently drops any station that fails one
check during scraping (519 this run). After item 6, RG has no reachability
check during scraping. And running the check **before** `crawldata.Merge` lets
deduplication prefer a working stream over a dead one and writes `stream_ok`
into `out/output_<name>.csv` so standalone `./merge` and item 1's fallback have
it.

**Change:**

1. `crawldata.Station`: add `StreamOK string \`csv:"stream_ok"\`` (`yes`/`no`/
   empty for unchecked) and
   `StreamCheckError string \`csv:"stream_check_error"\``.
2. New package `data-prep/crawl/streamcheck`:
   - `Check(ctx, url) (ok bool, reason string)`, using the browser-like
     transport from item 9.
   - Follow redirects up to 5 hops (preserving `Range: bytes=0-0` and Chrome
     `User-Agent` across hops) without mutating `Station.StreamURL`, so
     redirectors (`streamtheworld`, `radiojar`, `zeno.fm`, `rndfnk`) are tested
     all the way to the audio server.
   - If any redirect hop downgrades to `http://`, return `false, "redirect to http"`
     (browsers and WKWebView block mixed-content audio redirects).
   - Close `resp.Body` immediately once response headers arrive. `ok` requires
     `200`/`206` (or Shoutcast `ICY 200` from item 9) **and** an audio
     response: `Content-Type` `audio/*` (except the playlist types below),
     `application/ogg`, `application/octet-stream` with `icy-*` headers, or
     any `icy-*`/`ice-*` header. Return `false` with reason `html` for
     `text/html`, `playlist` for `audio/x-scpls` / `audio/x-mpegurl` /
     `application/x-mpegurl` / `text/plain`, and `hls` for
     `application/vnd.apple.mpegurl` (see "Decisions needed"). Without this,
     landing pages and playlists count as `ok`, and step 5 makes them win
     dedup over a working direct stream.
   - Up to 2 attempts on network timeouts/5xx, and retry on `429` (with
     `Retry-After` / backoff) so hosts like `*.streamabc.net` aren't marked dead.
3. `main.go`: after `Run()` finishes and **before** writing
   `out/output_<name>.csv` and running `crawldata.Merge`:
   - Collect all unique `https://` `StreamURL`s across the scraped results
     (skip empty and `http://` URLs; `03_filter_radio.py` drops the ~5,950
     `http://` rows anyway).
   - Check those unique URLs using the worker pool (item 10.3) and populate
     `StreamOK` / `StreamCheckError` on every matching `Station`.
   - Also check rows taken from a previous run's file (item 1). Their
     `stream_ok` is stale, or empty for files written before this item, and
     `03` keeps empty values. Write the fresh values into the merged
     `output.csv` only; leave the stale per-source file untouched.
   - Ship item 17's column whitelist in the same batch. Otherwise `03`/`04`
     pass `stream_ok` and `stream_check_error` through into the JSONL.
4. `radiobrowser.Scrape`: remove `validateBatch` and keep every fetched
   station.
5. `crawldata.better`: when both records have an `https://` URL, prefer
   `stream_ok=yes` over `stream_ok!=yes` before comparing `Score`.
6. `03_filter_radio.py`: add a filter step `stream_ok != "no"`, logged via
   `filter_with_report`.

**Verify:** the sandbox crawl populates `stream_ok` in both
`output_<name>.csv` and `output.csv`, logs how many stations get
`stream_ok=no` and the top reasons, and produces more than today's 39,092
stations after `03`.

### 9. Make the reachability check behave like a browser

**Why:** item 8's check would otherwise mark the same 543 TLS failures, 28
Shoutcast servers, and `Go-http-client`-blocked streams as dead.

**Change** (`streamcheck` transport and request):

1. TLS: start from the IDs in `tls.CipherSuites()`, then add
   `TLS_RSA_WITH_AES_128_GCM_SHA256`, `TLS_RSA_WITH_AES_256_GCM_SHA384`,
   `TLS_RSA_WITH_AES_128_CBC_SHA` and `TLS_RSA_WITH_AES_256_CBC_SHA`. Set
   them on a cloned `http.DefaultTransport`'s `TLSClientConfig`. Tested
   working against `backbonenetworks.streamguys1.com`.
2. Transport connection hygiene: set `DisableKeepAlives: true` on the
   `streamcheck` transport so checking ~40,000 hosts and closing unread
   streaming bodies doesn't leave thousands of idle sockets open.
3. Headers: set the Chrome `User-Agent` header (missing in RB's current
   `validateStreamURL`).
4. Shoutcast: when the error contains `malformed HTTP version "ICY"`, the
   server did answer, so count it as `ok`.
5. Keep a 5 s per-attempt timeout with 2 attempts (item 8).
6. Check the target clients, not only curl. The iOS app has no
   `NSAppTransportSecurity` exceptions (`frontend/ios`), and App Transport
   Security requires forward-secret ciphers by default, media loads included
   (that is what `NSAllowsArbitraryLoadsForMedia` exists to relax). Play a few
   RSA-only stations (e.g. `backbonenetworks.streamguys1.com`) in the iOS build
   and in Chrome. If they fail there, record whether RSA key exchange was
   needed and set `stream_ok=no` with reason `legacy_tls` instead of marking
   them `ok`, or add a scoped ATS exception.

**Verify:** a throwaway Go program checks the 543 TLS-failure URLs from today's
log (`/tmp/crawlrun/crawl.log`, `handshake failure`). Most should now be OK.

### 10. Shared channel queue for RG, and per-host concurrency for `streamcheck`

**Why:**

- Inside a place, `radiogarden.Scrape` resolves each channel one after another.
  One German place with ~100 slow streams kept the crawl running ~25 min after
  everything else finished.
- When one place has 60+ channels on the same stream host (`*.streamabc.net`),
  checking them concurrently triggers HTTP 429s or lets one dead host (`*.radionetz.de`)
  stall workers.

**Change:**

1. `radiogarden.Scrape` Stage A: a pool of `--threads` workers fetches
   `GetPlaceChannels` for each place and pushes `(place, channel)` jobs into a
   queue.
2. `radiogarden.Scrape` Stage B: a pool of `--threads` workers resolves
   `GetStreamURL` (item 6) from the shared queue.
3. `streamcheck` pool (item 8): shuffle the unique URL slice before checking
   (so same-city stations on the same host are spread across the run) and limit
   concurrent in-flight checks per host to 2 (e.g. a per-host semaphore map).

**Verify:** sandbox crawl run time (baseline about 45 min). RG + RB should
finish without a long single-place tail. `streamcheck` is bounded by the
busiest hosts: `listen.radioking.com` (314 live stations) and
`playerservices.streamtheworld.com` (310) need ~155 rounds each at 2 per host,
which can take many minutes if those hosts are slow, so measure rather than
assume 10–15 min. `429` failures in `streamcheck` should drop to ~0. The
per-host limit applies to the first URL's host only, not to redirect targets.

### 11. Match RB `country_code` and missing country name variants in `04_match_radio.py`

**Why:** `04_match_radio.py` matches stations to Natural Earth shapes only by
lowercased `country` name, ignoring RB's ISO-2 `country_code`. In the baseline
run, this dropped **58 valid RB stations** in countries already in the dataset:
`Bolivarian Republic Of Venezuela` (`VE`, 24), `Taiwan, Republic Of China`
(`TW`, 11), `Republic Of North Macedonia` (`MK`, 11), `The Republic Of Moldova`
(`MD`, 7), and `Coted Ivoire` (`CI`, 5), plus 6 RG stations in `New Calédonia`
(accented `é`). It also groups `MIN_STATIONS` by `ISO_A2_EH` (which is `"-99"`
for both Northern Cyprus and Somaliland in Natural Earth 110m) and leaves
`ISO_A3` as `"-99"` for France, Norway, and Kosovo.

**Change** (`data-prep/scripts/04_match_radio.py`):

1. Build a secondary lookup from `ne["ISO_A2_EH"]` (excluding `"-99"`) and use
   `radio["country_code"]` as a fallback when the name lookup returns `NaN`.
2. Add `"new calédonia": "new caledonia"` and `"myanmar (burma)": "myanmar"` to
   `COUNTRY_NAME_OVERRIDES` (or strip diacritics with `unicodedata.normalize`
   when building and querying the name lookup).
3. Group by `ADMIN` (not `ISO_A2_EH`) when filtering `MIN_STATIONS`, matching
   `05_organize.py` and the frontend. Northern Cyprus and Somaliland currently
   pass the minimum together as one `"-99"` group; split by `ADMIN`, one or
   both may drop out, which changes the country set (see "Before and after a
   refresh").
4. When `ISO_A3 == "-99"`, fall back to `ADM0_A3` so France (`FRA`), Norway
   (`NOR`), and Kosovo (`KOS`) get valid ISO-3 codes.

**Verify:** running `04_match_radio.py` against the sandbox data recovers the
58 RB stations and matches `New Calédonia` to `New Caledonia`.

---

## Phase 3: Robustness, determinism, and size

### 12. Panic guards

`radiogarden/scraper.go` indexes `strings.Split(channel.Page.URL, "/")[3]` and
`place.Geo[0]`/`place.Geo[1]` without checking lengths. One malformed API
record panics a goroutine and kills the whole crawl. Check lengths, skip the
record, and count it as a logged warning.

### 13. Cancellation and an overall deadline

Both `Scrape` methods ignore `ctx` (`_ context.Context`). Use
`http.NewRequestWithContext` everywhere, make `main` use
`signal.NotifyContext(ctx, os.Interrupt)`, and add a `--timeout` flag
(default 1 h). On Ctrl-C, nothing is written (Phase 1 keeps old files).

### 14. Deterministic deduplication and station order

**Why:**

- `crawldata.DeduplicateByURL` and `DeduplicateByNameCity` iterate over Go
  `map[string]*Station` in random order. When two stations tie on `Score`,
  whichever came first in `DeduplicateByURL`'s random map iteration wins in
  `DeduplicateByNameCity`, and `output.csv` row order changes every run.
- `05_organize.py` uses `radio.sort_values("ADMIN")` (unstable quicksort with
  no secondary key), so station order within each country changes on every
  run—which changes the 5 stations picked for the Daily Challenge (see
  `todo/maybe/daily-challenge-data-stability.md`).

**Change:**

1. `crawldata.better`: when `stream_ok` and `Score` are tied, break ties
   deterministically by `Source` (`RB` vs `RG`), then `ChannelID`, then
   `StreamURL`.
2. `DeduplicateByURL` / `DeduplicateByNameCity`: sort the resulting slice by
   `(Source, ChannelID, StreamURL)` before returning.
3. `05_organize.py`: sort with
   `radio.sort_values(["ADMIN", "channel_id"], kind="mergesort")`.

**Verify:** running `./merge` and `05_organize.py` twice on the same inputs
produces byte-identical `output.csv` and `stations_*.jsonl`.

### 15. Run report and comparison with the previous run

Write `out/report_<timestamp>.json` at the end of each run:

- stations per source (raw, after dedup) and per `country`;
- RG place success rate;
- `streamcheck` failure counts by reason (the categories in the baseline table);
- 429 count and retries used;
- comparison with the previous report: stations gained and lost per source,
  and countries whose count crossed the 5-station minimum (`MIN_STATIONS` in
  `04_match_radio.py`).

Print a short summary to the log. Items 1, 2 and 5 can read the same numbers.

### 16. Bump `go.mod` (do this before item 9)

`go.mod` says `go 1.19`, but `mise.toml` pins Go 1.27, so the GODEBUG defaults
follow 1.19. `go list -f '{{.DefaultGODEBUG}}' .` shows these looser defaults
in effect today, which all flip with `go 1.27`:

| Setting                | Now | After | Effect on stream checks                                     |
| ---------------------- | --- | ----- | ----------------------------------------------------------- |
| `tlssha1`              | 1   | 0     | Rejects SHA-1 handshake signatures (old stream servers)     |
| `x509negativeserial`   | 1   | 0     | Rejects certificates with negative serial numbers           |
| `rsa1024min`           | 0   | 1     | Rejects RSA keys under 1024 bits                            |
| `httplaxcontentlength` | 1   | 0     | Stricter parsing of quirky Icecast/Shoutcast responses      |
| `tlsmlkem`             | 0   | 1     | Larger ClientHello (ML-KEM key share)                       |

The baseline (including the 543 TLS failures) was measured with the looser
settings. Set `go 1.27`, run `go mod tidy`, and re-run the sandbox crawl
**before** measuring item 9. Compare failure reasons with the baseline, and
where real stations regress, keep the specific settings with `godebug` lines
in `go.mod` (e.g. `godebug tlssha1=1`) rather than staying on `go 1.19`.

### 17. Slim records and cap outlier fields in `stations_*.jsonl`

**Why:** `05_organize.py` pads every line to the longest record + 16 bytes. The
live data has `line_length` 6,742 because of one RB `channel_resolved_url` of
5,292 characters (station `20396ef5-f4ba-4df8-a631-9bdec7e85451`), making the
chunks 233 MB across 6 files. In the baseline run, even after dropping URLs
over 512 chars and cutting `tags` to 200 chars, a 683-char `homepage` and a
389-char `channel_name` still push the max record to 1,149 bytes. Furthermore,
`05_organize.py` serialises `tags`, `language`, `country_code`, `ISO_A2_EH`,
and `source` into every line even though neither `frontend/` nor `icy/` ever
reads them (none are on the `RadioStation` TypeScript interface).

**Change:**

1. In `03_filter_radio.py`, drop stations whose `channel_resolved_url` is
   longer than 512 characters.
2. In `05_organize.py`:
   - Keep only the columns used by `frontend/` and `icy/`: `channel_id`,
     `channel_name`, `channel_resolved_url`, `country`, `geo_lat`, `geo_lon`,
     `place_name`, `homepage`, `ADMIN`, `ISO_A3`, `CONTINENT` (dropping
     `source`, `country_code`, `tags`, `language`, `ISO_A2_EH`, `stream_ok`,
     and `stream_check_error`).
   - Truncate `channel_name` to 150 characters and set `homepage = None` when
     `len(homepage) > 256`.
   - Use `json.dumps(..., ensure_ascii=False)` so non-ASCII names aren't
     expanded to 6-byte `\uXXXX` escapes (`useRadio.ts` fetches byte ranges via
     `Range: bytes=${startByte}-${endByte}` and decodes UTF-8 with
     `response.text()`, and `05_organize.py` already measures and pads on
     `.encode("utf-8")` byte length).
   - Print the 5 longest records with their longest field, so outliers show up
     in the log.
3. Version the data files. Item 17 changes `line_length` (6,742 → ~800) and the
   chunk count (6 → 1), so any client holding the old `index.json` (an open tab,
   the native app, or the PWA's `NetworkFirst` cache fallback) reads garbage
   or gets `404` for `stations_3.jsonl`. Have `06_split_chunks.py` name chunks
   `stations_<hash>_<i>.jsonl` (short content hash), write `config.version`
   into `index.json`, and have `useRadio.ts` build
   `stations_${version}_${file}.jsonl`. `copy.sh` keeps the previous version's
   chunks for one deploy so open sessions keep working. The first deploy of
   this change still breaks clients holding the old index, so deploy it just
   after midnight Eastern.

**Expected:** `LINE_LENGTH` drops from 6,742 bytes to ~800 bytes, and total
`stations_*.jsonl` size shrinks from **233 MB (6 chunks) to ~29 MB (1 chunk)**.

### 18. Tests

In `data-prep/crawl`, using Go's standard `testing` package:

- `crawldata`: `better` (a record with a URL beats one without, then
  `stream_ok=yes`, then `Score`, then deterministic tie-breaker),
  `DeduplicateByURL`, `DeduplicateByNameCity` (empty name or city is kept and
  not merged; output order is deterministic).
- `radiogarden.GetStreamURL` against an `httptest.Server` returning 302 with a
  `Location` header (item 6) and 429-then-200 (item 7).
- `streamcheck`: a TLS test server limited to
  `TLS_RSA_WITH_AES_256_GCM_SHA384` (item 9), a 302-to-200 redirect chain, a
  302-to-`http://` downgrade (rejected), and a raw TCP server replying
  `ICY 200 OK\r\n`.

Add a `mise` task `crawl:test` (`go test ./...` in `data-prep/crawl`).

---

## Decisions needed

- **RB coverage.** `has_geo_info=true` keeps 10,778 of 52,545 RB stations.
  Dropping it could add a lot of RB stations, but `useMapStations.ts` draws a
  dot per station using `geo_lat`/`geo_lon`, so stations without coordinates
  would need a fallback (e.g. the country centre from `02_centroids.py`) or
  would have to be hidden on the map. Needs a product decision.
- **Thresholds.** `--min-ratio 0.8`, place success `0.95`, and `copy.sh` 90%
  stations / 3 countries are starting guesses. Adjust after two or three runs
  using the report from item 15.
- **HLS streams.** Live data has 601 RB `.m3u8` URLs. Safari and iOS play HLS in
  `<audio>`; Chrome and Firefox don't without an MSE library (e.g. `hls.js`).
  Either drop them (item 8 reason `hls`) or add HLS playback to
  `RadioPlayer.vue`.

## Before and after a refresh

- **Before deploying:** a changed country set (this refresh drops Vietnam,
  Uzbekistan, Tajikistan, Brunei and Burundi, adds Belize, Cambodia, Mongolia
  and Somalia, and item 11 moves more) changes the daily country on almost
  every future day, because `pickCountryAndStations` indexes into the sorted
  country names. A deploy during the day also gives players who refresh
  mid-game a different country (`restoreState`), and mixes two puzzles in that
  day's Supabase stats. Freeze the daily country list first (option 1 in
  `todo/maybe/daily-challenge-data-stability.md`), and deploy data changes
  just after midnight Eastern.
- Run `mise run test`. `frontend/src/composables/__tests__/dailyChallenge.test.ts`
  asserts `sortedNames.length === 143` and checks the 15 Dec 2025 country
  picks. If it fails, that means the daily schedule moved. Don't just update the
  expected values; freeze the list instead (see above).
- `frontend/src/views/About.vue` says "over 36,000 stations … from 143
  countries". Update it to the new numbers.
- Update `data-prep/crawl/README.md` to match the new flags, backup naming, and
  `RG`/`RB` source tags.
- Add a `CHANGELOG.md` entry with the before and after counts.
