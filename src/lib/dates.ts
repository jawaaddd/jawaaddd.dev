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

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  return { 1: "st", 2: "nd", 3: "rd" }[day % 10] ?? "th";
}
