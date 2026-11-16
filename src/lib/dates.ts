/** Dates on the site are shown in New York time, whatever the server's timezone. */
export const SITE_TIME_ZONE = "America/New_York";

const parts = new Intl.DateTimeFormat("en-US", {
  timeZone: SITE_TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** "Nov 26th 2026" */
export function formatDate(iso: string): string {
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.formatToParts(new Date(iso)).find((part) => part.type === type)!.value;
  const day = Number(get("day"));
  return `${get("month")} ${day}${ordinal(day)} ${get("year")}`;
}

const timeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: SITE_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

/** "2:03 PM" */
export const formatTime = (iso: string): string => timeFormat.format(new Date(iso));

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  return { 1: "st", 2: "nd", 3: "rd" }[day % 10] ?? "th";
}

// ---------- Date inputs (YYYY-MM-DD, as <input type="date"> uses) ----------

const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: SITE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The New York calendar day an instant falls on, as YYYY-MM-DD. */
export const dateInputValue = (instant: string | Date): string =>
  dayFormat.format(new Date(instant));

/**
 * The timestamp stored for a post dated `day`. Keeps `previous` when the day
 * hasn't changed (so an edit doesn't reorder the feed), uses the current time
 * for today, and noon New York time for any other day.
 */
export function publishedAtFor(day: string, previous?: string | null, now = new Date()): string {
  if (previous && dateInputValue(previous) === day) return previous;
  if (dateInputValue(now) === day) return now.toISOString();
  return zonedNoon(day).toISOString();
}

/** 12:00 on `day` in New York, whatever the server's timezone. */
function zonedNoon(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  const guess = Date.UTC(year, month - 1, date, 12);
  // How far New York's wall clock is from UTC at that moment (-4 or -5 hours).
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: SITE_TIME_ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
      .formatToParts(guess)
      .map((part) => [part.type, Number(part.value)]),
  );
  const wallClock = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return new Date(guess - (wallClock - guess));
}
