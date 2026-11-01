import { PolicyRule } from '../types';

export const OFFICIAL_POLICY_RULES: PolicyRule[] = [
  {
    id: 'ilr-continuous-residence-180',
    route: 'BNO',
    category: 'ilr_continuous_residence',
    threshold: 180,
    periodType: 'rolling_12_months',
    countingMethod: 'whole_days_outside_uk',
    effectiveFrom: '2021-01-31',
    effectiveTo: null,
    sourceUrl: 'https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-continuous-residence',
    sourceTitle: 'Immigration Rules: Appendix Continuous Residence (CR 2.1 & CR 2.2)',
    lastVerifiedAt: '2026-10-15',
    status: 'POLICY_VERIFICATION_REQUIRED',
    description: 'An applicant must not have been absent from the UK for more than 180 days in any 12-month period during the qualifying period. Only whole days spent outside the UK are counted as absences; departure and arrival days in the UK are not counted as absence days.'
  },
  {
    id: 'bno-settlement-5-year-route',
    route: 'BNO',
    category: 'ilr_continuous_residence',
    threshold: null,
    periodType: '5_calendar_years',
    countingMethod: 'qualifying_period',
    effectiveFrom: '2021-01-31',
    effectiveTo: null,
    sourceUrl: 'https://www.gov.uk/british-national-overseas-bno-visa/settle-in-the-uk',
    sourceTitle: 'Settle in the UK: British National (Overseas) visa',
    lastVerifiedAt: '2026-10-15',
    status: 'POLICY_VERIFICATION_REQUIRED',
    description: 'BNO visa holders can apply for Indefinite Leave to Remain (ILR) after 5 continuous years living in the UK, provided continuous residence conditions are satisfied.'
  },
  {
    id: 'ilr-application-earliest-window',
    route: 'BNO',
    category: 'ilr_application_window',
    threshold: 28,
    periodType: 'days_before_anniversary',
    countingMethod: 'calendar_days_before_5_years',
    effectiveFrom: '2021-01-31',
    effectiveTo: null,
    sourceUrl: 'https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-continuous-residence',
    sourceTitle: 'Home Office Continuous Residence Guidance',
    lastVerifiedAt: '2026-10-15',
    status: 'POLICY_VERIFICATION_REQUIRED',
    description: 'The earliest an applicant can submit an application for settlement is 28 days before completing the 5-year qualifying continuous residence period. Applying earlier can lead to refusal.'
  },
  {
    id: 'naturalisation-5-year-residence-450',
    route: 'BNO',
    category: 'naturalisation_5_year',
    threshold: 450,
    periodType: '5_calendar_years',
    countingMethod: 'whole_days_outside_uk',
    effectiveFrom: '1983-01-01',
    effectiveTo: null,
    sourceUrl: 'https://www.gov.uk/government/publications/form-an-guidance/form-an-guidance-accessible',
    sourceTitle: 'Form AN Guidance: Naturalisation as a British Citizen (Section 6(1))',
    lastVerifiedAt: '2026-10-15',
    status: 'POLICY_VERIFICATION_REQUIRED',
    description: 'Under section 6(1) of the British Nationality Act 1981, total absences across the 5-year qualifying period should not exceed 450 days. The applicant must have been physically present in the UK on the day exactly 5 years before the application date.'
  },
  {
    id: 'naturalisation-final-12-months-90',
    route: 'BNO',
    category: 'naturalisation_final_year',
    threshold: 90,
    periodType: '12_calendar_months_prior_to_application',
    countingMethod: 'whole_days_outside_uk',
    effectiveFrom: '1983-01-01',
    effectiveTo: null,
    sourceUrl: 'https://www.gov.uk/government/publications/form-an-guidance/form-an-guidance-accessible',
    sourceTitle: 'Form AN Guidance: Final 12 Months Residence Requirement',
    lastVerifiedAt: '2026-10-15',
    status: 'POLICY_VERIFICATION_REQUIRED',
    description: 'Absence from the UK during the 12 months immediately preceding the citizenship application date must not exceed 90 days. Departure and return days are excluded.'
  },
  {
    id: 'naturalisation-ilr-holding-period-12m',
    route: 'BNO',
    category: 'naturalisation_application_window',
    threshold: 12,
    periodType: 'calendar_months_with_ilr',
    countingMethod: 'calendar_month_addition',
    effectiveFrom: '1983-01-01',
    effectiveTo: null,
    sourceUrl: 'https://www.legislation.gov.uk/ukpga/1981/61/contents',
    sourceTitle: 'British Nationality Act 1981: Schedule 1',
    lastVerifiedAt: '2026-10-15',
    status: 'POLICY_VERIFICATION_REQUIRED',
    description: 'Non-spouse applicants for British naturalisation must have held Indefinite Leave to Remain (settled status) for at least 12 full calendar months before applying for British citizenship.'
  }
];

export const ILR_12_MONTH_MAX_ABSENCE = 180;
export const NATURALISATION_5_YEAR_MAX_ABSENCE = 450;
export const NATURALISATION_FINAL_YEAR_MAX_ABSENCE = 90;
export const EARLIEST_ILR_WINDOW_DAYS = 28;
export const ILR_TO_NATURALISATION_MONTHS = 12;
