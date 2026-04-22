import { TZDate } from "@date-fns/tz"
import { format, type Locale } from "date-fns"

const DEFAULT_TZ = "Europe/Paris"

/**
 * Convert a UTC date to a TZDate in the given timezone (for display).
 * The returned TZDate can be passed directly to date-fns format().
 */
export function utcToTz(utcDate: string | Date, timezone: string = DEFAULT_TZ): TZDate {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate
  return new TZDate(date.getTime(), timezone)
}

/**
 * Convert a local date + time string to a UTC Date, interpreting
 * them in the given timezone. Use for session creation.
 *
 * e.g. localToUtc("2026-03-29", "13:00", "Europe/Paris")
 *   → Date representing 11:00 UTC (since CEST is UTC+2)
 */
export function localToUtc(dateStr: string, timeStr: string, timezone: string = DEFAULT_TZ): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  const [hour, minute] = timeStr.split(":").map(Number)
  const tzDate = new TZDate(year, month - 1, day, hour, minute, 0, timezone)
  return new Date(tzDate.getTime())
}

/**
 * Format a UTC date in the given timezone.
 * Shorthand for format(utcToTz(date, tz), pattern, options).
 */
export function formatInTz(
  utcDate: string | Date,
  pattern: string,
  timezone: string = DEFAULT_TZ,
  options?: { locale?: Locale }
): string {
  return format(utcToTz(utcDate, timezone), pattern, options)
}
