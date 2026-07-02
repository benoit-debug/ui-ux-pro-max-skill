// "Today" as a YYYY-MM-DD calendar day in the user's own timezone, not the
// server's - otherwise users far from UTC would get the wrong day near
// midnight.
export function todayInTimezone(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}
