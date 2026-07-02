import type { Difficulty } from "./types";

// Tune the composite score here. Kept as a single source of truth so
// rebalancing focus vs. output vs. consistency never requires touching the
// scoring logic itself.
export const SCORE_WEIGHTS: Record<"focus" | "output" | "consistency", number> = {
  focus: 0.35,
  output: 0.4,
  consistency: 0.25,
};

// Output: a completed high-difficulty goal must outweigh several completed
// low-difficulty ones (anti-vanity-metric guardrail).
export const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  low: 1,
  medium: 2,
  high: 4,
};

// Focus (calendar mode): assumed working-hours window, matching
// lib/calendar/derive's WORK_DAY_START_HOUR/WORK_DAY_END_HOUR (8am-7pm).
export const WORK_WINDOW_MINUTES = 11 * 60;
export const FOCUS_BONUS_PER_DEEP_WORK_SLOT = 5;
export const FOCUS_DEEP_WORK_SLOT_CAP = 3;
export const FOCUS_PENALTY_PER_TRANSITION = 3;

// Focus (no-calendar fallback): maps a 1-5 self-rating to a 0-100 score.
export const FOCUS_SELF_RATING_SCALE = 20;

// Consistency: rewards showing up regularly over raw magnitude, so a single
// overworked day can't dominate the score the way an average/sum would.
export const CONSISTENCY_WINDOW_DAYS = 7;
export const CONSISTENCY_MET_THRESHOLD_RATIO = 0.5;
