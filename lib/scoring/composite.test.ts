import { describe, expect, it } from "vitest";
import { computeCompositeScore } from "./composite";

describe("computeCompositeScore", () => {
  it("returns null when every sub-score is missing", () => {
    expect(computeCompositeScore({ focus: null, output: null, consistency: null })).toBeNull();
  });

  it("computes a weighted average when all sub-scores are present", () => {
    // weights: focus 0.35, output 0.4, consistency 0.25
    const composite = computeCompositeScore({ focus: 80, output: 80, consistency: 80 });
    expect(composite).toBe(80);
  });

  it("renormalizes weights instead of penalizing a missing sub-score", () => {
    // Only output and consistency available, both 100 - composite should
    // still be 100, not dragged down by the missing focus score.
    const composite = computeCompositeScore({ focus: null, output: 100, consistency: 100 });
    expect(composite).toBe(100);
  });
});
