import {
  ImmigrationProfile,
  TravelRecord,
  ValidatedTravelRecord,
  TripValidationIssue,
  ILRComplianceResult,
  NaturalisationComplianceResult,
  RollingWindowAnalysis,
  TimelineMilestone,
  SimulationComparison,
  ComplianceStatus
} from '../types';
import {
  isValidIsoDate,
  differenceInCalendarDays,
  addDays,
  subDays,
  addYearsCalendar,
  addMonthsCalendar
} from './dateUtils';
import {
  ILR_12_MONTH_MAX_ABSENCE,
  NATURALISATION_5_YEAR_MAX_ABSENCE,
  NATURALISATION_FINAL_YEAR_MAX_ABSENCE,
  EARLIEST_ILR_WINDOW_DAYS,
  ILR_TO_NATURALISATION_MONTHS
} from '../policy/rules';

/**
 * Calculates Naturalisation absence days.
 * Rule: Count ONLY complete days spent outside the UK.
 * Formula: Return Date - Departure Date - 1.
 * Same-day departure and return = 0 days.
 */
export function calculateNaturalisationAbsenceDays(
  departureDate: string | null | undefined,
  returnDate: string | null | undefined
): number {
  if (!departureDate || !returnDate || !isValidIsoDate(departureDate) || !isValidIsoDate(returnDate)) {
    return 0;
  }
  const diff = differenceInCalendarDays(departureDate, returnDate);
  if (diff <= 1) {
    // Same-day (diff 0) or next-day (diff 1, where both departure and arrival days are partial days in UK)
    return 0;
  }
  return diff - 1;
}

/**
 * Calculates ILR absence days according to Appendix Continuous Residence.
 * Under UK Home Office Appendix Continuous Residence CR 2.2:
 * "Only whole days will be counted as absences: departure and arrival days in the UK are not counted as absence days."
 * Formula: Return Date - Departure Date - 1.
 */
export function calculateILRAbsenceDays(
  departureDate: string | null | undefined,
  returnDate: string | null | undefined
): number {
  return calculateNaturalisationAbsenceDays(departureDate, returnDate);
}

/**
 * Validates travel records, checking for missing dates, invalid ranges, duplicates, and overlaps.
 */
