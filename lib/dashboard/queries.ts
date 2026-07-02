import "server-only";
import type { createClient } from "@/lib/supabase/server";

export interface HistoryDay {
  day: string;
  composite: number | null;
  focus: number | null;
  output: number | null;
  consistency: number | null;
  meetingMinutes: number | null;
  energy: number | null;
}

function isoDaysBefore(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// Merges daily_scores, calendar_data, and daily_checkins for the last `days`
// days into one row per day, oldest first. Days with no score are omitted
// from the score fields but the array is dense so charts show real gaps.
export async function getScoreHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  today: string,
  days: number,
): Promise<HistoryDay[]> {
  const start = isoDaysBefore(today, days - 1);

  const [{ data: scores }, { data: calendar }, { data: checkins }] = await Promise.all([
    supabase
      .from("daily_scores")
      .select("day, composite_score, focus_score, output_score, consistency_score")
      .eq("user_id", userId)
      .gte("day", start)
      .lte("day", today),
    supabase
      .from("calendar_data")
      .select("day, meeting_minutes")
      .eq("user_id", userId)
      .gte("day", start)
      .lte("day", today),
    supabase
      .from("daily_checkins")
      .select("day, energy")
      .eq("user_id", userId)
      .gte("day", start)
      .lte("day", today),
  ]);

  const scoreByDay = new Map((scores ?? []).map((s) => [s.day as string, s]));
  const meetingByDay = new Map(
    (calendar ?? []).map((c) => [c.day as string, c.meeting_minutes as number]),
  );
  const energyByDay = new Map(
    (checkins ?? []).map((c) => [c.day as string, c.energy as number | null]),
  );

  return Array.from({ length: days }, (_, i) => {
    const day = isoDaysBefore(today, days - 1 - i);
    const s = scoreByDay.get(day);
    return {
      day,
      composite: s?.composite_score ?? null,
      focus: s?.focus_score ?? null,
      output: s?.output_score ?? null,
      consistency: s?.consistency_score ?? null,
      meetingMinutes: meetingByDay.get(day) ?? null,
      energy: energyByDay.get(day) ?? null,
    };
  });
}
