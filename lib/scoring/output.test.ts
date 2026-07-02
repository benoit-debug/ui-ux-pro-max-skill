import { describe, expect, it } from "vitest";
import { computeOutputScore } from "./output";
import type { ScoredGoal } from "./types";

describe("computeOutputScore", () => {
  it("returns null with an explanation when no goals were set", () => {
    const result = computeOutputScore([]);
    expect(result.score).toBeNull();
    expect(result.explanation).toMatch(/no goals/i);
  });

  it("scores a single achieved high-difficulty goal as 100", () => {
    const goals: ScoredGoal[] = [{ difficulty: "high", achieved: true }];
    expect(computeOutputScore(goals).score).toBe(100);
  });

  // The anti-vanity-metric guardrail: achieving the one hard goal (and
  // missing two easy ones) must outscore achieving two easy goals while
  // missing the hard one - even though the second day "did more tasks".
  it("rewards a completed difficult goal over several completed easy ones", () => {
    const hardGoalDay: ScoredGoal[] = [
      { difficulty: "high", achieved: true },
      { difficulty: "low", achieved: false },
      { difficulty: "low", achieved: false },
    ];
    const easyGoalsDay: ScoredGoal[] = [
      { difficulty: "low", achieved: true },
      { difficulty: "low", achieved: true },
      { difficulty: "high", achieved: false },
    ];

    const hardGoalScore = computeOutputScore(hardGoalDay).score!;
    const easyGoalsScore = computeOutputScore(easyGoalsDay).score!;

    expect(hardGoalScore).toBeGreaterThan(easyGoalsScore);
    expect(hardGoalScore).toBe(67); // 4 / 6
    expect(easyGoalsScore).toBe(33); // 2 / 6
  });

  it("never exceeds 100 even when every goal is achieved", () => {
    const goals: ScoredGoal[] = [
      { difficulty: "high", achieved: true },
      { difficulty: "medium", achieved: true },
      { difficulty: "low", achieved: true },
    ];
    expect(computeOutputScore(goals).score).toBe(100);
  });

  it("treats an unresolved (not yet checked-out) goal as not achieved", () => {
    const goals: ScoredGoal[] = [{ difficulty: "medium", achieved: null }];
    expect(computeOutputScore(goals).score).toBe(0);
  });
});
