import { SCORE_WEIGHTS } from "./weights";

export interface SubScores {
  focus: number | null;
  output: number | null;
  consistency: number | null;
}

// Averages only over the sub-scores that are actually available, renormalizing
// weights so a missing sub-score (e.g. focus before any check-out) doesn't
// silently drag the composite toward zero.
export function computeCompositeScore(scores: SubScores): number | null {
  const available = (Object.keys(SCORE_WEIGHTS) as (keyof typeof SCORE_WEIGHTS)[])
    .map((key) => ({ value: scores[key], weight: SCORE_WEIGHTS[key] }))
    .filter((e): e is { value: number; weight: number } => e.value !== null);

  if (available.length === 0) return null;

  const totalWeight = available.reduce((sum, e) => sum + e.weight, 0);
  const weightedSum = available.reduce((sum, e) => sum + e.value * e.weight, 0);

  return Math.round(weightedSum / totalWeight);
}
