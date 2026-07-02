import { describe, expect, it } from "vitest";
import { computeFocusScore } from "./focus";

describe("computeFocusScore", () => {
  it("scores a fully free, unfragmented day near 100 from calendar data", () => {
    const result = computeFocusScore(
      { meetingMinutes: 0, deepWorkSlots: 1, transitions: 0 },
      null,
    );
    expect(result.score).toBe(100);
    expect(result.components.source).toBe("calendar");
  });

  it("penalizes a heavily fragmented, meeting-packed day", () => {
    const result = computeFocusScore(
      { meetingMinutes: 600, deepWorkSlots: 0, transitions: 8 },
      null,
    );
    expect(result.score).toBeLessThan(20);
  });

  it("rewards a day with a real 90+ minute block over one without, all else equal", () => {
    const withDeepWork = computeFocusScore(
      { meetingMinutes: 180, deepWorkSlots: 1, transitions: 2 },
      null,
    );
    const withoutDeepWork = computeFocusScore(
      { meetingMinutes: 180, deepWorkSlots: 0, transitions: 2 },
      null,
    );
    expect(withDeepWork.score!).toBeGreaterThan(withoutDeepWork.score!);
  });

  // No-calendar fallback: the brief requires the score to degrade cleanly
  // to the evening self-rating instead of failing or defaulting to zero.
  it("falls back to the self-rated focus score when no calendar is connected", () => {
    const result = computeFocusScore(null, 4);
    expect(result.score).toBe(80); // 4/5 * 20
    expect(result.components.source).toBe("self_report");
    expect(result.explanation).toMatch(/no calendar/i);
  });

  it("returns null when there is neither calendar data nor a self-rating", () => {
    const result = computeFocusScore(null, null);
    expect(result.score).toBeNull();
  });
});
