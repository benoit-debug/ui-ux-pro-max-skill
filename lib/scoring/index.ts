export * from "./types";
export * from "./weights";
export { computeOutputScore, computeGoalCompletionRatio } from "./output";
export { computeFocusScore } from "./focus";
export { computeConsistencyScore, type DayCompletionRatio } from "./consistency";
export { computeCompositeScore, type SubScores } from "./composite";

import { computeOutputScore } from "./output";
import { computeFocusScore } from "./focus";
import { computeConsistencyScore, type DayCompletionRatio } from "./consistency";
import { computeCompositeScore } from "./composite";
import type { ScoredGoal, CalendarDayMetrics } from "./types";

export interface DailyScoreInput {
  goals: ScoredGoal[];
  calendar: CalendarDayMetrics | null;
  selfRatedFocus: number | null;
  last7Days: DayCompletionRatio[];
}

export interface DailyScoreResult {
  focus: ReturnType<typeof computeFocusScore>;
  output: ReturnType<typeof computeOutputScore>;
  consistency: ReturnType<typeof computeConsistencyScore>;
  composite: number | null;
}

// The single pure entry point: no I/O, fully deterministic, easy to test.
// See lib/scoring/persist.ts for the Supabase-backed wrapper that fetches
// inputs and stores the result.
export function computeDailyScore(input: DailyScoreInput): DailyScoreResult {
  const output = computeOutputScore(input.goals);
  const focus = computeFocusScore(input.calendar, input.selfRatedFocus);
  const consistency = computeConsistencyScore(input.last7Days);
  const composite = computeCompositeScore({
    focus: focus.score,
    output: output.score,
    consistency: consistency.score,
  });

  return { output, focus, consistency, composite };
}
