/**
 * USAGE:
 * bun run test dailyChallenge
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import type { IndexStructure } from "../../types/geo";
import { pickCountryAndStations, SeededRandom } from "../useRadio";

/**
 * Snapshot test for the daily challenge country selection algorithm.
 *
 * This ensures the SeededRandom LCG + country selection logic doesn't
 * accidentally change, which would break the daily challenge determinism
 * (all players must get the same country on the same day).
 *
 * The expected values were computed from the algorithm on 2026-02-03 and
 * locked in as constants.
 */

describe("daily challenge country selection", () => {
  const indexPath = resolve(__dirname, "../../../public/data/index.json");
  const indexData: IndexStructure = JSON.parse(readFileSync(indexPath, "utf-8"));
  const sortedNames = Object.keys(indexData.countries).sort();

  // Expected countries for Dec 1-15, 2025.
  // These were computed from the current algorithm and locked in.
  const expectedCountries: Record<string, string> = {
    "20251201": "Brazil",
    "20251202": "Sierra Leone",
    "20251203": "Nepal",
    "20251204": "Egypt",
    "20251205": "Belgium",
    "20251206": "Romania",
    "20251207": "Moldova",
    "20251208": "Democratic Republic of the Congo",
    "20251209": "Australia",
    "20251210": "Poland",
    "20251211": "Madagascar",
    "20251212": "Costa Rica",
    "20251213": "Albania",
    "20251214": "Panama",
    "20251215": "Greece",
  };

  it.each(
    Object.entries(expectedCountries).map(([seedStr, expectedCountry]) => {
      const seed = parseInt(seedStr, 10);
      const day = seed % 100;
      return { seed, day, expectedCountry };
    }),
  )("Dec $day, 2025 (seed=$seed) selects $expectedCountry", ({ seed, expectedCountry }) => {
    const picked = pickCountryAndStations(seed, sortedNames, indexData.countries);
    expect(picked?.country).toBe(expectedCountry);
  });

  it("SeededRandom produces consistent sequence for a given seed", () => {
    const rng = new SeededRandom(20251201);
    const values = Array.from({ length: 10 }, () => rng.nextInt(1000));

    // Lock in the first 10 values to detect any LCG changes
    expect(values).toEqual([478, 607, 100, 61, 50, 875, 488, 1, 742, 87]);
  });

  it("country list has expected length", () => {
    // If countries are added/removed from index.json, country selection
    // indices will shift. This test catches that.
    expect(sortedNames.length).toBe(143);
  });
});
