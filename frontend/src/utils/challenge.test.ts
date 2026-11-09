import { createPinia, setActivePinia } from "pinia";
import { beforeAll, describe, expect, it } from "vitest";
import { useRadio } from "../composables/useRadio";

describe("challenge date/score calculations", () => {
  beforeAll(() => {
    setActivePinia(createPinia());
  });

  describe("getDailyChallengeNumber stability across timezones", () => {
    it("returns correct day number regardless of UTC offset of the runner", () => {
      const { getDailyChallengeNumber } = useRadio();

      // Feb 2, 2026 17:00:00 UTC (12:00:00 PM EST) -> Day 1
      const dateDay1 = new Date("2026-02-02T17:00:00Z");
      expect(getDailyChallengeNumber(dateDay1)).toBe(1);

      // Feb 3, 2026 06:00:00 UTC (01:00:00 AM EST) -> Day 2
      const dateDay2 = new Date("2026-02-03T06:00:00Z");
      expect(getDailyChallengeNumber(dateDay2)).toBe(2);

      // Rollout check on Feb 2, 2026 at 23:59:59 EST (04:59:59 UTC on Feb 3) -> Day 1
      const dateDay1End = new Date("2026-02-03T04:59:59Z");
      expect(getDailyChallengeNumber(dateDay1End)).toBe(1);

      // Day 2 starts exactly at Feb 3, 2026 00:00:00 EST (05:00:00 UTC) -> Day 2
      const dateDay2Start = new Date("2026-02-03T05:00:00Z");
      expect(getDailyChallengeNumber(dateDay2Start)).toBe(2);
    });
  });

  describe("getNextEasternMidnight countdown target", () => {
    it("correctly calculates the next midnight in Eastern time as UTC Date", () => {
      const { getNextEasternMidnight } = useRadio();

      // Case A: Standard Time (EST = UTC-5).
      // Feb 2, 2026 12:00:00 PM EST (17:00 UTC). Next Eastern Midnight is Feb 3, 2026 05:00:00 UTC.
      const nowEST = new Date("2026-02-02T17:00:00Z");
      const targetEST = getNextEasternMidnight(nowEST);
      expect(targetEST.toISOString()).toBe("2026-02-03T05:00:00.000Z");

      // Case B: Daylight Saving Time (EDT = UTC-4).
      // Jun 15, 2026 12:00:00 PM EDT (16:00 UTC). Next Eastern Midnight is Jun 16, 2026 04:00:00 UTC.
      const nowEDT = new Date("2026-06-15T16:00:00Z");
      const targetEDT = getNextEasternMidnight(nowEDT);
      expect(targetEDT.toISOString()).toBe("2026-06-16T04:00:00.000Z");
    });
  });

  describe("numericScore calculations", () => {
    it("returns correct numericScore based on guess index and win/loss", () => {
      const computeScore = (guesses: string[], secretCountry: string): number => {
        const idx = guesses.findIndex((g) => g.toLowerCase() === secretCountry.toLowerCase());
        return idx !== -1 ? idx + 1 : 6;
      };

      // Wins
      expect(computeScore(["Brazil"], "Brazil")).toBe(1);
      expect(computeScore(["France", "Brazil"], "Brazil")).toBe(2);
      expect(computeScore(["France", "Germany", "Brazil"], "Brazil")).toBe(3);
      expect(computeScore(["France", "Germany", "Italy", "Brazil"], "Brazil")).toBe(4);
      expect(computeScore(["France", "Germany", "Italy", "Spain", "Brazil"], "Brazil")).toBe(5);

      // Losses
      expect(computeScore(["France", "Germany", "Italy", "Spain", "Mexico"], "Brazil")).toBe(6);
    });
  });
});
