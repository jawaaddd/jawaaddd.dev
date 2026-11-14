import { describe, expect, it } from "vitest";
import { formatDate } from "./dates";

describe("formatDate", () => {
  it.each([
    ["2026-11-01T12:00:00Z", "Nov 1st 2026"],
    ["2026-11-02T12:00:00Z", "Nov 2nd 2026"],
    ["2026-11-03T12:00:00Z", "Nov 3rd 2026"],
    ["2026-11-04T12:00:00Z", "Nov 4th 2026"],
    ["2026-11-11T12:00:00Z", "Nov 11th 2026"],
    ["2026-11-12T12:00:00Z", "Nov 12th 2026"],
    ["2026-11-13T12:00:00Z", "Nov 13th 2026"],
    ["2026-11-21T12:00:00Z", "Nov 21st 2026"],
    ["2026-11-22T12:00:00Z", "Nov 22nd 2026"],
    ["2026-11-23T12:00:00Z", "Nov 23rd 2026"],
    ["2026-11-26T12:00:00Z", "Nov 26th 2026"],
    ["2026-12-31T12:00:00Z", "Dec 31st 2026"],
  ])("formats %s as %s", (iso, expected) => {
    expect(formatDate(iso)).toBe(expected);
  });

  it("uses New York time, not UTC", () => {
    // 11:30pm in New York on Nov 26th is already Nov 27th in UTC.
    expect(formatDate("2026-11-27T04:30:00Z")).toBe("Nov 26th 2026");
    // Summer time (EDT, UTC-4).
    expect(formatDate("2026-07-05T03:30:00Z")).toBe("Jul 4th 2026");
  });
});
