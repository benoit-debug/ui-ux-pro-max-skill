import {
  WORK_WINDOW_MINUTES,
  FOCUS_BONUS_PER_DEEP_WORK_SLOT,
  FOCUS_DEEP_WORK_SLOT_CAP,
  FOCUS_PENALTY_PER_TRANSITION,
  FOCUS_SELF_RATING_SCALE,
} from "./weights";
import type { CalendarDayMetrics, ScoreResult } from "./types";

export function computeFocusScore(
  calendar: CalendarDayMetrics | null,
  selfRatedFocus: number | null,
): ScoreResult {
  if (calendar) {
    const freeMinutes = Math.max(0, WORK_WINDOW_MINUTES - calendar.meetingMinutes);
    const freeRatio = freeMinutes / WORK_WINDOW_MINUTES;
    const deepWorkBonus =
      Math.min(calendar.deepWorkSlots, FOCUS_DEEP_WORK_SLOT_CAP) *
      FOCUS_BONUS_PER_DEEP_WORK_SLOT;
    const fragmentationPenalty = calendar.transitions * FOCUS_PENALTY_PER_TRANSITION;

    const raw = freeRatio * 100 + deepWorkBonus - fragmentationPenalty;
    const score = Math.round(Math.min(100, Math.max(0, raw)));

    const meetingHours = (calendar.meetingMinutes / 60).toFixed(1);
    const explanation =
      calendar.deepWorkSlots > 0
        ? `${meetingHours}h in meetings today, with ${calendar.deepWorkSlots} deep-work slot(s) of 90+ minutes - focus score ${score}/100.`
        : `${meetingHours}h in meetings today and no uninterrupted 90+ minute block - focus score ${score}/100.`;

    return {
      score,
      explanation,
      components: {
        source: "calendar",
        ...calendar,
        freeRatio,
        deepWorkBonus,
        fragmentationPenalty,
      },
    };
  }

  if (selfRatedFocus != null) {
    const score = Math.round(
      Math.min(100, Math.max(0, selfRatedFocus * FOCUS_SELF_RATING_SCALE)),
    );

    return {
      score,
      explanation: `No calendar connected - based on your self-rated focus (${selfRatedFocus}/5).`,
      components: { source: "self_report", selfRatedFocus },
    };
  }

  return {
    score: null,
    explanation: "Not enough data yet - connect Calendar or rate your focus at check-out.",
    components: { source: "none" },
  };
}
