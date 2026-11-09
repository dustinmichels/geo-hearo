import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useRadio } from "../composables/useRadio";

describe("Eastern midnight countdown", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("calculates next Eastern midnight in standard time (EST)", () => {
    const { getNextEasternMidnight } = useRadio();
    const t = new Date(Date.UTC(2026, 1, 15, 12, 0, 0)); // Feb 15, 2026 12:00:00 UTC (07:00:00 EST)
    const midnight = getNextEasternMidnight(t);
    expect(midnight.toISOString()).toBe("2026-02-16T05:00:00.000Z"); // Feb 16, 2026 00:00:00 EST
  });

  it("calculates next Eastern midnight in daylight saving time (EDT)", () => {
    const { getNextEasternMidnight } = useRadio();
    const t = new Date(Date.UTC(2026, 6, 15, 12, 0, 0)); // July 15, 2026 12:00:00 UTC (08:00:00 EDT)
    const midnight = getNextEasternMidnight(t);
    expect(midnight.toISOString()).toBe("2026-07-16T04:00:00.000Z"); // July 16, 2026 00:00:00 EDT
  });

  it("handles DST spring forward transition boundary", () => {
    const { getNextEasternMidnight } = useRadio();
    // Before spring forward: March 8, 2026 01:00:00 EST (06:00:00 UTC)
    const t1 = new Date(Date.UTC(2026, 2, 8, 6, 0, 0));
    const m1 = getNextEasternMidnight(t1);
    expect(m1.toISOString()).toBe("2026-03-09T04:00:00.000Z"); // March 9, 2026 00:00:00 EDT

    // After spring forward: March 8, 2026 03:00:00 EDT (07:00:00 UTC)
    const t2 = new Date(Date.UTC(2026, 2, 8, 7, 0, 0));
    const m2 = getNextEasternMidnight(t2);
    expect(m2.toISOString()).toBe("2026-03-09T04:00:00.000Z"); // March 9, 2026 00:00:00 EDT
  });

  it("handles DST autumn fallback transition boundary", () => {
    const { getNextEasternMidnight } = useRadio();
    // Before fallback: Nov 1, 2026 01:30:00 EDT (05:30:00 UTC)
    const t1 = new Date(Date.UTC(2026, 10, 1, 5, 30, 0));
    const m1 = getNextEasternMidnight(t1);
    expect(m1.toISOString()).toBe("2026-11-02T05:00:00.000Z"); // Nov 2, 2026 00:00:00 EST
  });
});

describe("Daily challenge number stability across timezones", () => {
  const originalTz = process.env.TZ;

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    if (originalTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTz;
    }
  });

  const hostTimezones = ["UTC", "America/New_York", "Europe/Berlin", "Pacific/Auckland"];

  it("calculates correct day number based on America/New_York date across host timezones", () => {
    const { getDailyChallengeNumber } = useRadio();

    for (const tz of hostTimezones) {
      process.env.TZ = tz;

      // Day 1 starts on Feb 2, 2026.
      // 1. Feb 2, 2026 at 12:00:00 UTC (07:00:00 EST) -> Day 1
      const t1 = new Date(Date.UTC(2026, 1, 2, 12, 0, 0));
      expect(getDailyChallengeNumber(t1)).toBe(1);

      // 2. Feb 3, 2026 at 03:00:00 UTC (Feb 2, 2026 at 22:00:00 EST) -> Day 1
      const t2 = new Date(Date.UTC(2026, 1, 3, 3, 0, 0));
      expect(getDailyChallengeNumber(t2)).toBe(1);

      // 3. Feb 3, 2026 at 05:00:00 UTC (Feb 3, 2026 at 00:00:00 EST) -> Day 2
      const t3 = new Date(Date.UTC(2026, 1, 3, 5, 0, 0));
      expect(getDailyChallengeNumber(t3)).toBe(2);
    }
  });
});
