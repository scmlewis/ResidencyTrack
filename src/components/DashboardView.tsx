import React from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plane,
  Plus,
  SlidersHorizontal,
  Info,
  ShieldCheck,
  TrendingUp,
  MapPin
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import {
  ImmigrationProfile,
  TravelRecord,
  ILRComplianceResult,
  NaturalisationComplianceResult,
  TimelineMilestone,
  ComplianceStatus
} from '../types';
import { formatDisplayDate } from '../engine/dateUtils';
import { NavTab } from './Navigation';
import { RollingAbsenceWarningBanner } from './RollingAbsenceWarningBanner';

interface DashboardViewProps {
  profile: ImmigrationProfile;
  records: TravelRecord[];
  ilrResult: ILRComplianceResult;
  natResult: NaturalisationComplianceResult;
  milestones: TimelineMilestone[];
  onNavigate: (tab: NavTab) => void;
  onOpenAddTrip: () => void;
  onOpenProfile: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  records,
  ilrResult,
  natResult,
  milestones,
  onNavigate,
  onOpenAddTrip,
  onOpenProfile
}) => {
  const [previewAbsenceDays, setPreviewAbsenceDays] = React.useState<number | null>(null);

  // Active ILR result considering any test preview
  const activeILRResult: ILRComplianceResult = React.useMemo(() => {
    if (previewAbsenceDays === null) return ilrResult;
    const threshold = 180;
    let status: ComplianceStatus = 'WITHIN_NORMAL_LIMIT';
    if (previewAbsenceDays >= threshold) {
      status = 'NORMAL_LIMIT_EXCEEDED';
    } else if (previewAbsenceDays >= 135) {
      status = 'APPROACHING_NORMAL_LIMIT';
    }
    return {
      ...ilrResult,
      maxAbsenceCount: previewAbsenceDays,
      remainingAllowance: Math.max(0, threshold - previewAbsenceDays),
      status
    };
  }, [ilrResult, previewAbsenceDays]);

  const nextMilestone = milestones.find(m => !m.completed) || milestones[milestones.length - 1];

  // Prepare data for the rolling 12-month absence trend chart
  const trendData = React.useMemo(() => {
    if (!ilrResult.windowEvaluations || ilrResult.windowEvaluations.length === 0) {
      return [];
    }
    return ilrResult.windowEvaluations.map(w => ({
      startDate: w.startDate,
      displayLabel: formatDisplayDate(w.startDate, { fullMonth: false }),
      absenceDays: w.absenceDays,
      threshold: w.threshold,
      remaining: w.remainingAllowance
    }));
  }, [ilrResult]);

  // Recent 5 trips sorted by departureDate descending
  const recentTrips = React.useMemo(() => {
    return [...records]
      .sort((a, b) => (b.departureDate || '').localeCompare(a.departureDate || ''))
      .slice(0, 5);
  }, [records]);

  // Notice badges
  const notices = React.useMemo(() => {
    const list: { type: 'danger' | 'warning' | 'info'; title: string; text: string }[] = [];

    if (!profile.qualifyingPeriodStartConfirmed) {
      list.push({
        type: 'warning',
        title: 'Unverified Qualifying Period Start',
        text: 'Please confirm your continuous residence start date in your Immigration Profile to ensure 100% calculation precision.'
      });
    }

    if (activeILRResult.maxAbsenceCount >= 180) {
      list.push({
        type: 'danger',
        title: 'Rolling 180-Day Limit Exceeded (100% Capacity)',
        text: `Your peak 12-month absence is ${activeILRResult.maxAbsenceCount} days (${Math.round((activeILRResult.maxAbsenceCount / 180) * 100)}% capacity), exceeding the statutory 180-day threshold under Appendix Continuous Residence CR 2.2.`
      });
    } else if (activeILRResult.maxAbsenceCount >= 162) {
      list.push({
        type: 'danger',
        title: 'Critical Warning: 90% Rolling Capacity Reached',
        text: `Your peak 12-month absence is ${activeILRResult.maxAbsenceCount} days (${Math.round((activeILRResult.maxAbsenceCount / 180) * 100)}% capacity). You have only ${activeILRResult.remainingAllowance} days remaining before breaching the 180-day limit.`
      });
    } else if (activeILRResult.maxAbsenceCount >= 135) {
      list.push({
        type: 'warning',
        title: 'Advisory Warning: 75% Rolling Capacity Reached',
        text: `Your peak 12-month absence is ${activeILRResult.maxAbsenceCount} days (${Math.round((activeILRResult.maxAbsenceCount / 180) * 100)}% capacity). You are approaching the 180-day ceiling with ${activeILRResult.remainingAllowance} days remaining.`
      });
    }

    if (natResult.fiveYearStatus === 'NORMAL_LIMIT_EXCEEDED') {
      list.push({
        type: 'danger',
        title: 'Naturalisation 450-Day Limit Exceeded',
        text: `Your 5-year total absence is ${natResult.fiveYearAbsenceDays} days (normal limit: 450 days).`
      });
    }

    if (natResult.presentOnDay1 === false) {
      list.push({
        type: 'warning',
        title: 'Physical Presence Requirement Check',
        text: 'You may have been outside the UK on the day exactly 5 years prior to application. British Nationality Act 1981 normally requires UK presence on Day 1.'
      });
    }

    if (activeILRResult.hasIncompleteData) {
      list.push({
        type: 'info',
        title: 'Incomplete Travel Records Detected',
        text: 'One or more trip entries have missing return dates or unconfirmed data. Check the Travel Log to resolve them.'
      });
    }

    const plannedTripsCount = records.filter(r => r.status === 'planned').length;
    if (plannedTripsCount > 0) {
      list.push({
        type: 'info',
        title: `${plannedTripsCount} Planned Trip${plannedTripsCount > 1 ? 's' : ''} Included`,
        text: 'Your metrics include future planned travel. You can toggle or edit them in the Travel Log or test variations in the Travel Simulator.'
      });
    }

    return list;
  }, [profile, activeILRResult, natResult, records]);

  const renderStatusText = (status: ComplianceStatus, count?: number) => {
    if (count !== undefined) {
      if (count >= 180) {
        return <span className="text-red-700 font-bold text-xs">Exceeded (≥ 100%)</span>;
      }
      if (count >= 162) {
        return <span className="text-orange-700 font-bold text-xs">Critical (≥ 90%)</span>;
      }
      if (count >= 135) {
        return <span className="text-amber-700 font-semibold text-xs">Approaching (≥ 75%)</span>;
      }
      return <span className="text-emerald-700 font-semibold text-xs">Safe Buffer (&lt; 75%)</span>;
    }

    switch (status) {
      case 'WITHIN_NORMAL_LIMIT':
        return <span className="text-emerald-700 font-semibold text-xs">Within Normal Limit</span>;
      case 'APPROACHING_NORMAL_LIMIT':
        return <span className="text-amber-700 font-semibold text-xs">Approaching Limit</span>;
      case 'NORMAL_LIMIT_EXCEEDED':
        return <span className="text-red-700 font-semibold text-xs">Normal Limit Exceeded</span>;
      case 'INSUFFICIENT_DATA':
        return <span className="text-slate-500 font-semibold text-xs">Insufficient Data</span>;
      default:
        return <span className="text-slate-600 font-semibold text-xs">Verification Required</span>;
    }
  };

  const capacityPct = Math.round((activeILRResult.maxAbsenceCount / 180) * 100);
  const cardBarColor =
    capacityPct >= 100
      ? 'bg-red-600'
      : capacityPct >= 90
      ? 'bg-orange-600'
      : capacityPct >= 75
      ? 'bg-amber-500'
      : 'bg-teal-500';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* SECTION A: Welcome Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 md:p-6 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-medium text-teal-700 dark:text-teal-400">BN(O) Route</span>
              <span aria-hidden="true">·</span>
              <span>5-Year Settlement</span>
              <span aria-hidden="true" className="hidden xs:inline">·</span>
              <span className="hidden xs:inline font-mono">{formatDisplayDate('2026-11-01')}</span>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Immigration Compliance Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl line-clamp-2 sm:line-clamp-none">
              Track UK residence history, monitor overseas absence limits, and plan Indefinite Leave to Remain and British citizenship.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
            <button
              onClick={onOpenAddTrip}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Trip</span>
            </button>
            <button
              onClick={() => onNavigate('simulator')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Simulate</span>
            </button>
          </div>
        </div>

        {/* Capacity Warning Testing / Interactive Verification Switcher (dev only) */}
        {import.meta.env.DEV && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] sm:text-xs">
            Visual Warning Test:
          </span>
          <div className="grid grid-cols-4 sm:flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setPreviewAbsenceDays(null)}
              className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold text-center transition-colors ${
                previewAbsenceDays === null
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700'
              }`}
            >
              Real ({ilrResult.maxAbsenceCount}d)
            </button>
            <button
              onClick={() => setPreviewAbsenceDays(140)}
              className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold text-center transition-colors ${
                previewAbsenceDays === 140
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
              }`}
            >
              75% (140d)
            </button>
            <button
              onClick={() => setPreviewAbsenceDays(165)}
              className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold text-center transition-colors ${
                previewAbsenceDays === 165
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : 'bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:bg-orange-100'
              }`}
            >
              90% (165d)
            </button>
            <button
              onClick={() => setPreviewAbsenceDays(183)}
              className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold text-center transition-colors ${
                previewAbsenceDays === 183
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100'
              }`}
            >
              100% (183d)
            </button>
          </div>
        </div>
        )}
      </div>

      {/* DEDICATED VISUAL WARNING SYSTEM BANNER */}
      <RollingAbsenceWarningBanner
        ilrResult={activeILRResult}
        onOpenSimulator={() => onNavigate('simulator')}
      />

      {/* SECTION B: Compliance Summary Cards (Mobile 2-col, Desktop 4-col) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: ILR Rolling Absence with Color-Coded Multi-Tier Progress Bar */}
        <div className={`col-span-2 sm:col-span-1 lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl border p-3.5 sm:p-4 shadow-xs flex flex-col justify-between transition-colors ${
          capacityPct >= 100
            ? 'border-red-300 dark:border-red-700/80 ring-1 ring-red-200 dark:ring-red-900/40'
            : capacityPct >= 90
            ? 'border-orange-300 dark:border-orange-700/80 ring-1 ring-orange-200 dark:ring-orange-900/40'
            : capacityPct >= 75
            ? 'border-amber-300 dark:border-amber-700/80 ring-1 ring-amber-200 dark:ring-amber-900/40'
            : 'border-slate-200/80 dark:border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">ILR — 12M Rolling</span>
              <span title="Appendix Continuous Residence CR 2.2: Maximum 180 days in any 12-month period">
                <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {activeILRResult.maxAbsenceCount}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">/ 180 days</span>
            </div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                {activeILRResult.remainingAllowance}
              </span>{' '}
              days remaining
            </div>

            {/* COLOR-CODED PROGRESS BAR FOR 75%, 90%, AND 100% CAPACITY */}
            <div className="mt-2.5 space-y-1">
              <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-mono">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Capacity:</span>
                <span className={`font-bold ${
                  capacityPct >= 100
                    ? 'text-red-700 dark:text-red-400'
                    : capacityPct >= 90
                    ? 'text-orange-700 dark:text-orange-400'
                    : capacityPct >= 75
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-teal-700 dark:text-teal-400'
                }`}>
                  {capacityPct}%
                </span>
              </div>

              {/* Progress Track with visual indicator lines */}
              <div className="relative w-full bg-slate-100 dark:bg-slate-800 h-2 sm:h-2.5 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${cardBarColor}`}
                  style={{ width: `${Math.min(100, Math.max(3, capacityPct))}%` }}
                />
                {/* 75% tick marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-500/80 z-10"
                  style={{ left: '75%' }}
                  title="75% Limit (135d)"
                />
                {/* 90% tick marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-orange-600/80 z-10"
                  style={{ left: '90%' }}
                  title="90% Limit (162d)"
                />
              </div>

              {/* Threshold Ticks */}
              <div className="flex justify-between text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-0.5">
                <span>0d</span>
                <span className={capacityPct >= 75 ? 'text-amber-700 dark:text-amber-400 font-bold' : ''}>75%</span>
                <span className={capacityPct >= 90 ? 'text-orange-700 dark:text-orange-400 font-bold' : ''}>90%</span>
                <span className={capacityPct >= 100 ? 'text-red-700 dark:text-red-400 font-bold' : ''}>180d</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            {renderStatusText(activeILRResult.status, activeILRResult.maxAbsenceCount)}
            {activeILRResult.peakWindow && (
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                Peak: {activeILRResult.peakWindow.startDate.slice(2)}
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Naturalisation 5-Year Absence */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Naturalisation 5-Yr</span>
              <span title="British Nationality Act 1981 Section 6(1): Maximum 450 absence days over 5 continuous years">
                <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {natResult.fiveYearAbsenceDays}
              </span>
              <span className="text-[10px] sm:text-xs font-mono text-slate-500 dark:text-slate-400">/ 450d</span>
            </div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                {natResult.fiveYearRemainingAllowance}
              </span>{' '}
              days left
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            {renderStatusText(natResult.fiveYearStatus)}
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">5-Yr Total</span>
          </div>
        </div>

        {/* Card 3: Naturalisation Final 12 Months */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Final 12 Months</span>
              <span title="Form AN Guidance: Maximum 90 days absence in the final 12 months before applying for British citizenship">
                <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {natResult.final12MonthsAbsenceDays}
              </span>
              <span className="text-[10px] sm:text-xs font-mono text-slate-500 dark:text-slate-400">/ 90d</span>
            </div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                {natResult.final12MonthsRemainingAllowance}
              </span>{' '}
              days left
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            {renderStatusText(natResult.final12MonthsStatus)}
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">Final Year</span>
          </div>
        </div>

        {/* Card 4: Next Milestone */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white dark:from-slate-900 to-slate-50/50 dark:to-slate-800/50 transition-colors">
          <div>
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Next Milestone</span>
              <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="mt-0.5">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {nextMilestone?.title || '5-Year Settlement'}
              </div>
              <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 mt-0.5">
                {formatDisplayDate(nextMilestone?.date)}
              </div>
            </div>
            <div className="mt-1.5 text-xs text-teal-700 dark:text-teal-400 font-medium">
              {nextMilestone?.daysRemaining !== undefined ? (
                <span>
                  <strong className="font-mono tabular-nums">{nextMilestone.daysRemaining}</strong> days to opening
                </span>
              ) : (
                'Estimated projection'
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => onNavigate('timeline')}
              className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 flex items-center gap-1"
            >
              <span>View Timeline</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION C: Absence Trend Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Rolling 12-Month Absence Trend
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Sliding 12-calendar-month windows under Appendix Continuous Residence CR 2.2
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs self-start sm:self-auto">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-teal-500 rounded-xs" />
              <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium">Rolling Absences</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-red-500" />
              <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium">180d Limit</span>
            </div>
          </div>
        </div>

        {trendData.length > 0 ? (
          <div className="h-48 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="absenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                <XAxis
                  dataKey="startDate"
                  tickFormatter={(val) => val.slice(0, 7)}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 200]}
                  ticks={[0, 50, 100, 150, 180]}
                  tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg shadow-lg text-xs space-y-1">
                          <div className="font-semibold text-teal-300">
                            Window Starting: {data.displayLabel}
                          </div>
                          <div>
                            Absence: <span className="font-mono font-bold">{data.absenceDays} days</span>
                          </div>
                          <div className="text-slate-300">
                            Remaining Allowance: <span className="font-mono">{data.remaining} days</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={180}
                  stroke="#DC2626"
                  strokeDasharray="4 4"
                  label={{ value: '180d Limit', position: 'top', fill: '#EF4444', fontSize: 10 }}
                />
                <Area
                  type="monotone"
                  dataKey="absenceDays"
                  stroke="#0D9488"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#absenceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <Calendar className="w-5 h-5 text-slate-300 dark:text-slate-600 mb-2" />
            <span>No travel records to calculate rolling trend.</span>
          </div>
        )}
      </div>

      {/* Two Column Layout: Recent Travel (Left) & Important Notices (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* SECTION D: Recent Travel (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Recent Overseas Travel</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Latest recorded trips outside the UK</p>
            </div>
            <button
              onClick={() => onNavigate('travel_log')}
              className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 flex items-center gap-1"
            >
              <span>View All ({records.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTrips.length > 0 ? (
            <>
              {/* Mobile Card List View (md:hidden) - Thumb friendly & no overflow */}
              <div className="md:hidden space-y-2.5">
                {recentTrips.map((trip) => {
                  const days = trip.departureDate && trip.returnDate
                    ? Math.max(0, (new Date(trip.returnDate).getTime() - new Date(trip.departureDate).getTime()) / 86400000 - 1)
                    : 0;

                  return (
                    <div
                      key={trip.id}
                      className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>{trip.destination}</span>
                        </div>
                        <span
                          className={`text-[10px] font-semibold ${
                            trip.status === 'completed'
                              ? 'text-teal-700 dark:text-teal-300'
                              : trip.status === 'planned'
                              ? 'text-purple-700 dark:text-purple-300'
                              : 'text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {trip.status === 'completed'
                            ? 'Completed'
                            : trip.status === 'planned'
                            ? 'Planned'
                            : 'Ongoing'}
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {formatDisplayDate(trip.departureDate)} → {formatDisplayDate(trip.returnDate)}
                        </div>
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-right">
                          {Math.round(days)} d <span className="font-normal text-[10px] text-slate-400">counted</span>
                        </div>
                      </div>

                      {trip.purpose && (
                        <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                          {trip.purpose}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="pb-2.5">Destination</th>
                      <th className="pb-2.5">Dates</th>
                      <th className="pb-2.5 text-right">Absence Days</th>
                      <th className="pb-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {recentTrips.map((trip) => {
                      const days = trip.departureDate && trip.returnDate
                        ? Math.max(0, (new Date(trip.returnDate).getTime() - new Date(trip.departureDate).getTime()) / 86400000 - 1)
                        : 0;

                      return (
                        <tr key={trip.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-2.5 font-medium text-slate-900 dark:text-slate-200">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              <div>
                                <span>{trip.destination}</span>
                                <span className="block text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                                  {trip.purpose}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                            {formatDisplayDate(trip.departureDate)} — {formatDisplayDate(trip.returnDate)}
                          </td>
                          <td className="py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                            {Math.round(days)} d
                          </td>
                          <td className="py-2.5 text-right">
                            <span
                              className={`inline-block text-[11px] font-medium ${
                                trip.status === 'completed'
                                  ? 'text-teal-700 dark:text-teal-300'
                                  : trip.status === 'planned'
                                  ? 'text-purple-700 dark:text-purple-300'
                                  : 'text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {trip.status === 'completed'
                                ? 'Completed'
                                : trip.status === 'planned'
                                ? 'Planned'
                                : 'Ongoing'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-8 sm:py-12 text-center text-xs text-slate-500 dark:text-slate-400">
              No overseas trips logged yet. Click "Add Trip" to log your travel.
            </div>
          )}
        </div>

        {/* SECTION E: Important Notices & Compliance (1 col) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Important Notices</h2>
              <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500">{notices.length} items</span>
            </div>

            <div className="space-y-2.5">
              {notices.map((notice, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 sm:p-3 rounded-lg border text-xs ${
                    notice.type === 'danger'
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                      : notice.type === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="font-semibold mb-1 flex items-center gap-1.5">
                    {notice.type === 'danger' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                    ) : notice.type === 'warning' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
                    )}
                    <span className="text-xs">{notice.title}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {notice.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Appendix Continuous Residence</span>
            <button
              onClick={() => onNavigate('settings')}
              className="text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-medium"
            >
              Verify Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
