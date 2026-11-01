import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Info,
  Calendar,
  ExternalLink,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  ImmigrationProfile,
  TravelRecord,
  ILRComplianceResult,
  NaturalisationComplianceResult,
  ComplianceStatus
} from '../types';
import { formatDisplayDate, addYearsCalendar } from '../engine/dateUtils';
import { ILR_12_MONTH_MAX_ABSENCE, NATURALISATION_5_YEAR_MAX_ABSENCE, NATURALISATION_FINAL_YEAR_MAX_ABSENCE } from '../policy/rules';

interface AbsenceAnalyticsViewProps {
  profile: ImmigrationProfile;
  records: TravelRecord[];
  ilrResult: ILRComplianceResult;
  natResult: NaturalisationComplianceResult;
}

export const AbsenceAnalyticsView: React.FC<AbsenceAnalyticsViewProps> = ({
  profile,
  records,
  ilrResult,
  natResult
}) => {
  const [activeTab, setActiveTab] = useState<'ilr' | 'naturalisation'>('ilr');

  // Calculate year-by-year breakdown for Naturalisation 5-year period
  const yearlyBreakdown = React.useMemo(() => {
    if (!profile.qualifyingPeriodStartDate) return [];

    const start = profile.qualifyingPeriodStartDate;
    const years = [];

    for (let i = 0; i < 5; i++) {
      const yStart = addYearsCalendar(start, i);
      const yEnd = addYearsCalendar(start, i + 1);

      // Sum whole absence days in this year
      let daysInYear = 0;
      records.forEach(r => {
        if (r.departureDate && r.returnDate && r.departureDate < r.returnDate) {
          const tripAbsenceStart = new Date(r.departureDate);
          tripAbsenceStart.setDate(tripAbsenceStart.getDate() + 1);

          const tripAbsenceEnd = new Date(r.returnDate);
          tripAbsenceEnd.setDate(tripAbsenceEnd.getDate() - 1);

          const yStartDate = new Date(yStart);
          const yEndDate = new Date(yEnd);

          const effStart = tripAbsenceStart > yStartDate ? tripAbsenceStart : yStartDate;
          const effEnd = tripAbsenceEnd < yEndDate ? tripAbsenceEnd : yEndDate;

          if (effStart <= effEnd) {
            daysInYear += Math.round((effEnd.getTime() - effStart.getTime()) / 86400000) + 1;
          }
        }
      });

      years.push({
        yearIndex: i + 1,
        label: `Year ${i + 1}`,
        startDate: yStart,
        endDate: yEnd,
        days: daysInYear
      });
    }

    return years;
  }, [profile, records]);

  const renderBadge = (status: ComplianceStatus) => {
    switch (status) {
      case 'WITHIN_NORMAL_LIMIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40 rounded-lg">
            Within Normal Limit
          </span>
        );
      case 'APPROACHING_NORMAL_LIMIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/40 rounded-lg">
            Approaching Normal Limit
          </span>
        );
      case 'NORMAL_LIMIT_EXCEEDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-red-800 bg-red-50 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/40 rounded-lg">
            Normal Limit Exceeded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 rounded-lg">
            Data Required
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Route Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Absence Analytics Engine
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
              Deterministic compliance evaluation against official UK Home Office statutory rules
            </p>
          </div>

          {/* Route Selector Tabs */}
          <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('ilr')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md text-center transition-colors ${
                activeTab === 'ilr'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              ILR 180-Day Limit
            </button>
            <button
              onClick={() => setActiveTab('naturalisation')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md text-center transition-colors ${
                activeTab === 'naturalisation'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Naturalisation
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'ilr' ? (
        /* ILR CONTINUOUS RESIDENCE SECTION */
        <div className="space-y-4 sm:space-y-6">
          {/* Main Peak Window Evaluation Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700 p-4 sm:p-6 shadow-xs transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-slate-100 dark:border-slate-700">
              <div>
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-300 font-semibold tracking-wider mb-0.5">
                  Appendix Continuous Residence CR 2.2
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Maximum Rolling 12-Month Absence Analysis
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                  Applicants must not exceed 180 days of overseas absence in any 12-month period across the entire 5-year continuous residence journey.
                </p>
              </div>
              <div className="shrink-0 self-start sm:self-auto">{renderBadge(ilrResult.status)}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-6">
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 block mb-1">Highest 12M Absence Count</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
                    {ilrResult.maxAbsenceCount}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-300">/ 180 days limit</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[transform,opacity] ${
                      ilrResult.maxAbsenceCount > 180
                        ? 'bg-red-500'
                        : ilrResult.maxAbsenceCount >= 150
                        ? 'bg-amber-500'
                        : 'bg-teal-500'
                    }`}
                    style={{ width: `${Math.min(100, (ilrResult.maxAbsenceCount / 180) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 block mb-1">Remaining Safe Allowance</span>
                <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-teal-700 dark:text-teal-400">
                  {ilrResult.remainingAllowance}
                  <span className="text-xs font-sans font-normal text-slate-500 dark:text-slate-300 ml-1.5">days</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1 sm:mt-2">
                  Additional days you can spend outside the UK in this peak period without exceeding the standard 180-day threshold.
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 block mb-1">Peak 12-Month Date Window</span>
                {ilrResult.peakWindow ? (
                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatDisplayDate(ilrResult.peakWindow.startDate)}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">until</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatDisplayDate(ilrResult.peakWindow.endDate)}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">No trips recorded</span>
                )}
              </div>
            </div>

            {/* Contributing Trips to Peak Window */}
            {ilrResult.peakWindow && ilrResult.peakWindow.tripsInWindow.length > 0 && (
              <div className="mt-6 pt-4 sm:mt-8 sm:pt-6 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200  mb-3">
                  Trips Contributing to Peak 12-Month Window ({ilrResult.peakWindow.tripsInWindow.length})
                </h3>

                {/* Mobile View */}
                <div className="md:hidden space-y-2">
                  {ilrResult.peakWindow.tripsInWindow.map((t, i) => (
                    <div key={i} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>{t.destination}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">
                          {formatDisplayDate(t.startDate)} → {formatDisplayDate(t.endDate)}
                        </div>
                      </div>
                      <div className="text-right font-bold text-slate-900 dark:text-slate-100">
                        {t.overlappingDays} d
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 font-semibold">
                        <th className="pb-2">Destination</th>
                        <th className="pb-2">Trip Dates</th>
                        <th className="pb-2 text-right">Days within this 12M Window</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {ilrResult.peakWindow.tripsInWindow.map((t, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-2.5 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span>{t.destination}</span>
                          </td>
                          <td className="py-2.5 text-slate-600 dark:text-slate-300 tabular-nums">
                            {formatDisplayDate(t.startDate)} → {formatDisplayDate(t.endDate)}
                          </td>
                          <td className="py-2.5 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                            {t.overlappingDays} days
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Rule Methodology & Official Guidance */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 text-xs space-y-3 transition-colors">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Official Appendix Continuous Residence Counting Methodology</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Under UK Home Office Appendix Continuous Residence CR 2.2, whole days are counted as absences. Departure and arrival days where any portion of the day was spent in the UK are counted as days in the UK, not as absence days.
            </p>
            <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-400 font-medium">
              <ExternalLink className="w-3.5 h-3.5" />
              <a
                href="https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-continuous-residence"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                Read Home Office Appendix Continuous Residence Guidance
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* BRITISH NATURALISATION SECTION */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 5-Year Requirement */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700 p-6 shadow-xs flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 dark:text-slate-300 font-semibold">
                    British Nationality Act 1981 Section 6(1)
                  </span>
                  {renderBadge(natResult.fiveYearStatus)}
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                  5-Year Qualifying Residence (450 Days)
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
                  Total whole-day absences across the 5 continuous years immediately preceding your citizenship application must not exceed 450 days.
                </p>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
                    {natResult.fiveYearAbsenceDays}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-300">/ 450 days</span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-[transform,opacity] ${
                      natResult.fiveYearAbsenceDays > 450
                        ? 'bg-red-500'
                        : natResult.fiveYearAbsenceDays >= 400
                        ? 'bg-amber-500'
                        : 'bg-teal-500'
                    }`}
                    style={{ width: `${Math.min(100, (natResult.fiveYearAbsenceDays / 450) * 100)}%` }}
                  />
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Remaining allowance:{' '}
                  <strong className="tabular-nums text-teal-700 dark:text-teal-400">
                    {natResult.fiveYearRemainingAllowance} days
                  </strong>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-300">
                Qualifying Window: {formatDisplayDate(natResult.fiveYearPeriodStart)} to{' '}
                {formatDisplayDate(natResult.fiveYearPeriodEnd)}
              </div>
            </div>

            {/* Final 12 Months Requirement */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700 p-6 shadow-xs flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 dark:text-slate-300 font-semibold">
                    Form AN Residence Requirement
                  </span>
                  {renderBadge(natResult.final12MonthsStatus)}
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Final 12-Month Residence (90 Days)
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
                  Total whole-day absences during the final 12 months immediately preceding the application date must not exceed 90 days.
                </p>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
                    {natResult.final12MonthsAbsenceDays}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-300">/ 90 days</span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-[transform,opacity] ${
                      natResult.final12MonthsAbsenceDays > 90
                        ? 'bg-red-500'
                        : natResult.final12MonthsAbsenceDays >= 75
                        ? 'bg-amber-500'
                        : 'bg-teal-500'
                    }`}
                    style={{ width: `${Math.min(100, (natResult.final12MonthsAbsenceDays / 90) * 100)}%` }}
                  />
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Remaining allowance:{' '}
                  <strong className="tabular-nums text-teal-700 dark:text-teal-400">
                    {natResult.final12MonthsRemainingAllowance} days
                  </strong>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-300">
                Final Year Window: {formatDisplayDate(natResult.final12MonthsStart)} to{' '}
                {formatDisplayDate(natResult.final12MonthsEnd)}
              </div>
            </div>
          </div>

          {/* Physical Presence on Day 1 Check Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-xs transition-colors">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  natResult.presentOnDay1 !== false
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                }`}
              >
                {natResult.presentOnDay1 !== false ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Presence on the First Day of the Qualifying Period
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Under the British Nationality Act 1981, naturalisation applicants must have been physically present in the UK on the day exactly 5 years prior to the date the application is received by the Home Office (Date:{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {formatDisplayDate(natResult.fiveYearPeriodStart)}
                  </span>
                  ).
                </p>
                <div className="text-xs pt-1">
                  Status:{' '}
                  {natResult.presentOnDay1 !== false ? (
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Physical presence verified (no active overseas travel on that day).
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      Potential travel record overlap detected on this anchor date. Please review your travel records.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Year-by-Year Breakdown */}
          {yearlyBreakdown.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-xs transition-colors">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                Year-by-Year Absence Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
                {yearlyBreakdown.map((y, idx) => (
                  <div
                    key={y.yearIndex}
                    className={`p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg ${
                      idx === 4 ? 'col-span-2 sm:col-span-1' : ''
                    }`}
                  >
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-300 block mb-1">
                      {y.label}
                    </span>
                    <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {y.days} d
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      {y.startDate.slice(0, 4)} - {y.endDate.slice(0, 4)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