export function validateTravelRecords(
  records: TravelRecord[],
  profile?: ImmigrationProfile | null
): ValidatedTravelRecord[] {
  // Sort records by departureDate ascending
  const sorted = [...records].sort((a, b) => {
    if (!a.departureDate) return 1;
    if (!b.departureDate) return -1;
    return a.departureDate.localeCompare(b.departureDate);
  });

  const validated: ValidatedTravelRecord[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const trip = sorted[i];
    const issues: TripValidationIssue[] = [];
    let completeness: 'COMPLETE' | 'INCOMPLETE' | 'INVALID' = 'COMPLETE';

    if (!trip.departureDate || !isValidIsoDate(trip.departureDate)) {
      issues.push({
        recordId: trip.id,
        severity: 'error',
        message: 'Missing or invalid departure date',
        field: 'departureDate'
      });
      completeness = 'INCOMPLETE';
    }

    if (!trip.returnDate) {
      if (trip.status === 'ongoing') {
        issues.push({
          recordId: trip.id,
          severity: 'warning',
          message: 'Ongoing trip with no confirmed return date yet',
          field: 'returnDate'
        });
        completeness = 'INCOMPLETE';
      } else {
        issues.push({
          recordId: trip.id,
          severity: 'error',
          message: 'Missing return date for completed or planned trip',
          field: 'returnDate'
        });
        completeness = 'INCOMPLETE';
      }
    } else if (!isValidIsoDate(trip.returnDate)) {
      issues.push({
        recordId: trip.id,
        severity: 'error',
        message: 'Invalid return date format',
        field: 'returnDate'
      });
      completeness = 'INVALID';
    } else if (trip.departureDate && trip.returnDate < trip.departureDate) {
      issues.push({
        recordId: trip.id,
        severity: 'error',
        message: 'Return date cannot be earlier than departure date',
        field: 'returnDate'
      });
      completeness = 'INVALID';
    }

    if (!trip.destination || trip.destination.trim() === '') {
      issues.push({
        recordId: trip.id,
        severity: 'warning',
        message: 'Destination is not specified',
        field: 'destination'
      });
    }

    // Check overlap with other trips
    if (trip.departureDate && trip.returnDate && trip.departureDate <= trip.returnDate) {
      for (let j = 0; j < sorted.length; j++) {
        if (i === j) continue;
        const other = sorted[j];
        if (other.departureDate && other.returnDate && other.departureDate <= other.returnDate) {
          // Two trips overlap if trip.departureDate <= other.returnDate && trip.returnDate >= other.departureDate
          if (trip.departureDate <= other.returnDate && trip.returnDate >= other.departureDate) {
            // If they just touch on the same boundary day (e.g. trip 1 returns June 5 and trip 2 departs June 5),
            // in immigration tracking that is technically consecutive or overlapping:
            const isExactSameDates = trip.departureDate === other.departureDate && trip.returnDate === other.returnDate;
            if (isExactSameDates && i > j) {
              issues.push({
                recordId: trip.id,
                severity: 'error',
                message: `Duplicate trip record matching another entry to ${other.destination}`,
                field: 'general'
              });
              completeness = 'INVALID';
            } else if (trip.departureDate < other.returnDate && trip.returnDate > other.departureDate) {
              issues.push({
                recordId: trip.id,
                severity: 'warning',
                message: `Overlaps with trip to ${other.destination} (${other.departureDate} to ${other.returnDate})`,
                field: 'general'
              });
            }
          }
        }
      }
    }

    // Check if trip occurred before qualifying start date
    if (profile?.qualifyingPeriodStartDate && trip.returnDate && trip.returnDate < profile.qualifyingPeriodStartDate) {
      issues.push({
        recordId: trip.id,
        severity: 'warning',
        message: `Trip completed before qualifying period start date (${profile.qualifyingPeriodStartDate})`,
        field: 'general'
      });
    }

    const natDays = calculateNaturalisationAbsenceDays(trip.departureDate, trip.returnDate);
    const ilrDays = calculateILRAbsenceDays(trip.departureDate, trip.returnDate);

    validated.push({
      ...trip,
      completeness,
      validationIssues: issues,
      naturalisationDays: natDays,
      ilrDays
    });
  }

  return validated;
}

/**
 * Calculates the number of absence days for a single trip that fall within a given [windowStart, windowEnd] date range.
 * Whole absence days for a trip are between (departureDate + 1) and (returnDate - 1).
 */
export function getTripAbsenceDaysInWindow(
  departureDate: string,
  returnDate: string,
  windowStart: string,
  windowEnd: string
): number {
  if (!isValidIsoDate(departureDate) || !isValidIsoDate(returnDate)) return 0;
  if (departureDate >= returnDate) return 0;

  // First whole absence day = departureDate + 1
  const absenceStart = addDays(departureDate, 1);
  // Last whole absence day = returnDate - 1
  const absenceEnd = subDays(returnDate, 1);

  if (absenceStart > absenceEnd) return 0;

  // Overlap of [absenceStart, absenceEnd] with [windowStart, windowEnd]
  const effectiveStart = absenceStart > windowStart ? absenceStart : windowStart;
  const effectiveEnd = absenceEnd < windowEnd ? absenceEnd : windowEnd;

  if (effectiveStart > effectiveEnd) return 0;

  return differenceInCalendarDays(effectiveStart, effectiveEnd) + 1;
}

/**
 * Calculates ILR Continuous Residence compliance.
 * Evaluates the maximum absence within any rolling 12-month period across the 5-year qualifying period.
 */
