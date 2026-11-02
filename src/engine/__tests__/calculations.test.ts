import { describe, it, expect } from 'vitest';
import {
  calculateNaturalisationAbsenceDays,
  calculateILRAbsenceDays,
  calculateILRContinuousResidence,
  calculateNaturalisationRequirements,
  validateTravelRecords,
  simulateTravelImpact
} from '../calculations';
import {
  differenceInCalendarDays,
  addDays,
  addYearsCalendar,
  isLeapYear
} from '../dateUtils';
import { ImmigrationProfile, TravelRecord } from '../../types';

describe('ResidencyTrack PRD Required Calculation Test Suite', () => {
  // Test 1: Same-day UK departure and return
  it('1. Same-day UK departure and return gives 0 Naturalisation absence days', () => {
    const days = calculateNaturalisationAbsenceDays('2024-05-10', '2024-05-10');
    expect(days).toBe(0);
  });

  // Test 2: Departure 1 June, return 10 June
  it('2. Departure 1 June, return 10 June gives 8 Naturalisation absence days', () => {
    const days = calculateNaturalisationAbsenceDays('2024-06-01', '2024-06-10');
    expect(days).toBe(8);
  });

  // Test 3: Departure 31 December, return 3 January
  it('3. Departure 31 December, return 3 January gives 2 Naturalisation absence days', () => {
    const days = calculateNaturalisationAbsenceDays('2023-12-31', '2024-01-03');
    expect(days).toBe(2);
  });

  // Test 4: Leap-year February calendar arithmetic
  it('4. Leap-year February handles leap day accurately', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2023)).toBe(false);

    // Difference between Feb 28, 2024 and March 1, 2024 in a leap year is 2 days (Feb 29 exists)
    const diffLeap = differenceInCalendarDays('2024-02-28', '2024-03-01');
    expect(diffLeap).toBe(2);

    // Trip departing Feb 20, 2024 and returning March 5, 2024 in leap year
    // Feb 20 to Mar 5 is 14 days difference -> 13 absence days
    const days = calculateNaturalisationAbsenceDays('2024-02-20', '2024-03-05');
    expect(days).toBe(13);

    // Adding 5 years to 2024-02-29 yields 2029-02-28 on non-leap year
    const fiveYears = addYearsCalendar('2024-02-29', 5);
    expect(fiveYears).toBe('2029-02-28');
  });

  // Test 5: Exactly 180 ILR absence days
  it('5. Exactly 180 ILR absence days is WITHIN normal threshold', () => {
    const profile: ImmigrationProfile = {
      id: 'p1',
      visaRoute: 'BNO',
      visaGrantDate: '2021-08-01',
      firstUKArrivalDate: '2021-08-15',
      qualifyingPeriodStartDate: '2021-08-15',
      qualifyingPeriodStartConfirmed: true,
      actualILRGrantDate: null,
      naturalisationRoute: 'standard_5_year',
      travelHistoryCompleteness: 'CONFIRMED_COMPLETE',
      createdAt: '2021-08-15',
      updatedAt: '2021-08-15'
    };

    // A trip that produces exactly 180 days absence:
    // departure: 2022-01-01, return: 2022-07-01 -> diff is 181 days -> 180 absence days
    const returnDate = addDays('2022-01-01', 181);
    const tripDays = calculateILRAbsenceDays('2022-01-01', returnDate);
    expect(tripDays).toBe(180);

    const records: TravelRecord[] = [
      {
        id: 't1',
        departureDate: '2022-01-01',
        returnDate: returnDate,
        destination: 'Hong Kong',
        purpose: 'Family',
        status: 'completed',
        createdAt: '2022-01-01',
        updatedAt: '2022-01-01'
      }
    ];

    const result = calculateILRContinuousResidence(records, profile);
    expect(result.maxAbsenceCount).toBe(180);
    expect(result.remainingAllowance).toBe(0);
    expect(result.status).toBe('APPROACHING_NORMAL_LIMIT'); // Within 180, but at 180 boundary
    expect(result.status !== 'NORMAL_LIMIT_EXCEEDED').toBe(true);
  });

  // Test 6: 181 ILR absence days
  it('6. 181 ILR absence days results in NORMAL LIMIT EXCEEDED', () => {
    const profile: ImmigrationProfile = {
      id: 'p1',
      visaRoute: 'BNO',
      visaGrantDate: '2021-08-01',
      firstUKArrivalDate: '2021-08-15',
      qualifyingPeriodStartDate: '2021-08-15',
      qualifyingPeriodStartConfirmed: true,
      actualILRGrantDate: null,
      naturalisationRoute: 'standard_5_year',
      travelHistoryCompleteness: 'CONFIRMED_COMPLETE',
      createdAt: '2021-08-15',
      updatedAt: '2021-08-15'
    };

    // Trip with 181 absence days: diff 182
    const returnDate = addDays('2022-01-01', 182);
    expect(calculateILRAbsenceDays('2022-01-01', returnDate)).toBe(181);

    const records: TravelRecord[] = [
      {
        id: 't1',
        departureDate: '2022-01-01',
        returnDate: returnDate,
        destination: 'Hong Kong',
        purpose: 'Family',
        status: 'completed',
        createdAt: '2022-01-01',
        updatedAt: '2022-01-01'
      }
    ];

    const result = calculateILRContinuousResidence(records, profile);
    expect(result.maxAbsenceCount).toBe(181);
    expect(result.status).toBe('NORMAL_LIMIT_EXCEEDED');
  });

  // Test 7: Exactly 450 Naturalisation absence days
  it('7. Exactly 450 Naturalisation absence days is within normal threshold', () => {
    const profile: ImmigrationProfile = {
      id: 'p1',
      visaRoute: 'BNO',
      visaGrantDate: '2021-08-01',
      firstUKArrivalDate: '2021-08-15',
      qualifyingPeriodStartDate: '2021-08-15',
      qualifyingPeriodStartConfirmed: true,
      actualILRGrantDate: null,
      naturalisationRoute: 'standard_5_year',
      travelHistoryCompleteness: 'CONFIRMED_COMPLETE',
      createdAt: '2021-08-15',
      updatedAt: '2021-08-15'
    };

    // Spread across years: e.g. 5 trips of 90 days = 450 days total
    const records: TravelRecord[] = [
      { id: '1', departureDate: '2022-01-01', returnDate: addDays('2022-01-01', 91), destination: 'HK', purpose: 'Visit', status: 'completed', createdAt: '', updatedAt: '' },
      { id: '2', departureDate: '2022-07-01', returnDate: addDays('2022-07-01', 91), destination: 'HK', purpose: 'Visit', status: 'completed', createdAt: '', updatedAt: '' },
      { id: '3', departureDate: '2023-01-01', returnDate: addDays('2023-01-01', 91), destination: 'HK', purpose: 'Visit', status: 'completed', createdAt: '', updatedAt: '' },
      { id: '4', departureDate: '2023-07-01', returnDate: addDays('2023-07-01', 91), destination: 'HK', purpose: 'Visit', status: 'completed', createdAt: '', updatedAt: '' },
      { id: '5', departureDate: '2024-01-01', returnDate: addDays('2024-01-01', 91), destination: 'HK', purpose: 'Visit', status: 'completed', createdAt: '', updatedAt: '' }
    ];

    const result = calculateNaturalisationRequirements(records, profile, '2026-08-15');
    expect(result.fiveYearAbsenceDays).toBe(450);
    expect(result.fiveYearStatus !== 'NORMAL_LIMIT_EXCEEDED').toBe(true);
  });

  // Test 8: 451 Naturalisation absence days
  it('8. 451 Naturalisation absence days results in NORMAL LIMIT EXCEEDED', () => {
    const profile: ImmigrationProfile = {
      id: 'p1',
      visaRoute: 'BNO',
      visaGrantDate: '2021-08-01',
      firstUKArrivalDate: '2021-08-15',
      qualifyingPeriodStartDate: '2021-08-15',
      qualifyingPeriodStartConfirmed: true,
      actualILRGrantDate: null,
      naturalisationRoute: 'standard_5_year',
      travelHistoryCompleteness: 'CONFIRMED_COMPLETE',
      createdAt: '2021-08-15',
      updatedAt: '2021-08-15'
    };

    const records: TravelRecord[] = [
      { id: '1', departureDate: '2022-01-01', returnDate: addDays('2022-01-01', 91), destination: 'HK', purpose: 'Visit', status: 'completed', createdAt: '', updatedAt: '' },
      { id: '2', departureDate: '2022-07-01', returnDate: addDays('2022-07-01', 91), destination: 'HK', purpose: 'Visit', status: 'completed', createdAt: '', updatedAt: '' },
      { id: '3', departureDate: '2023-01-01', returnDate: addDays('2023-01-01', 91), destination: 'HK', purpose: 'Visit', status: 'completed', createdAt: '', updatedAt: '' },
      { id: '4', departureDate: '2023-07-01', returnDate: addDays('2023-07-01', 91), destination: 'HK', purpose: 'Visit', status: 'completed', createdAt: '', updatedAt: '' },
      { id: '5', departureDate: '2024-01-01', returnDate: addDays('2024-01-01', 92), destination: 'HK', purpose: 'Visit', status: 'completed', createdAt: '', updatedAt: '' }
    ];

    const result = calculateNaturalisationRequirements(records, profile, '2026-08-15');
    expect(result.fiveYearAbsenceDays).toBe(451);
    expect(result.fiveYearStatus).toBe('NORMAL_LIMIT_EXCEEDED');
  });

  // Test 9: Exactly 90 final-12-month days
  it('9. Exactly 90 final-12-month days is within normal threshold', () => {
    const profile: ImmigrationProfile = {
      id: 'p1',
      visaRoute: 'BNO',
      visaGrantDate: '2021-08-01',
      firstUKArrivalDate: '2021-08-15',
      qualifyingPeriodStartDate: '2021-08-15',
      qualifyingPeriodStartConfirmed: true,
      actualILRGrantDate: null,
      naturalisationRoute: 'standard_5_year',
      travelHistoryCompleteness: 'CONFIRMED_COMPLETE',
      createdAt: '2021-08-15',
      updatedAt: '2021-08-15'
    };

    // Target application date: 2026-08-15.
    // Final 12 months is 2025-08-15 to 2026-08-15.
    // Trip with 90 absence days:
    const records: TravelRecord[] = [
      {
        id: 't-final',
        departureDate: '2026-01-01',
        returnDate: addDays('2026-01-01', 91), // 90 absence days
        destination: 'Spain',
        purpose: 'Holiday',
        status: 'completed',
        createdAt: '',
        updatedAt: ''
      }
    ];

    const result = calculateNaturalisationRequirements(records, profile, '2026-08-15');
    expect(result.final12MonthsAbsenceDays).toBe(90);
    expect(result.final12MonthsStatus !== 'NORMAL_LIMIT_EXCEEDED').toBe(true);
  });

  // Test 10: 91 final-12-month days
  it('10. 91 final-12-month days results in NORMAL LIMIT EXCEEDED', () => {
    const profile: ImmigrationProfile = {
      id: 'p1',
      visaRoute: 'BNO',
      visaGrantDate: '2021-08-01',
      firstUKArrivalDate: '2021-08-15',
      qualifyingPeriodStartDate: '2021-08-15',
      qualifyingPeriodStartConfirmed: true,
      actualILRGrantDate: null,
      naturalisationRoute: 'standard_5_year',
      travelHistoryCompleteness: 'CONFIRMED_COMPLETE',
      createdAt: '2021-08-15',
      updatedAt: '2021-08-15'
    };

    const records: TravelRecord[] = [
      {
        id: 't-final',
        departureDate: '2026-01-01',
        returnDate: addDays('2026-01-01', 92), // 91 absence days
        destination: 'Spain',
        purpose: 'Holiday',
        status: 'completed',
        createdAt: '',
        updatedAt: ''
      }
    ];

    const result = calculateNaturalisationRequirements(records, profile, '2026-08-15');
    expect(result.final12MonthsAbsenceDays).toBe(91);
    expect(result.final12MonthsStatus).toBe('NORMAL_LIMIT_EXCEEDED');
  });

  // Test 11: Two overlapping trips
  it('11. Two overlapping trips triggers a validation warning', () => {
    const records: TravelRecord[] = [
      {
        id: 'trip1',
        departureDate: '2024-06-01',
        returnDate: '2024-06-15',
        destination: 'France',
        purpose: 'Holiday',
        status: 'completed',
        createdAt: '',
        updatedAt: ''
      },
      {
        id: 'trip2',
        departureDate: '2024-06-10',
        returnDate: '2024-06-20',
        destination: 'Germany',
        purpose: 'Business',
        status: 'completed',
        createdAt: '',
        updatedAt: ''
      }
    ];

    const validated = validateTravelRecords(records);
    const hasOverlapIssue = validated.some(r => r.validationIssues.some(issue => issue.message.includes('Overlap')));
    expect(hasOverlapIssue).toBe(true);
  });

  // Test 12: Missing return date
  it('12. Missing return date marks record as INCOMPLETE', () => {
    const records: TravelRecord[] = [
      {
        id: 'trip1',
        departureDate: '2024-06-01',
        returnDate: null,
        destination: 'France',
        purpose: 'Holiday',
        status: 'completed',
        createdAt: '',
        updatedAt: ''
      }
    ];

    const validated = validateTravelRecords(records);
    expect(validated[0].completeness).toBe('INCOMPLETE');
  });

  // Test 13: Travel simulation
  it('13. Travel simulation does not modify the original records array', () => {
    const profile: ImmigrationProfile = {
      id: 'p1',
      visaRoute: 'BNO',
      visaGrantDate: '2021-08-01',
      firstUKArrivalDate: '2021-08-15',
      qualifyingPeriodStartDate: '2021-08-15',
      qualifyingPeriodStartConfirmed: true,
      actualILRGrantDate: null,
      naturalisationRoute: 'standard_5_year',
      travelHistoryCompleteness: 'CONFIRMED_COMPLETE',
      createdAt: '2021-08-15',
      updatedAt: '2021-08-15'
    };

    const originalRecords: TravelRecord[] = [
      {
        id: 'orig1',
        departureDate: '2023-03-01',
        returnDate: '2023-03-15',
        destination: 'Japan',
        purpose: 'Holiday',
        status: 'completed',
        createdAt: '',
        updatedAt: ''
      }
    ];

    const originalLength = originalRecords.length;
    const sim = simulateTravelImpact(
      originalRecords,
      {
        departureDate: '2024-07-01',
        returnDate: '2024-07-20',
        destination: 'Hong Kong',
        purpose: 'Family'
      },
      profile
    );

    expect(originalRecords.length).toBe(originalLength);
    expect(originalRecords[0].id).toBe('orig1');
    expect(sim.simulatedTripAbsenceDays).toBe(18); // July 1 to July 20 = 19 - 1 = 18 days
  });

  // Test 14: No travel records
  it('14. No travel records handles state gracefully with 0 absence, not unqualified legal Pass', () => {
    const profile: ImmigrationProfile = {
      id: 'p1',
      visaRoute: 'BNO',
      visaGrantDate: null,
      firstUKArrivalDate: null,
      qualifyingPeriodStartDate: null,
      qualifyingPeriodStartConfirmed: false,
      actualILRGrantDate: null,
      naturalisationRoute: 'standard_5_year',
      travelHistoryCompleteness: 'CONFIRMED_COMPLETE',
      createdAt: '',
      updatedAt: ''
    };

    const ilrResult = calculateILRContinuousResidence([], profile);
    expect(ilrResult.status).toBe('INSUFFICIENT_DATA');
  });
});
