// Dates are plain "YYYY-MM-DD" strings (local calendar days, no time zone
// surprises). Every function takes `today` explicitly so it's testable.

const DAY_MS = 24 * 60 * 60 * 1000;

export function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(value, days) {
  return toDateString(new Date(Date.parse(`${value}T00:00:00Z`) + days * DAY_MS));
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

export function todayString(now = new Date()) {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return toDateString(local);
}