export function calculateILRContinuousResidence(
  records: TravelRecord[],
  profile: ImmigrationProfile | null
): ILRComplianceResult {
  const qualifyingStart = profile?.qualifyingPeriodStartDate;
  
  if (!qualifyingStart || !isValidIsoDate(qualifyingStart) || !profile?.qualifyingPeriodStartConfirmed) {
    return {
      maxAbsenceCount: 0,
      threshold: ILR_12_MONTH_MAX_ABSENCE,
      remainingAllowance: ILR_12_MONTH_MAX_ABSENCE,
      peakWindow: null,
      status: 'INSUFFICIENT_DATA',
      hasIncompleteData: true,
      hasInvalidData: false,
      qualifyingStartDate: null,
      qualifyingEndDate: null,
      totalTripsCount: records.length,
      windowEvaluations: []
    };
  }

  // 5-year qualifying period ends at qualifyingStart + 5 calendar years
  const qualifyingEnd = addYearsCalendar(qualifyingStart, 5);

  // Filter completed & planned trips that have valid dates
  const validTrips = records.filter(
    r => r.departureDate && r.returnDate && isValidIsoDate(r.departureDate) && isValidIsoDate(r.returnDate) && r.departureDate < r.returnDate
  );

  const hasIncomplete = records.some(r => !r.departureDate || !r.returnDate);
  const hasInvalid = records.some(r => r.departureDate && r.returnDate && r.departureDate > r.returnDate);

  const completenessConfirmed = profile?.travelHistoryCompleteness === 'CONFIRMED_COMPLETE';

  if (hasIncomplete || hasInvalid || !completenessConfirmed) {
    return {
      maxAbsenceCount: 0,
      threshold: ILR_12_MONTH_MAX_ABSENCE,
      remainingAllowance: ILR_12_MONTH_MAX_ABSENCE,
      peakWindow: null,
      status: 'INSUFFICIENT_DATA',
      hasIncompleteData: hasIncomplete || !completenessConfirmed,
      hasInvalidData: hasInvalid,
      qualifyingStartDate: qualifyingStart,
      qualifyingEndDate: null,
      totalTripsCount: records.length,
      windowEvaluations: []
    };
  }

  if (validTrips.length === 0) {
    return {
      maxAbsenceCount: 0,
      threshold: ILR_12_MONTH_MAX_ABSENCE,
      remainingAllowance: ILR_12_MONTH_MAX_ABSENCE,
      peakWindow: null,
      status: completenessConfirmed ? 'WITHIN_NORMAL_LIMIT' : 'INSUFFICIENT_DATA',
      hasIncompleteData: completenessConfirmed ? hasIncomplete : true,
      hasInvalidData: hasInvalid,
      qualifyingStartDate: qualifyingStart,
      qualifyingEndDate: qualifyingEnd,
      totalTripsCount: records.length,
      windowEvaluations: []
    };
  }

  // Collect candidate anchor dates to test rolling 12-month windows.
  // Because absence curves only change slope at absence boundary points, testing:
  // 1. Qualifying period start
  // 2. Window starting on each trip's departureDate and (departureDate + 1)
  // 3. Window ending on each trip's returnDate and (returnDate - 1)
  // 4. Regular 15-day / monthly intervals across the 5-year period
  const candidateStartDates = new Set<string>();

  // Anchor at qualifying start
  candidateStartDates.add(qualifyingStart);

  // Monthly checkpoints across the 5-year journey
  let stepDate = qualifyingStart;
  while (stepDate < qualifyingEnd) {
    candidateStartDates.add(stepDate);
    stepDate = addMonthsCalendar(stepDate, 1);
  }

  // Anchors based on trips
  for (const trip of validTrips) {
    // Window starting at departure
    if (trip.departureDate >= qualifyingStart && trip.departureDate <= qualifyingEnd) {
      candidateStartDates.add(trip.departureDate);
      candidateStartDates.add(addDays(trip.departureDate, 1));
    }
    // Window ending at return date -> start date is 12 months earlier
    if (trip.returnDate && trip.returnDate >= qualifyingStart) {
      // 12 months prior
      const startForReturn = addMonthsCalendar(trip.returnDate, -12);
      if (startForReturn >= qualifyingStart && startForReturn <= qualifyingEnd) {
        candidateStartDates.add(startForReturn);
        candidateStartDates.add(addDays(startForReturn, 1));
      }
    }
    // Also window starting right after return
    if (trip.returnDate && trip.returnDate >= qualifyingStart && trip.returnDate <= qualifyingEnd) {
      candidateStartDates.add(trip.returnDate);
    }
  }

  let maxAbsence = 0;
  let peakWindow: RollingWindowAnalysis | null = null;
  const windowEvaluations: RollingWindowAnalysis[] = [];

  const sortedCandidateStarts = Array.from(candidateStartDates)
    .filter(d => d >= qualifyingStart && d <= qualifyingEnd)
    .sort();

  for (const winStart of sortedCandidateStarts) {
    // 12-calendar-month window end date:
    // Exactly 1 calendar year later minus 1 day (e.g. 2021-08-15 to 2022-08-14)
    const rawOneYearLater = addYearsCalendar(winStart, 1);
    const winEnd = subDays(rawOneYearLater, 1);

    let totalDaysInWindow = 0;
    const tripsInWindow: RollingWindowAnalysis['tripsInWindow'] = [];

    for (const trip of validTrips) {
      const days = getTripAbsenceDaysInWindow(trip.departureDate, trip.returnDate!, winStart, winEnd);
      if (days > 0) {
        totalDaysInWindow += days;
        tripsInWindow.push({
          tripId: trip.id,
          destination: trip.destination,
          overlappingDays: days,
          startDate: trip.departureDate,
          endDate: trip.returnDate!
        });
      }
    }

    let status: ComplianceStatus = 'WITHIN_NORMAL_LIMIT';
    if (totalDaysInWindow > ILR_12_MONTH_MAX_ABSENCE) {
      status = 'NORMAL_LIMIT_EXCEEDED';
    } else if (totalDaysInWindow >= 150) {
      status = 'APPROACHING_NORMAL_LIMIT';
    }

    const evaluation: RollingWindowAnalysis = {
      startDate: winStart,
      endDate: winEnd,
      absenceDays: totalDaysInWindow,
      threshold: ILR_12_MONTH_MAX_ABSENCE,
      remainingAllowance: Math.max(0, ILR_12_MONTH_MAX_ABSENCE - totalDaysInWindow),
      status,
      tripsInWindow
    };

    windowEvaluations.push(evaluation);

    if (totalDaysInWindow > maxAbsence || peakWindow === null) {
      maxAbsence = totalDaysInWindow;
      peakWindow = evaluation;
    }
  }

  let overallStatus: ComplianceStatus = 'WITHIN_NORMAL_LIMIT';
  if (maxAbsence > ILR_12_MONTH_MAX_ABSENCE) {
    overallStatus = 'NORMAL_LIMIT_EXCEEDED';
  } else if (maxAbsence >= 150) {
    overallStatus = 'APPROACHING_NORMAL_LIMIT';
  }

  return {
    maxAbsenceCount: maxAbsence,
    threshold: ILR_12_MONTH_MAX_ABSENCE,
    remainingAllowance: Math.max(0, ILR_12_MONTH_MAX_ABSENCE - maxAbsence),
    peakWindow,
    status: overallStatus,
    hasIncompleteData: hasIncomplete,
    hasInvalidData: hasInvalid,
    qualifyingStartDate: qualifyingStart,
    qualifyingEndDate: qualifyingEnd,
    totalTripsCount: records.length,
    windowEvaluations
  };
}

