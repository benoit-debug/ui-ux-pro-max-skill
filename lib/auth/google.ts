// Read-only, single-purpose scope: we only ever read calendar events to
// derive daily metrics, never create/modify/delete them.
export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";
