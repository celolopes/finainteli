/**
 * Date formatting utilities
 *
 * These functions handle date conversions safely without timezone issues.
 */

/**
 * Converts a Date object to ISO date string (YYYY-MM-DD) in local timezone.
 *
 * IMPORTANT: This preserves the local date without converting to UTC.
 * Unlike toISOString(), which converts to UTC first (potentially changing the date),
 * this function uses local getFullYear/getMonth/getDate.
 *
 * Example: If local time is 2024-01-15 23:30 GMT-3,
 *   - toISOString() would return "2024-01-16" (UTC date)
 *   - getLocalISODate() returns "2024-01-15" (local date)
 *
 * @param date - The Date object to convert
 * @returns ISO date string in format YYYY-MM-DD
 */
export const getLocalISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Gets today's local date as ISO string (YYYY-MM-DD)
 * @returns Today's date in local timezone
 */
export const getTodayLocalISO = (): string => {
  return getLocalISODate(new Date());
};

/**
 * Creates a Date object from ISO string (YYYY-MM-DD) interpreted as local date.
 *
 * @param isoDate - ISO date string in format YYYY-MM-DD
 * @returns Date object with time set to midnight local time
 */
export const parseLocalISODate = (isoDate: string): Date => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
};