/**
 * Calculates Naturalisation requirements:
 * 1. 5-year residence: total whole-day absences <= 450 days.
 * 2. Final 12 months: total whole-day absences <= 90 days.
 * 3. Physical presence on the first day of the 5-year qualifying period.
 */
export function calculateNaturalisationRequirements(
  records: TravelRecord[],
  profile: ImmigrationProfile | null,
  targetApplicationDate?: string
): NaturalisationComplianceResult {
  const qualifyingStart = profile?.qualifyingPeriodStartDate;

  if (!qualifyingStart || !isValidIsoDate(qualifyingStart) || !profile?.qualifyingPeriodStartConfirmed) {
    return {
      fiveYearAbsenceDays: 0,
      fiveYearThreshold: NATURALISATION_5_YEAR_MAX_ABSENCE,
      fiveYearRemainingAllowance: NATURALISATION_5_YEAR_MAX_ABSENCE,
      fiveYearStatus: 'INSUFFICIENT_DATA',
      final12MonthsAbsenceDays: 0,
      final12MonthsThreshold: NATURALISATION_FINAL_YEAR_MAX_ABSENCE,
      final12MonthsRemainingAllowance: NATURALISATION_FINAL_YEAR_MAX_ABSENCE,
      final12MonthsStatus: 'INSUFFICIENT_DATA',
      fiveYearPeriodStart: null,
      fiveYearPeriodEnd: null,
      final12MonthsStart: null,
      final12MonthsEnd: null,
      presentOnDay1: null,
      hasIncompleteData: true
    };
  }
  const defaultFiveYearEnd = qualifyingStart && isValidIsoDate(qualifyingStart)
    ? addYearsCalendar(qualifyingStart, 5)
    : null;

  // The citizenship application date is typically after holding ILR for 12 months.
  // If actual ILR grant date exists, target = actualILR + 12 months.
  // Otherwise default to 5-year anniversary or user target.
  let appDate = targetApplicationDate;
  if (!appDate) {
    if (profile?.actualILRGrantDate && isValidIsoDate(profile.actualILRGrantDate)) {
      appDate = addMonthsCalendar(profile.actualILRGrantDate, ILR_TO_NATURALISATION_MONTHS);
    } else if (defaultFiveYearEnd) {
      // 5-year settlement + 12 months with ILR
      appDate = addMonthsCalendar(defaultFiveYearEnd, ILR_TO_NATURALISATION_MONTHS);
    }
  }

  if (!appDate || !isValidIsoDate(appDate)) {
    return {
      fiveYearAbsenceDays: 0,
      fiveYearThreshold: NATURALISATION_5_YEAR_MAX_ABSENCE,
      fiveYearRemainingAllowance: NATURALISATION_5_YEAR_MAX_ABSENCE,
      fiveYearStatus: 'INSUFFICIENT_DATA',
      final12MonthsAbsenceDays: 0,
      final12MonthsThreshold: NATURALISATION_FINAL_YEAR_MAX_ABSENCE,
      final12MonthsRemainingAllowance: NATURALISATION_FINAL_YEAR_MAX_ABSENCE,
      final12MonthsStatus: 'INSUFFICIENT_DATA',
      fiveYearPeriodStart: null,
      fiveYearPeriodEnd: null,
      final12MonthsStart: null,
      final12MonthsEnd: null,
      presentOnDay1: null,
      hasIncompleteData: true
    };
  }

  // 5-year qualifying period for Naturalisation:
  // Starts exactly 5 calendar years before the application date
  const fiveYearStart = addDays(addYearsCalendar(appDate, -5), 1);
  const fiveYearEnd = appDate;

  // Final 12 months period:
  // Starts 12 calendar months before the application date
  const final12Start = addMonthsCalendar(appDate, -12);
  const final12End = appDate;

  const validTrips = records.filter(
    r => r.departureDate && r.returnDate && isValidIsoDate(r.departureDate) && isValidIsoDate(r.returnDate) && r.departureDate < r.returnDate
  );

  const hasIncomplete = records.some(r => !r.departureDate || !r.returnDate);
  const hasInvalid = records.some(r => r.departureDate && r.returnDate && (!isValidIsoDate(r.departureDate) || !isValidIsoDate(r.returnDate) || r.departureDate > r.returnDate));

  const completenessConfirmed = profile?.travelHistoryCompleteness === 'CONFIRMED_COMPLETE';

  if (hasIncomplete || hasInvalid || !completenessConfirmed) {
    return {
      fiveYearAbsenceDays: 0,
      fiveYearThreshold: NATURALISATION_5_YEAR_MAX_ABSENCE,
      fiveYearRemainingAllowance: NATURALISATION_5_YEAR_MAX_ABSENCE,
      fiveYearStatus: 'INSUFFICIENT_DATA',
      final12MonthsAbsenceDays: 0,
      final12MonthsThreshold: NATURALISATION_FINAL_YEAR_MAX_ABSENCE,
      final12MonthsRemainingAllowance: NATURALISATION_FINAL_YEAR_MAX_ABSENCE,
      final12MonthsStatus: 'INSUFFICIENT_DATA',
      fiveYearPeriodStart: null,
      fiveYearPeriodEnd: null,
      final12MonthsStart: null,
      final12MonthsEnd: null,
      presentOnDay1: null,
      hasIncompleteData: hasIncomplete || !completenessConfirmed
    };
  }

  if (records.length === 0 && !completenessConfirmed) {
    return {
      fiveYearAbsenceDays: 0,
      fiveYearThreshold: NATURALISATION_5_YEAR_MAX_ABSENCE,
      fiveYearRemainingAllowance: NATURALISATION_5_YEAR_MAX_ABSENCE,
      fiveYearStatus: 'INSUFFICIENT_DATA',
      final12MonthsAbsenceDays: 0,
      final12MonthsThreshold: NATURALISATION_FINAL_YEAR_MAX_ABSENCE,
      final12MonthsRemainingAllowance: NATURALISATION_FINAL_YEAR_MAX_ABSENCE,
      final12MonthsStatus: 'INSUFFICIENT_DATA',
      fiveYearPeriodStart: null,
      fiveYearPeriodEnd: null,
      final12MonthsStart: null,
      final12MonthsEnd: null,
      presentOnDay1: null,
      hasIncompleteData: true
    };
  }

  // 1. Calculate 5-year whole absence days
  let total5YearAbsence = 0;
  for (const trip of validTrips) {
    total5YearAbsence += getTripAbsenceDaysInWindow(trip.departureDate, trip.returnDate!, fiveYearStart, fiveYearEnd);
  }

  // 2. Calculate final 12 months whole absence days
  let totalFinal12Absence = 0;
  for (const trip of validTrips) {
    totalFinal12Absence += getTripAbsenceDaysInWindow(trip.departureDate, trip.returnDate!, final12Start, final12End);
  }

  // 3. Physical presence on the first day of the 5-year period (fiveYearStart)
  // An applicant is absent on fiveYearStart if fiveYearStart falls strictly within a whole absence range
  let presentOnDay1 = true;
  for (const trip of validTrips) {
    const wholeAbsenceStart = addDays(trip.departureDate, 1);
    const wholeAbsenceEnd = subDays(trip.returnDate!, 1);
    if (fiveYearStart >= wholeAbsenceStart && fiveYearStart <= wholeAbsenceEnd) {
      presentOnDay1 = false;
      break;
    }
  }

  // Status for 5-year
  let fiveYearStatus: ComplianceStatus = 'WITHIN_NORMAL_LIMIT';
  if (total5YearAbsence > NATURALISATION_5_YEAR_MAX_ABSENCE) {
    fiveYearStatus = 'NORMAL_LIMIT_EXCEEDED';
  } else if (total5YearAbsence >= 400) {
    fiveYearStatus = 'APPROACHING_NORMAL_LIMIT';
  }

  // Status for final 12 months
  let final12Status: ComplianceStatus = 'WITHIN_NORMAL_LIMIT';
  if (totalFinal12Absence > NATURALISATION_FINAL_YEAR_MAX_ABSENCE) {
    final12Status = 'NORMAL_LIMIT_EXCEEDED';
  } else if (totalFinal12Absence >= 75) {
    final12Status = 'APPROACHING_NORMAL_LIMIT';
  }

  return {
    fiveYearAbsenceDays: total5YearAbsence,
    fiveYearThreshold: NATURALISATION_5_YEAR_MAX_ABSENCE,
    fiveYearRemainingAllowance: Math.max(0, NATURALISATION_5_YEAR_MAX_ABSENCE - total5YearAbsence),
    fiveYearStatus,
    final12MonthsAbsenceDays: totalFinal12Absence,
    final12MonthsThreshold: NATURALISATION_FINAL_YEAR_MAX_ABSENCE,
    final12MonthsRemainingAllowance: Math.max(0, NATURALISATION_FINAL_YEAR_MAX_ABSENCE - totalFinal12Absence),
    final12MonthsStatus: final12Status,
    fiveYearPeriodStart: fiveYearStart,
    fiveYearPeriodEnd: fiveYearEnd,
    final12MonthsStart: final12Start,
    final12MonthsEnd: final12End,
    presentOnDay1,
    hasIncompleteData: hasIncomplete
  };
}

