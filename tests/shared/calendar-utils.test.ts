import { describe, expect, it } from "@dreamer/test";
import { getDaysInMonth } from "../../src/shared/data-display/calendar-utils.ts";

function ymd(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

describe("getDaysInMonth", () => {
  it("pads leading days in chronological order, not reversed", () => {
    // 2027-10-01 is Friday, so the first row is Sep 26–30 then Oct 1–2.
    const days = getDaysInMonth(2027, 9);
    expect(days.length % 7).toBe(0);
    expect(days.slice(0, 7).map(ymd)).toEqual([
      "2027-9-26",
      "2027-9-27",
      "2027-9-28",
      "2027-9-29",
      "2027-9-30",
      "2027-10-1",
      "2027-10-2",
    ]);
  });

  it("does not pad when the month starts on Sunday", () => {
    // 2026-11-01 is Sunday.
    const days = getDaysInMonth(2026, 10);
    expect(ymd(days[0]!)).toBe("2026-11-1");
    expect(ymd(days[29]!)).toBe("2026-11-30");
  });
});
