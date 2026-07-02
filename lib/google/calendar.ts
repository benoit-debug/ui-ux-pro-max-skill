import type { CalendarEvent } from "@/lib/calendar/derive";

export class GoogleTokenRevokedError extends Error {}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID!,
      client_secret: process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 400 && body.includes("invalid_grant")) {
      throw new GoogleTokenRevokedError("Google Calendar access was revoked");
    }
    throw new Error(`Failed to refresh Google access token: ${body}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

interface GoogleEvent {
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  transparency?: "transparent" | "opaque";
  status?: string;
}

export async function fetchCalendarEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date,
): Promise<CalendarEvent[]> {
  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
  );
  url.searchParams.set("timeMin", timeMin.toISOString());
  url.searchParams.set("timeMax", timeMax.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Calendar events: ${await response.text()}`);
  }

  const data = (await response.json()) as { items?: GoogleEvent[] };

  return (data.items ?? [])
    .filter((e) => e.status !== "cancelled" && e.start?.dateTime && e.end?.dateTime)
    .map((e) => ({
      start: e.start!.dateTime!,
      end: e.end!.dateTime!,
      busy: e.transparency !== "transparent",
    }));
}
