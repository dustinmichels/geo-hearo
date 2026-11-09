# Daily challenge depends on the station data

Re-running the data pipeline (`data-prep/run.sh` or `run_py.sh`), copying the
output with `copy.sh`, and deploying can change today's and future daily
challenges. Nothing changes until the new `index.json` / `stations_*.jsonl` reach
`frontend/public/data/` and are deployed. The crawler alone only writes
`data-prep/crawl/out/output.csv`.

---

## How the daily pick works

`loadCountryBySeed` in `frontend/src/composables/useRadio.ts`:

1. `countryList = Object.keys(index.countries).sort()`: the country names,
   alphabetically.
2. Country: `names[rng.nextInt(names.length)]`, where `rng` is `SeededRandom`
   seeded with the Eastern date.
3. Stations: the same `rng` draws up to 5 indices from `0..count-1` for that
   country. Each is fetched at `start + i * line_length` in
   `stations_<file>.jsonl`.

Byte order in the JSONL does not affect the country. The **set** of country
names and each country's **station rows** do.

## What a data refresh changes

| Change in new data                | Daily country                                                                       | Daily stations                         |
| --------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------- |
| Same countries, rows reordered    | same                                                                                | different (row _i_ is another station) |
| A country's station count changes | same                                                                                | different (picks depend on `count`)    |
| A country added or dropped        | **different on almost every day** (`names.length` and alphabetical positions shift) | different                              |

Countries can be added or dropped easily:

- `04_match_radio.py` drops countries with fewer than 5 stations, so a country
  near that threshold can come or go between crawls.
- The RadioBrowser crawler drops stations whose stream fails a 5 s check, so
  dead streams on the crawl day can push a country under 5.
- A new source or better name matching can add countries.

The row order within a country is not stable either. `05_organize.py` uses
`radio.sort_values("ADMIN")`, and pandas' default sort (quicksort) is not
stable. The input order also depends on the crawl output.

## Deploying in the middle of a day

- **Game in progress:** `restoreState` rebuilds the country from the seed in
  `sessionStorage`, using the new index. A player who refreshes mid-game can get
  a different secret country than the one they were guessing.
- **Mixed stats:** Supabase daily stats are keyed by date
  (`fetchDailyStats(challengeDate, …)`), so one day's results would cover two
  different puzzles.
- **Stale index, new chunks:** `index.json` is loaded once per page load. A tab
  or the native app left open across a deploy keeps the old offsets and
  `line_length`, then range-requests the new `stations_N.jsonl` and reads the
  wrong bytes. The PWA's `NetworkFirst` cache for `/data/` does not help an
  already-loaded tab.

## Existing guard

`frontend/src/composables/__tests__/dailyChallenge.test.ts` checks the expected
countries for Dec 1–15, 2025 against `frontend/public/data/index.json`. If the
country set changes, these tests fail. Run `bun run test` after `copy.sh` and
before deploying. The test does not catch station changes, which are expected
after any refresh.

## Options

1. **Freeze the daily country list.** Commit a separate list for the daily
   challenge (e.g. `frontend/public/data/daily_countries.json` or a TS
   constant) and choose from it instead of `Object.keys(index.countries)`. A
   data refresh then no longer moves the country. Free play can keep using the
   live index. Needs a fallback if a frozen country has no stations in the new
   index.
2. **Pre-generate a schedule.** A date → country file, generated ahead of time
   (e.g. a year). New countries only show up in newly generated dates. This also
   makes it easy to avoid repeats and to check upcoming puzzles.
3. **Stable station order.** Sort each country's rows by a stable key (station
   ID or stream URL) in `05_organize.py` with a stable sort
   (`kind="mergesort"`, or `sort_values(["ADMIN", "<id>"])`). Then a refresh only
   changes the stations if the country's station list itself changes. To keep
   the exact daily stations, store them in the schedule (option 2) instead of
   deriving them from `count`.
4. **Deploy timing / versioning** (smaller fixes):
   - Deploy data changes just after midnight Eastern, when the new daily seed
     takes effect.
   - Version the data files (e.g. `index.<hash>.json` pointing at
     `stations_<hash>_N.jsonl`) so an old index never reads new chunks.