/**
 * Calculates key immigration milestones from the immigration profile.
 */
export function calculateMilestones(profile: ImmigrationProfile | null, referenceDate?: string): TimelineMilestone[] {
  const milestones: TimelineMilestone[] = [];
  const today = referenceDate || new Date().toISOString().slice(0, 10);

  // 1. Visa Grant
  milestones.push({
    id: 'visa_grant',
    type: 'visa_grant',
    title: 'BN(O) Visa Granted',
    date: profile?.visaGrantDate || null,
    dateClassification: profile?.visaGrantDate ? 'confirmed' : 'user_estimate',
    description: 'Date the Home Office approved your initial BN(O) visa status.',
    completed: Boolean(profile?.visaGrantDate && profile.visaGrantDate <= today)
  });

  // 2. First UK Arrival
  milestones.push({
    id: 'first_arrival',
    type: 'first_arrival',
    title: 'First UK Physical Arrival',
    date: profile?.firstUKArrivalDate || null,
    dateClassification: profile?.firstUKArrivalDate ? 'confirmed' : 'user_estimate',
    description: 'The date you physically arrived in the United Kingdom to activate residency.',
    completed: Boolean(profile?.firstUKArrivalDate && profile.firstUKArrivalDate <= today)
  });

  // 3. Qualifying Period Start
  milestones.push({
    id: 'qualifying_start',
    type: 'qualifying_start',
    title: 'Qualifying Continuous Residence Start',
    date: profile?.qualifyingPeriodStartDate || null,
    dateClassification: profile?.qualifyingPeriodStartConfirmed ? 'confirmed' : 'user_estimate',
    description: 'The baseline date from which your 5-year continuous residence clock starts.',
    completed: Boolean(profile?.qualifyingPeriodStartDate && profile.qualifyingPeriodStartDate <= today)
  });

  // 4. Five-Year Settlement Anniversary
  let fiveYearAnniversary: string | null = null;
  if (profile?.qualifyingPeriodStartDate && isValidIsoDate(profile.qualifyingPeriodStartDate)) {
    fiveYearAnniversary = addYearsCalendar(profile.qualifyingPeriodStartDate, 5);
  }

  milestones.push({
    id: 'five_year_anniversary',
    type: 'five_year_anniversary',
    title: '5-Year Continuous Residence Milestone',
    date: fiveYearAnniversary,
    dateClassification: 'system_projection',
    description: 'Full completion of the statutory 5-year UK continuous residence requirement.',
    completed: Boolean(fiveYearAnniversary && fiveYearAnniversary <= today),
    daysRemaining: fiveYearAnniversary ? Math.max(0, differenceInCalendarDays(today, fiveYearAnniversary)) : undefined
  });

  // 5. Earliest Estimated ILR Application Window
  let earliestILRDate: string | null = null;
  if (fiveYearAnniversary) {
    earliestILRDate = subDays(fiveYearAnniversary, EARLIEST_ILR_WINDOW_DAYS);
  }

  milestones.push({
    id: 'earliest_ilr_application',
    type: 'earliest_ilr_application',
    title: 'Earliest ILR Application Window Opens',
    date: earliestILRDate,
    dateClassification: 'system_projection',
    description: 'Home Office allows ILR submission up to 28 days before completing 5 continuous years.',
    completed: Boolean(earliestILRDate && earliestILRDate <= today),
    daysRemaining: earliestILRDate ? Math.max(0, differenceInCalendarDays(today, earliestILRDate)) : undefined
  });

  // 6. Actual ILR Grant
  if (profile?.actualILRGrantDate) {
    milestones.push({
      id: 'actual_ilr_grant',
      type: 'actual_ilr_grant',
      title: 'ILR Settled Status Granted',
      date: profile.actualILRGrantDate,
      dateClassification: 'confirmed',
      description: 'Official grant of Indefinite Leave to Remain in the United Kingdom.',
      completed: true
    });
  }

  // 7. Earliest Estimated Naturalisation (British Citizenship)
  let earliestNatDate: string | null = null;
  let natClassification: 'confirmed' | 'user_estimate' | 'system_projection' = 'system_projection';

  if (profile?.actualILRGrantDate && isValidIsoDate(profile.actualILRGrantDate)) {
    earliestNatDate = addMonthsCalendar(profile.actualILRGrantDate, ILR_TO_NATURALISATION_MONTHS);
    natClassification = 'system_projection';
  } else if (fiveYearAnniversary) {
    // Projected based on estimated ILR + 12 months
    earliestNatDate = addMonthsCalendar(fiveYearAnniversary, ILR_TO_NATURALISATION_MONTHS);
    natClassification = 'system_projection';
  }

  milestones.push({
    id: 'earliest_naturalisation_application',
    type: 'earliest_naturalisation_application',
    title: 'Earliest British Citizenship Eligibility',
    date: earliestNatDate,
    dateClassification: natClassification,
    description: 'Requires holding ILR settled status for at least 12 full calendar months.',
    completed: Boolean(earliestNatDate && earliestNatDate <= today),
    daysRemaining: earliestNatDate ? Math.max(0, differenceInCalendarDays(today, earliestNatDate)) : undefined
  });

  return milestones;
}

