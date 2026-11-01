import React from 'react';
import {
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Flag,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { ImmigrationProfile, TimelineMilestone } from '../types';
import { formatDisplayDate } from '../engine/dateUtils';

interface ImmigrationTimelineViewProps {
  profile: ImmigrationProfile;
  milestones: TimelineMilestone[];
  onOpenProfile: () => void;
}

export const ImmigrationTimelineView: React.FC<ImmigrationTimelineViewProps> = ({
  profile,
  milestones,
  onOpenProfile
}) => {
  const getClassificationBadge = (cls: TimelineMilestone['dateClassification']) => {
    switch (cls) {
      case 'confirmed':
        return (
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40 px-2 py-0.5 rounded-md">
            Confirmed Date
          </span>
        );
      case 'user_estimate':
        return (
          <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/40 px-2 py-0.5 rounded-md">
            User-Provided Estimate
          </span>
        );
      case 'system_projection':
        return (
          <span className="text-[11px] font-semibold text-purple-800 bg-purple-50 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/40 px-2 py-0.5 rounded-md">
            System Projection
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Immigration Timeline</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Full 5-year BN(O) settlement route through to British citizenship eligibility
            </p>
          </div>
          <button
            onClick={onOpenProfile}
            className="px-3.5 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors self-start sm:self-auto"
          >
            Edit Profile Dates
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400">Confirmed Legal Date</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-600 dark:text-slate-400">User-Provided Estimate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-slate-600 dark:text-slate-400">System Calculation Projection</span>
          </div>
        </div>
      </div>

      {/* Timeline Journey Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-6 shadow-xs transition-colors">
        <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 md:ml-6 space-y-8 py-2">
          {milestones.map((milestone, idx) => {
            const isCompleted = milestone.completed;

            return (
              <div key={milestone.id} className="relative pl-6 md:pl-8">
                {/* Node marker */}
                <div
                  className={`absolute -left-[17px] top-1.5 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-800 transition-colors ${
                    isCompleted
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : milestone.type === 'earliest_ilr_application'
                      ? 'border-teal-500 text-teal-600 dark:text-teal-400 shadow-xs'
                      : 'border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : milestone.type === 'earliest_ilr_application' ? (
                    <Flag className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>

                {/* Milestone Content */}
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{milestone.title}</h3>
                      {isCompleted && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                          Completed
                        </span>
                      )}
                    </div>
                    <div>{getClassificationBadge(milestone.dateClassification)}</div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-base font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatDisplayDate(milestone.date, { fullMonth: true })}
                    </span>
                    {milestone.daysRemaining !== undefined && !isCompleted && (
                      <span className="text-xs font-mono text-teal-700 dark:text-teal-400 font-semibold">
                        ({milestone.daysRemaining} days remaining)
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                    {milestone.description}
                  </p>

                  {/* Special context for 28-day window */}
                  {milestone.type === 'earliest_ilr_application' && (
                    <div className="mt-3 p-2.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-lg text-xs text-teal-900 dark:text-teal-200 flex items-start gap-2">
                      <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <span>
                        Under Home Office rules, applying more than 28 days before completing the 5-year continuous residence period will result in application refusal.
                      </span>
                    </div>
                  )}

                  {milestone.type === 'earliest_naturalisation_application' && (
                    <div className="mt-3 p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-lg text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2">
                      <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                      <span>
                        Standard British nationality applicants must hold Indefinite Leave to Remain for at least 12 full calendar months before applying for naturalisation.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legal Disclaimer Box */}
        <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Statutory Estimation Notice</span>
          </div>
          <p className="leading-relaxed">
            All projected dates are estimates based on user-provided profile dates and published Home Office settlement criteria. This timeline does not constitute formal legal advice or an entitlement to immigration leave.
          </p>
        </div>
      </div>
    </div>
  );
};
