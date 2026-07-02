import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { computeDailyScore, type DailyScoreResult } from "@/lib/scoring";
import { computeGoalCompletionRatio } from "@/lib/scoring/output";
import { CONSISTENCY_WINDOW_DAYS } from "@/lib/scoring/weights";
import type { Difficulty } from "@/lib/scoring/types";

interface StoredGoal {
  difficulty: Difficulty;
  achieved: boolean | null;
}

function isoDaysBefore(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// Fetches today's check-in/calendar data plus the last CONSISTENCY_WINDOW_DAYS
// of check-ins, runs the pure scoring engine, and upserts daily_scores.
// Best-effort like the calendar sync: a missing/incomplete check-in for
// today just yields null sub-scores rather than throwing.
export async function computeAndStoreDailyScore(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  day: string,
): Promise<DailyScoreResult> {
  const windowStart = isoDaysBefore(day, CONSISTENCY_WINDOW_DAYS - 1);

  const [{ data: todayCheckin }, { data: recentCheckins }, { data: calendarRow }] =
    await Promise.all([
      supabase
        .from("daily_checkins")
        .select("goals, focus")
        .eq("user_id", userId)
        .eq("day", day)
        .maybeSingle(),
      supabase
        .from("daily_checkins")
        .select("day, goals")
        .eq("user_id", userId)
        .gte("day", windowStart)
        .lte("day", day),
      supabase
        .from("calendar_data")
        .select("meeting_minutes, deep_work_slots, transitions")
        .eq("user_id", userId)
        .eq("day", day)
        .maybeSingle(),
    ]);

  const goals = (todayCheckin?.goals ?? []) as StoredGoal[];
  const selfRatedFocus = todayCheckin?.focus ?? null;
  const calendar = calendarRow
    ? {
        meetingMinutes: calendarRow.meeting_minutes,
        deepWorkSlots: calendarRow.deep_work_slots,
        transitions: calendarRow.transitions,
      }
    : null;

  const goalsByDay = new Map(
    (recentCheckins ?? []).map((c) => [c.day as string, c.goals as StoredGoal[]]),
  );
  const last7Days = Array.from({ length: CONSISTENCY_WINDOW_DAYS }, (_, i) => {
    const d = isoDaysBefore(day, CONSISTENCY_WINDOW_DAYS - 1 - i);
    const dayGoals = goalsByDay.get(d);
    return { day: d, ratio: dayGoals ? computeGoalCompletionRatio(dayGoals) : null };
  });

  const result = computeDailyScore({ goals, calendar, selfRatedFocus, last7Days });

  await supabase.from("daily_scores").upsert({
    user_id: userId,
    day,
    focus_score: result.focus.score,
    output_score: result.output.score,
    consistency_score: result.consistency.score,
    composite_score: result.composite,
    focus_explanation: result.focus.explanation,
    output_explanation: result.output.explanation,
    consistency_explanation: result.consistency.explanation,
    components: {
      focus: result.focus.components,
      output: result.output.components,
      consistency: result.consistency.components,
    },
    computed_at: new Date().toISOString(),
  });

  return result;
}
