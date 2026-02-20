import { format as dateFnsFormat, toZonedTime } from 'date-fns-tz';
import { id } from 'date-fns/locale';

// Get timezone from environment variable, default to Asia/Jakarta (WIB)
const TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE || 'Asia/Jakarta';

/**
 * Get current date/time in Indonesian timezone
 */
export function getCurrentDateIndonesia(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

/**
 * Convert any date to Indonesian timezone
 */
export function toIndonesiaTime(date: Date | string): Date {
  return toZonedTime(new Date(date), TIMEZONE);
}

/**
 * Format date with Indonesian timezone
 */
export function formatIndonesiaDate(
  date: Date | string,
  formatStr: string = 'dd MMM yyyy HH:mm'
): string {
  const zonedDate = toIndonesiaTime(date);
  return dateFnsFormat(zonedDate, formatStr, { 
    locale: id,
    timeZone: TIMEZONE 
  });
}

/**
 * Get start of day in Indonesian timezone
 */
export function getStartOfDayIndonesia(date: Date = new Date()): Date {
  const zonedDate = toIndonesiaTime(date);
  zonedDate.setHours(0, 0, 0, 0);
  return zonedDate;
}

/**
 * Get end of day in Indonesian timezone
 */
export function getEndOfDayIndonesia(date: Date = new Date()): Date {
  const zonedDate = toIndonesiaTime(date);
  zonedDate.setHours(23, 59, 59, 999);
  return zonedDate;
}

/**
 * Format date for database (ISO string with timezone)
 */
export function toISOStringIndonesia(date: Date = new Date()): string {
  return toIndonesiaTime(date).toISOString();
}
