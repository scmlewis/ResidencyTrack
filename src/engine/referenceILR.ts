import { TravelRecord, ImmigrationProfile, ILRComplianceResult } from '../types';
import { isValidIsoDate, addDays, addMonthsCalendar, addYearsCalendar, subDays, differenceInCalendarDays } from './dateUtils';
import { ILR_12_MONTH_MAX_ABSENCE } from '../policy/rules';
import { getTripAbsenceDaysInWindow } from './calculations';

/**
 * Independent BRUTE-FORCE reference implementation of the ILR rolling 12-month
 * absence calculation. It enumerates every calendar day in the qualifying period
 * as a candidate window start (no heuristic pruning) and computes the absence
 * total for the 12-calendar-month window [start, start+1yr-1day]. This is
 * deliberately O(days * trips) and is used only for cross-checking the
 * production heuristic in calculateILRContinuousResidence.
 */
export function calculateILRContinuousResidenceBruteForce(
  records: TravelRecord[],
  profile: ImmigrationProfile | null
): { maxAbsenceCount: number; peakStart: string | null; peakEnd: string | null } {
  const qualifyingStart = profile?.qualifyingPeriodStartDate;
  if (!qualifyingStart || !isValidIsoDate(qualifyingStart) || !profile?.qualifyingPeriodStartConfirmed) {
    return { maxAbsenceCount: 0, peakStart: null, peakEnd: null };
  }
  const qualifyingEnd = addYearsCalendar(qualifyingStart, 5);

  const validTrips = records.filter(
    r => r.departureDate && r.returnDate && isValidIsoDate(r.departureDate) && isValidIsoDate(r.returnDate) && r.departureDate < r.returnDate
  );

  let maxAbsence = 0;
  let peakStart: string | null = null;
  let peakEnd: string | null = null;

  let cur = qualifyingStart;
  while (cur <= qualifyingEnd) {
    const winEnd = subDays(addYearsCalendar(cur, 1), 1);
    // clamp winEnd to qualifyingEnd? Production uses winEnd possibly beyond qualifyingEnd; keep consistent with production (no clamp).
    let total = 0;
    for (const trip of validTrips) {
      total += getTripAbsenceDaysInWindow(trip.departureDate, trip.returnDate!, cur, winEnd);
    }
    if (total > maxAbsence) {
      maxAbsence = total;
      peakStart = cur;
      peakEnd = winEnd;
    }
    cur = addDays(cur, 1);
  }
  return { maxAbsenceCount: maxAbsence, peakStart, peakEnd };
}