/**
 * Simulates the impact of a proposed travel booking on ILR and Naturalisation absence limits.
 * Does NOT mutate or persist the existing records.
 */
export function simulateTravelImpact(
  currentRecords: TravelRecord[],
  proposedTrip: { departureDate: string; returnDate: string; destination: string; purpose: string },
  profile: ImmigrationProfile | null
): SimulationComparison {
  const currentILR = calculateILRContinuousResidence(currentRecords, profile);
  const currentNat = calculateNaturalisationRequirements(currentRecords, profile);

  const simulatedRecord: TravelRecord = {
    id: 'simulated_trip_' + Date.now(),
    departureDate: proposedTrip.departureDate,
    returnDate: proposedTrip.returnDate,
    destination: proposedTrip.destination,
    purpose: proposedTrip.purpose,
    status: 'planned',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const augmentedRecords = [...currentRecords, simulatedRecord];

  const simulatedILR = calculateILRContinuousResidence(augmentedRecords, profile);
  const simulatedNat = calculateNaturalisationRequirements(augmentedRecords, profile);

  const tripAbsenceDays = calculateNaturalisationAbsenceDays(proposedTrip.departureDate, proposedTrip.returnDate);

  const createsBreach =
    simulatedILR.status === 'NORMAL_LIMIT_EXCEEDED' ||
    simulatedNat.fiveYearStatus === 'NORMAL_LIMIT_EXCEEDED' ||
    simulatedNat.final12MonthsStatus === 'NORMAL_LIMIT_EXCEEDED';

  return {
    ilr: {
      beforePeak: currentILR.maxAbsenceCount,
      afterPeak: simulatedILR.maxAbsenceCount,
      beforeStatus: currentILR.status,
      afterStatus: simulatedILR.status,
      delta: simulatedILR.maxAbsenceCount - currentILR.maxAbsenceCount,
      newPeakWindow: simulatedILR.peakWindow ? {
        startDate: simulatedILR.peakWindow.startDate,
        endDate: simulatedILR.peakWindow.endDate
      } : undefined
    },
    naturalisation5Year: {
      beforeDays: currentNat.fiveYearAbsenceDays,
      afterDays: simulatedNat.fiveYearAbsenceDays,
      beforeStatus: currentNat.fiveYearStatus,
      afterStatus: simulatedNat.fiveYearStatus,
      delta: simulatedNat.fiveYearAbsenceDays - currentNat.fiveYearAbsenceDays
    },
    naturalisationFinal12: {
      beforeDays: currentNat.final12MonthsAbsenceDays,
      afterDays: simulatedNat.final12MonthsAbsenceDays,
      beforeStatus: currentNat.final12MonthsStatus,
      afterStatus: simulatedNat.final12MonthsStatus,
      delta: simulatedNat.final12MonthsAbsenceDays - currentNat.final12MonthsAbsenceDays
    },
    simulatedTripAbsenceDays: tripAbsenceDays,
    createsThresholdBreach: createsBreach
  };
}
