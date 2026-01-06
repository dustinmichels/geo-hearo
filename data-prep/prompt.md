# Prompt

Let's split this large script into three.

## Script 1

- Output: `data/out/ne_countries.geojson`, `data/out/centers.geojson`

- Filter down "natural earth 50" to selected columns and save to output. Also "fix" ISO_A2 by using ISO_A2_EH as fallback where needed.This should not remove any entries.

- Also create a new version of centers.geojson, with the same structure as the original. It should contain all the rows in the natural earth data, and no rows that are not in the natural earth data. Use the original geometry if possible. If missing, compute a centroid using geopandas from the natural earth geometry.

## Script 2

- Output:`data/out/all_radio_with_countries.json`

- This contains most of the logic from the original script. It should use `crawl/out/output.csv` as input, and filter out "bad" radio stations. It should merge with natural earth countries to get country codes and ensure matches are possible, and filter out countries that are too small, as done in the original script.

## Script 3

- Output: `data/out/filtered_radio_with_countries.json`

- Here is where the filtering part goes. This will run on the output of the previous script (which should contain all the valid stations for all remaining countries). In this one, chose 5 stations per country using the criteria in the original script.
