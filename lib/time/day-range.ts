// Resolves a local calendar day (e.g. "2026-07-02") in a given IANA
// timezone to its UTC start/end instants, using the offset at local
// midnight. Simplification: a day that crosses a DST transition will be
// off by the transition amount - acceptable for the MVP's daily metrics.
function utcOffsetMinutes(timeZone: string, atUtc: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(atUtc);

  const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+00:00";
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(raw);
  if (!match) return 0;

  const sign = match[1] === "-" ? -1 : 1;
  return sign * (parseInt(match[2], 10) * 60 + parseInt(match[3], 10));
}

export function dayBoundsUtc(day: string, timeZone: string) {
  const naiveStart = new Date(`${day}T00:00:00.000Z`);
  const offsetMinutes = utcOffsetMinutes(timeZone, naiveStart);
  const startUtc = new Date(naiveStart.getTime() - offsetMinutes * 60_000);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60_000);
  return { startUtc, endUtc };
}
