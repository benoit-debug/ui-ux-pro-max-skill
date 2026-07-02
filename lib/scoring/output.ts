import { DIFFICULTY_WEIGHT } from "./weights";
import type { ScoredGoal, ScoreResult } from "./types";

// Shared with consistency.ts, which needs the same per-day ratio for each
// of the last 7 days.
export function computeGoalCompletionRatio(goals: ScoredGoal[]): number | null {
  if (goals.length === 0) return null;

  const totalWeight = goals.reduce((sum, g) => sum + DIFFICULTY_WEIGHT[g.difficulty], 0);
  if (totalWeight === 0) return null;

  const achievedWeight = goals
    .filter((g) => g.achieved === true)
    .reduce((sum, g) => sum + DIFFICULTY_WEIGHT[g.difficulty], 0);

  return achievedWeight / totalWeight;
}

export function computeOutputScore(goals: ScoredGoal[]): ScoreResult {
  const ratio = computeGoalCompletionRatio(goals);

  if (ratio === null) {
    return {
      score: null,
      explanation: "No goals were set for today.",
      components: { goalCount: goals.length },
    };
  }

  const score = Math.round(ratio * 100);
  const achievedGoals = goals.filter((g) => g.achieved === true);
  const hardestAchieved = achievedGoals
    .slice()
    .sort((a, b) => DIFFICULTY_WEIGHT[b.difficulty] - DIFFICULTY_WEIGHT[a.difficulty])[0];

  const explanation = hardestAchieved
    ? `${achievedGoals.length}/${goals.length} goals achieved, including a ${hardestAchieved.difficulty}-difficulty one - output score ${score}/100.`
    : `${achievedGoals.length}/${goals.length} goals achieved - output score ${score}/100.`;

  return {
    score,
    explanation,
    components: {
      ratio,
      goalCount: goals.length,
      achievedCount: achievedGoals.length,
    },
  };
}
