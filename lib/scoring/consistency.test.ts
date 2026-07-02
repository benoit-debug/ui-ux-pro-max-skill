import { describe, expect, it } from "vitest";
import { computeConsistencyScore, type DayCompletionRatio } from "./consistency";

function days(ratios: (number | null)[]): DayCompletionRatio[] {
  return ratios.map((ratio, i) => ({ day: `2026-06-${20 + i}`, ratio }));
}

describe("computeConsistencyScore", () => {
  it("returns null when there is no check-in history at all", () => {
    const result = computeConsistencyScore(days([null, null, null, null, null, null, null]));
    expect(result.score).toBeNull();
  });

  // The core guardrail: one overworked/maxed-out day must not "explode" the
  // score. A steady, moderate performer across the week should clearly beat
  // a single spike surrounded by no activity.
  it("rewards steady moderate performance over a single overwork spike", () => {
    const steadyPerformer = computeConsistencyScore(days([0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6]));
    const overworkSpike = computeConsistencyScore(days([0, 0, 0, 0, 0, 0, 1]));

    expect(steadyPerformer.score).toBe(100);
    expect(overworkSpike.score).toBeLessThan(steadyPerformer.score!);
    expect(overworkSpike.score).toBe(14); // 1/7 rounded
  });

  it("does not count a day below the 50% threshold as met", () => {
    const result = computeConsistencyScore(days([0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4]));
    expect(result.score).toBe(0);
  });

  it("scores days without a check-in as untracked, not as a miss", () => {
    // 3 tracked days, all met - but the denominator is still the full window.
    const result = computeConsistencyScore(days([null, null, null, null, 1, 1, 1]));
    expect(result.score).toBe(43); // 3/7 rounded
    expect(result.components.trackedDays).toBe(3);
  });
});
