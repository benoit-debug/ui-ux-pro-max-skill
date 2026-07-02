import { CONSISTENCY_MET_THRESHOLD_RATIO } from "./weights";
import type { ScoreResult } from "./types";

export interface DayCompletionRatio {
  day: string;
  // null = no check-in that day (not the same as a check-in with 0% output).
  ratio: number | null;
}

// Counts how many of the last N days cleared a "met your goals" bar,
// rather than averaging or summing raw output. This is what makes a single
// overworked day incapable of dominating the score: it can only ever count
// as one "met" day, exactly like a modest, sustainable one.
export function computeConsistencyScore(days: DayCompletionRatio[]): ScoreResult {
  const tracked = days.filter((d) => d.ratio !== null);

  if (tracked.length === 0) {
    return {
      score: null,
      explanation: "Not enough check-in history yet to measure consistency.",
      components: { windowDays: days.length, trackedDays: 0 },
    };
  }

  const daysMet = tracked.filter((d) => (d.ratio as number) >= CONSISTENCY_MET_THRESHOLD_RATIO).length;
  const score = Math.round((daysMet / days.length) * 100);

  return {
    score,
    explanation: `Hit at least half your goals on ${daysMet} of the last ${days.length} days.`,
    components: { windowDays: days.length, trackedDays: tracked.length, daysMet },
  };
}
