export type VisaRoute = 'BNO';

export type NaturalisationRoute = 'standard_5_year';

export type TripStatus = 'planned' | 'ongoing' | 'completed';

export type ComplianceStatus =
  | 'WITHIN_NORMAL_LIMIT'
  | 'APPROACHING_NORMAL_LIMIT'
  | 'NORMAL_LIMIT_EXCEEDED'
  | 'INSUFFICIENT_DATA'
  | 'POLICY_VERIFICATION_REQUIRED';

export type DataCompletenessState = 'COMPLETE' | 'INCOMPLETE' | 'INVALID';

export interface ImmigrationProfile {
  id: string;
  visaRoute: VisaRoute;
  visaGrantDate: string | null; // ISO YYYY-MM-DD
  firstUKArrivalDate: string | null; // ISO YYYY-MM-DD
  qualifyingPeriodStartDate: string | null; // ISO YYYY-MM-DD
  qualifyingPeriodStartConfirmed: boolean;
  actualILRGrantDate: string | null; // ISO YYYY-MM-DD
  naturalisationRoute: NaturalisationRoute;
  createdAt: string;
  updatedAt: string;
}

export interface TravelRecord {
  id: string;
  departureDate: string; // ISO YYYY-MM-DD
  returnDate: string | null; // ISO YYYY-MM-DD
  destination: string;
  purpose: string;
  status: TripStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyRule {
  id: string;
  route: string;
  category: 'ilr_continuous_residence' | 'naturalisation_5_year' | 'naturalisation_final_year' | 'ilr_application_window' | 'naturalisation_application_window';
  threshold: number | null; // in days
  periodType: string;
  countingMethod: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  sourceUrl: string;
  sourceTitle: string;
  lastVerifiedAt: string;
  status: 'verified' | 'under_review' | 'superseded';
  description: string;
}

export interface TripValidationIssue {
  recordId: string;
  severity: 'error' | 'warning';
  message: string;
  field?: 'departureDate' | 'returnDate' | 'destination' | 'general';
}

export interface ValidatedTravelRecord extends TravelRecord {
  completeness: DataCompletenessState;
  validationIssues: TripValidationIssue[];
  naturalisationDays: number;
  ilrDays: number;
}

export interface RollingWindowAnalysis {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  absenceDays: number;
  threshold: number;
  remainingAllowance: number;
  status: ComplianceStatus;
  tripsInWindow: {
    tripId: string;
    destination: string;
    overlappingDays: number;
    startDate: string;
    endDate: string;
  }[];
}

export interface ILRComplianceResult {
  maxAbsenceCount: number;
  threshold: number; // 180
  remainingAllowance: number;
  peakWindow: RollingWindowAnalysis | null;
  status: ComplianceStatus;
  hasIncompleteData: boolean;
  hasInvalidData: boolean;
  qualifyingStartDate: string | null;
  qualifyingEndDate: string | null;
  totalTripsCount: number;
  windowEvaluations: RollingWindowAnalysis[];
}

export interface NaturalisationComplianceResult {
  fiveYearAbsenceDays: number;
  fiveYearThreshold: number; // 450
  fiveYearRemainingAllowance: number;
  fiveYearStatus: ComplianceStatus;
  
  final12MonthsAbsenceDays: number;
  final12MonthsThreshold: number; // 90
  final12MonthsRemainingAllowance: number;
  final12MonthsStatus: ComplianceStatus;

  fiveYearPeriodStart: string | null;
  fiveYearPeriodEnd: string | null;
  final12MonthsStart: string | null;
  final12MonthsEnd: string | null;

  presentOnDay1: boolean | null; // whether applicant was in the UK on 5-year start date
  hasIncompleteData: boolean;
}

export type MilestoneType = 
  | 'visa_grant'
  | 'first_arrival'
  | 'qualifying_start'
  | 'five_year_anniversary'
  | 'earliest_ilr_application'
  | 'actual_ilr_grant'
  | 'earliest_naturalisation_application';

export interface TimelineMilestone {
  id: string;
  type: MilestoneType;
  title: string;
  date: string | null;
  dateClassification: 'confirmed' | 'user_estimate' | 'system_projection';
  description: string;
  completed: boolean;
  daysRemaining?: number;
}

export interface TravelSimulationInput {
  departureDate: string;
  returnDate: string;
  destination: string;
  purpose: string;
}

export interface SimulationComparison {
  ilr: {
    beforePeak: number;
    afterPeak: number;
    beforeStatus: ComplianceStatus;
    afterStatus: ComplianceStatus;
    delta: number;
    newPeakWindow?: { startDate: string; endDate: string };
  };
  naturalisation5Year: {
    beforeDays: number;
    afterDays: number;
    beforeStatus: ComplianceStatus;
    afterStatus: ComplianceStatus;
    delta: number;
  };
  naturalisationFinal12: {
    beforeDays: number;
    afterDays: number;
    beforeStatus: ComplianceStatus;
    afterStatus: ComplianceStatus;
    delta: number;
  };
  simulatedTripAbsenceDays: number;
  createsThresholdBreach: boolean;
}
