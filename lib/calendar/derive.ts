// Working-hours window used to derive Focus-related metrics from calendar
// events. Free time outside this window (e.g. 11pm) isn't deep work.
export const WORK_DAY_START_HOUR = 8;
export const WORK_DAY_END_HOUR = 19;
export const DEEP_WORK_MIN_MINUTES = 90;

export interface CalendarEvent {
  start: string;
  end: string;
  busy: boolean;
}

export interface CalendarMetrics {
  meetingMinutes: number;
  deepWorkSlots: number;
  transitions: number;
}

interface Interval {
  start: number;
  end: number;
}

export function deriveCalendarMetrics(
  events: CalendarEvent[],
  workStart: Date,
  workEnd: Date,
): CalendarMetrics {
  const workStartMs = workStart.getTime();
  const workEndMs = workEnd.getTime();

  const busy: Interval[] = events
    .filter((e) => e.busy)
    .map((e) => ({
      start: Math.max(new Date(e.start).getTime(), workStartMs),
      end: Math.min(new Date(e.end).getTime(), workEndMs),
    }))
    .filter((i) => i.end > i.start)
    .sort((a, b) => a.start - b.start);

  const merged: Interval[] = [];
  for (const interval of busy) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end) {
      last.end = Math.max(last.end, interval.end);
    } else {
      merged.push({ ...interval });
    }
  }

  const meetingMinutes = Math.round(
    merged.reduce((sum, i) => sum + (i.end - i.start), 0) / 60_000,
  );

  const segments: (Interval & { busy: boolean })[] = [];
  let cursor = workStartMs;
  for (const b of merged) {
    if (b.start > cursor) segments.push({ start: cursor, end: b.start, busy: false });
    segments.push({ ...b, busy: true });
    cursor = b.end;
  }
  if (cursor < workEndMs) segments.push({ start: cursor, end: workEndMs, busy: false });

  const deepWorkSlots = segments.filter(
    (s) => !s.busy && s.end - s.start >= DEEP_WORK_MIN_MINUTES * 60_000,
  ).length;

  const transitions = Math.max(segments.length - 1, 0);

  return { meetingMinutes, deepWorkSlots, transitions };
}
