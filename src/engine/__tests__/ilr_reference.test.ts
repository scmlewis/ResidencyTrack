import { describe, it, expect } from 'vitest';
import { calculateILRContinuousResidence } from '../calculations';
import { calculateILRContinuousResidenceBruteForce } from '../referenceILR';
import { ImmigrationProfile, TravelRecord } from '../../types';

function mkProfile(start: string): ImmigrationProfile {
  return {
    id: 'p', visaRoute: 'BNO', qualifyingPeriodStartDate: start,
    qualifyingPeriodStartConfirmed: true, travelHistoryCompleteness: 'CONFIRMED_COMPLETE'
  } as any;
}

function trip(dep: string, ret: string, id = 't'): TravelRecord {
  return { id, departureDate: dep, returnDate: ret, destination: 'X', purpose: 'p', status: 'completed', createdAt: '', updatedAt: '' } as any;
}

describe('ILR brute-force reference vs production', () => {
  it('no trips', () => {
    const p = mkProfile('2021-01-01');
    const prod = calculateILRContinuousResidence([], p);
    const ref = calculateILRContinuousResidenceBruteForce([], p);
    expect(prod.maxAbsenceCount).toBe(ref.maxAbsenceCount);
  });

  it('single trip month/year boundary', () => {
    const p = mkProfile('2021-01-01');
    const recs = [trip('2021-12-31', '2022-01-03')];
    const prod = calculateILRContinuousResidence(recs, p);
    const ref = calculateILRContinuousResidenceBruteForce(recs, p);
    expect(prod.maxAbsenceCount).toBe(ref.maxAbsenceCount);
  });

  it('leap year trip', () => {
    const p = mkProfile('2020-01-01');
    const recs = [trip('2020-02-27', '2020-03-05')];
    const prod = calculateILRContinuousResidence(recs, p);
    const ref = calculateILRContinuousResidenceBruteForce(recs, p);
    expect(prod.maxAbsenceCount).toBe(ref.maxAbsenceCount);
  });

  it('multiple trips', () => {
    const p = mkProfile('2021-06-15');
    const recs = [trip('2021-07-01','2021-07-20','a'), trip('2022-03-10','2022-04-05','b'), trip('2023-11-20','2023-12-10','c')];
    const prod = calculateILRContinuousResidence(recs, p);
    const ref = calculateILRContinuousResidenceBruteForce(recs, p);
    expect(prod.maxAbsenceCount).toBe(ref.maxAbsenceCount);
  });

  it('boundary 180', () => {
    const p = mkProfile('2021-01-01');
    // absence days = dep+1..ret-1; need 180 absence days -> trip length 182
    const recs = [trip('2021-02-01','2021-08-01')];
    const prod = calculateILRContinuousResidence(recs, p);
    const ref = calculateILRContinuousResidenceBruteForce(recs, p);
    expect(prod.maxAbsenceCount).toBe(ref.maxAbsenceCount);
    expect(prod.maxAbsenceCount).toBe(180);
  });

  it('boundary 181 (+1)', () => {
    const p = mkProfile('2021-01-01');
    const recs = [trip('2021-02-01','2021-08-02')];
    const prod = calculateILRContinuousResidence(recs, p);
    const ref = calculateILRContinuousResidenceBruteForce(recs, p);
    expect(prod.maxAbsenceCount).toBe(ref.maxAbsenceCount);
    expect(prod.maxAbsenceCount).toBe(181);
  });

  it('outside period trip', () => {
    const p = mkProfile('2021-01-01');
    const recs = [trip('2019-05-01','2019-05-20')];
    const prod = calculateILRContinuousResidence(recs, p);
    const ref = calculateILRContinuousResidenceBruteForce(recs, p);
    expect(prod.maxAbsenceCount).toBe(ref.maxAbsenceCount);
    expect(prod.maxAbsenceCount).toBe(0);
  });

  it('randomized comparison', () => {
    const p = mkProfile('2020-03-15');
    const recs: TravelRecord[] = [];
    // deterministic pseudo trips
    const dates = ['2020-04-01','2020-04-20','2020-09-01','2020-09-15','2021-12-20','2022-01-10','2023-06-01','2023-06-30'];
    for (let i=0;i<dates.length-1;i+=2) {
      recs.push(trip(dates[i], dates[i+1], 'r'+i));
    }
    const prod = calculateILRContinuousResidence(recs, p);
    const ref = calculateILRContinuousResidenceBruteForce(recs, p);
    expect(prod.maxAbsenceCount).toBe(ref.maxAbsenceCount);
  });
});
