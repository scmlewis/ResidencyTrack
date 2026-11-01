/**
 * Timezone-safe calendar date manipulation utilities for ISO date strings (YYYY-MM-DD).
 * These functions prevent UTC/local date shifts and ensure deterministic calendar arithmetic.
 */

export function isValidIsoDate(dateStr: string | null | undefined): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12) return false;
  const daysInMonth = getDaysInMonth(year, month);
  return day >= 1 && day <= daysInMonth;
}

export function parseIsoDate(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-').map(Number);
  return { year: parts[0], month: parts[1], day: parts[2] };
}

export function formatIsoDate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: number, month: number): number {
  const daysMap = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysMap[month - 1];
}

/**
 * Difference in calendar days between two ISO date strings (end - start).
 * E.g., ('2024-06-01', '2024-06-10') returns 9.
 */
export function differenceInCalendarDays(startStr: string, endStr: string): number {
  const s = parseIsoDate(startStr);
  const e = parseIsoDate(endStr);
  const utcStart = Date.UTC(s.year, s.month - 1, s.day);
  const utcEnd = Date.UTC(e.year, e.month - 1, e.day);
  return Math.round((utcEnd - utcStart) / 86400000);
}

/**
 * Adds N calendar days to an ISO date string.
 */
export function addDays(dateStr: string, days: number): string {
  const { year, month, day } = parseIsoDate(dateStr);
  const utc = Date.UTC(year, month - 1, day) + days * 86400000;
  const d = new Date(utc);
  return formatIsoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/**
 * Subtracts N calendar days from an ISO date string.
 */
export function subDays(dateStr: string, days: number): string {
  return addDays(dateStr, -days);
}

/**
 * Adds calendar months to an ISO date string, clamping to the last valid day of the target month.
 */
export function addMonthsCalendar(dateStr: string, monthsToAdd: number): string {
  const { year, month, day } = parseIsoDate(dateStr);
  let totalMonths = (year * 12 + (month - 1)) + monthsToAdd;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const maxDay = getDaysInMonth(targetYear, targetMonth);
  const targetDay = Math.min(day, maxDay);
  return formatIsoDate(targetYear, targetMonth, targetDay);
}

/**
 * Adds calendar years to an ISO date string, handling leap years (e.g. Feb 29 -> Feb 28 on non-leap years).
 */
export function addYearsCalendar(dateStr: string, yearsToAdd: number): string {
  const { year, month, day } = parseIsoDate(dateStr);
  const targetYear = year + yearsToAdd;
  const maxDay = getDaysInMonth(targetYear, month);
  const targetDay = Math.min(day, maxDay);
  return formatIsoDate(targetYear, month, targetDay);
}

/**
 * Returns an array of ISO date strings for each day in [startDate, endDate] inclusive.
 */
export function getDaysInRange(startDate: string, endDate: string): string[] {
  if (startDate > endDate) return [];
  const days: string[] = [];
  let curr = startDate;
  while (curr <= endDate) {
    days.push(curr);
    curr = addDays(curr, 1);
  }
  return days;
}

/**
 * Formats ISO date string to readable UK format, e.g. "12 Jun 2024" or "12 June 2024".
 */
export function formatDisplayDate(dateStr: string | null | undefined, options?: { fullMonth?: boolean; showDayOfWeek?: boolean }): string {
  if (!dateStr || !isValidIsoDate(dateStr)) return 'Not set';
  const { year, month, day } = parseIsoDate(dateStr);
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsFull = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const mName = options?.fullMonth ? monthsFull[month - 1] : monthsShort[month - 1];
  
  if (options?.showDayOfWeek) {
    const d = new Date(Date.UTC(year, month - 1, day));
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${dayNames[d.getUTCDay()]}, ${day} ${mName} ${year}`;
  }
  
  return `${day} ${mName} ${year}`;
}
