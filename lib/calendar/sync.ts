import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { dayBoundsUtc } from "@/lib/time/day-range";
import {
  deriveCalendarMetrics,
  WORK_DAY_START_HOUR,
  WORK_DAY_END_HOUR,
} from "@/lib/calendar/derive";
import {
  fetchCalendarEvents,
  refreshGoogleAccessToken,
  GoogleTokenRevokedError,
} from "@/lib/google/calendar";

// Best-effort: called opportunistically from the check-in/check-out pages.
// Any failure (no connection, revoked access, Google API error) is
// swallowed so a calendar hiccup never blocks the user's daily check-in.
export async function syncCalendarForDay(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  day: string,
  timezone: string,
): Promise<void> {
  const { data: connection } = await supabase
    .from("calendar_connections")
    .select("refresh_token, revoked_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!connection || connection.revoked_at) return;

  try {
    const { startUtc } = dayBoundsUtc(day, timezone);
    const workStart = new Date(startUtc.getTime() + WORK_DAY_START_HOUR * 3_600_000);
    const workEnd = new Date(startUtc.getTime() + WORK_DAY_END_HOUR * 3_600_000);

    const accessToken = await refreshGoogleAccessToken(connection.refresh_token);
    const events = await fetchCalendarEvents(accessToken, workStart, workEnd);
    const metrics = deriveCalendarMetrics(events, workStart, workEnd);

    await supabase.from("calendar_data").upsert({
      user_id: userId,
      day,
      meeting_minutes: metrics.meetingMinutes,
      deep_work_slots: metrics.deepWorkSlots,
      transitions: metrics.transitions,
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof GoogleTokenRevokedError) {
      await supabase
        .from("calendar_connections")
        .update({ revoked_at: new Date().toISOString() })
        .eq("user_id", userId);
      return;
    }
    console.error("Calendar sync failed", error);
  }
}
