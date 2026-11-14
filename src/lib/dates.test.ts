import { describe, expect, it } from "vitest";
import { dateInputValue, formatDate, publishedAtFor } from "./dates";

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

describe("date inputs", () => {
  it("reads the New York day of an instant", () => {
    expect(dateInputValue("2026-11-27T04:30:00Z")).toBe("2026-11-26");
    expect(dateInputValue("2026-11-27T05:30:00Z")).toBe("2026-11-27");
  });

  it("dates other days at noon New York time", () => {
    const now = new Date("2026-11-14T15:00:00Z");
    expect(publishedAtFor("2026-11-21", null, now)).toBe("2026-11-21T17:00:00.000Z"); // EST
    expect(publishedAtFor("2026-07-04", null, now)).toBe("2026-07-04T16:00:00.000Z"); // EDT
  });

  it("uses the current time for today", () => {
    const now = new Date("2026-11-15T03:00:00Z"); // Nov 14th, 10pm in New York
    expect(publishedAtFor("2026-11-14", null, now)).toBe(now.toISOString());
  });

  it("keeps the stored time when the day is unchanged", () => {
    const previous = "2026-11-02T09:41:00.000Z";
    expect(publishedAtFor("2026-11-02", previous)).toBe(previous);
    expect(publishedAtFor("2026-11-03", previous)).toBe("2026-11-03T17:00:00.000Z");
  });
});
