import { describe, expect, it } from "vitest";
import { findTopInsight, pearson, type InsightDay } from "./correlation";

function day(partial: Partial<InsightDay>): InsightDay {
  return {
    outputScore: null,
    focusScore: null,
    compositeScore: null,
    meetingMinutes: null,
    energy: null,
    ...partial,
  };
}

describe("pearson", () => {
  it("returns 1 for a perfect positive relationship", () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
  });

  it("returns -1 for a perfect negative relationship", () => {
    expect(pearson([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1);
  });

  it("returns null when a variable has no variance", () => {
    expect(pearson([5, 5, 5], [1, 2, 3])).toBeNull();
  });
});

describe("findTopInsight", () => {
  it("returns null when there aren't enough days with paired data", () => {
    const days = [
      day({ meetingMinutes: 120, outputScore: 40 }),
      day({ meetingMinutes: 30, outputScore: 90 }),
    ];
    expect(findTopInsight(days)).toBeNull();
  });

  it("surfaces the meetings-vs-output insight with the right direction", () => {
    // Clear inverse relationship: more meetings, less output.
    const days = [
      day({ meetingMinutes: 30, outputScore: 95 }),
      day({ meetingMinutes: 60, outputScore: 85 }),
      day({ meetingMinutes: 120, outputScore: 60 }),
      day({ meetingMinutes: 200, outputScore: 40 }),
      day({ meetingMinutes: 300, outputScore: 20 }),
    ];
    const insight = findTopInsight(days);
    expect(insight).not.toBeNull();
    expect(insight!.correlation).toBeLessThan(0);
    expect(insight!.text).toMatch(/less time in meetings/i);
    expect(insight!.sampleSize).toBe(5);
  });

  it("ignores a weak correlation below the strength threshold", () => {
    // Output scatters up and down regardless of energy (Pearson r ~ 0.13),
    // so it isn't a headline-worthy signal even though every day is paired.
    const days = [
      day({ energy: 1, outputScore: 50 }),
      day({ energy: 2, outputScore: 90 }),
      day({ energy: 3, outputScore: 55 }),
      day({ energy: 4, outputScore: 85 }),
      day({ energy: 5, outputScore: 60 }),
    ];
    expect(findTopInsight(days)).toBeNull();
  });
});
