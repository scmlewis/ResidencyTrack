import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Info,
  SlidersHorizontal,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { ILRComplianceResult } from '../types';
import { formatDisplayDate } from '../engine/dateUtils';

interface RollingAbsenceWarningBannerProps {
  ilrResult: ILRComplianceResult;
  onOpenSimulator: () => void;
  onPreviewCapacity?: (days: number) => void;
}

export const RollingAbsenceWarningBanner: React.FC<RollingAbsenceWarningBannerProps> = ({
  ilrResult,
  onOpenSimulator,
  onPreviewCapacity
}) => {
  const maxAbsence = ilrResult.maxAbsenceCount;
  const threshold = ilrResult.threshold || 180;
  const percentage = Math.round((maxAbsence / threshold) * 100);

  // Capacity tier evaluation
  let tier: 'safe' | 'warning_75' | 'critical_90' | 'breached_100' = 'safe';
  if (maxAbsence >= threshold) {
    tier = 'breached_100';
  } else if (maxAbsence >= 162) {
    // 90% of 180 = 162 days
    tier = 'critical_90';
  } else if (maxAbsence >= 135) {
    // 75% of 180 = 135 days
    tier = 'warning_75';
  }

  // Visual attributes per tier
  const tierConfig = {
    safe: {
      barColor: 'bg-teal-500',
      badgeBg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      badgeLabel: 'Safe Capacity (< 75%)',
      title: 'Absences Within Safe Range',
      description: `Your peak 12-month rolling absence is currently ${maxAbsence} days (${percentage}% of 180-day limit). You have a healthy buffer of ${threshold - maxAbsence} days.`,
      borderClass: 'border-slate-200 dark:border-slate-700',
      accentBg: 'bg-white dark:bg-slate-800',
      icon: ShieldCheck,
      iconColor: 'text-teal-600 dark:text-teal-400'
    },
    warning_75: {
      barColor: 'bg-amber-500',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      badgeLabel: 'Warning: 75% Capacity Reached',
      title: 'Approaching 180-Day Rolling Limit (≥ 75%)',
      description: `Caution: Your peak 12-month absence is ${maxAbsence} days (${percentage}% capacity). You are within 27 days of the 90% critical boundary and have ${ilrResult.remainingAllowance} days remaining before breach.`,
      borderClass: 'border-amber-300 dark:border-amber-700/70',
      accentBg: 'bg-amber-50/40 dark:bg-amber-950/20',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400'
    },
    critical_90: {
      barColor: 'bg-orange-600',
      badgeBg: 'bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800',
      badgeLabel: 'Critical: 90% Capacity Reached',
      title: 'High Risk: Approaching 180-Day Limit (≥ 90%)',
      description: `Urgent Warning: Your peak rolling absence is ${maxAbsence} days (${percentage}% capacity). You have only ${ilrResult.remainingAllowance} days of overseas allowance left in this 12-month window.`,
      borderClass: 'border-orange-300 dark:border-orange-700/70',
      accentBg: 'bg-orange-50/40 dark:bg-orange-950/20',
      icon: AlertTriangle,
      iconColor: 'text-orange-600 dark:text-orange-400'
    },
    breached_100: {
      barColor: 'bg-red-600',
      badgeBg: 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800',
      badgeLabel: 'Breach: 100% Capacity Exceeded',
      title: 'Statutory 180-Day Threshold Exceeded (≥ 100%)',
      description: `Limit Exceeded: Your peak 12-month absence is ${maxAbsence} days (${percentage}% capacity), exceeding the standard 180-day continuous residence limit under Appendix Continuous Residence.`,
      borderClass: 'border-red-300 dark:border-red-700/70',
      accentBg: 'bg-red-50/40 dark:bg-red-950/20',
      icon: ShieldAlert,
      iconColor: 'text-red-600 dark:text-red-400'
    }
  };

  const current = tierConfig[tier];
  const Icon = current.icon;

  // Clamped bar width percentage for visualization (max 100%)
  const visualBarWidth = Math.min(100, Math.max(2, percentage));

  return (
    <div className={`rounded-xl border ${current.borderClass} ${current.accentBg} p-3.5 sm:p-5 shadow-xs transition-colors`}>
      {/* Top Bar: Title, Badge, and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg shrink-0 ${tier !== 'safe' ? 'bg-white dark:bg-slate-800 shadow-xs' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${current.iconColor}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">{current.title}</h2>
              <span className={`px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold border rounded-md ${current.badgeBg}`}>
                {current.badgeLabel}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 sm:line-clamp-none">
              {current.description}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSimulator}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs transition-colors whitespace-nowrap self-stretch sm:self-auto shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
          <span>Simulate Flight</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* The Visual Color-Coded Capacity Bar */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between text-[11px] sm:text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-300 font-sans text-xs">Peak 12M:</span>
            <strong className="text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-bold tabular-nums">
              {maxAbsence} / 180 d
            </strong>
            <span className="text-slate-500 dark:text-slate-300">({percentage}%)</span>
          </div>

          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-300">
            <span>Buffer:</span>
            <strong className={`tabular-nums ${tier === 'breached_100' ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-900 dark:text-slate-100 font-semibold'}`}>
              {ilrResult.remainingAllowance} d
            </strong>
          </div>
        </div>

        {/* Progress Bar Container with 75%, 90%, 100% Marker Lines */}
        <div className="relative w-full bg-slate-200/90 dark:bg-slate-900 h-3 rounded-full overflow-hidden ">
          {/* Active progress fill */}
          <div
            className={`h-full rounded-full transition-[transform,opacity] duration-500 ${current.barColor}`}
            style={{ width: `${visualBarWidth}%` }}
          />

          {/* 75% Threshold Marker Line (135d) */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-600/70 dark:bg-amber-400 z-10"
            style={{ left: '75%' }}
            title="75% Threshold: 135 days (Advisory Warning)"
          />

          {/* 90% Threshold Marker Line (162d) */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-orange-700/80 dark:dark:bg-orange-400 z-10"
            style={{ left: '90%' }}
            title="90% Threshold: 162 days (Critical Proximity)"
          />

          {/* 100% Threshold Marker Line (180d) */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-red-700 dark:bg-red-500 z-10"
            style={{ left: 'calc(100% - 2px)' }}
            title="100% Limit: 180 days (Statutory Threshold)"
          />
        </div>

        {/* Threshold Markers Legend Under the Bar */}
        <div className="relative w-full text-[10px] text-slate-500 dark:text-slate-300 select-none">
          <div className="flex justify-between items-center">
            <span>0d</span>
            <span className={maxAbsence >= 135 ? 'text-amber-700 dark:text-amber-400 font-bold' : ''}>
              75% (135d)
            </span>
            <span className={maxAbsence >= 162 ? 'text-orange-700 dark:text-orange-400 font-bold' : ''}>
              90% (162d)
            </span>
            <span className={maxAbsence >= 180 ? 'text-red-700 dark:text-red-400 font-bold' : ''}>
              180d
            </span>
          </div>
        </div>
      </div>

      {/* Tier Explanation Strip - hidden on mobile to avoid overcrowding, visible on tablet/desktop */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700 text-[11px]">
        <div className={`p-2 rounded-lg border ${
          tier === 'safe'
            ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700 font-semibold text-teal-900 dark:text-teal-200'
            : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
        }`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span className="font-bold text-slate-900 dark:text-slate-200">0%–74% Safe</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-300">
            0–134 days. Normal travel flexibility without settlement risk.
          </p>
        </div>

        <div className={`p-2 rounded-lg border ${
          tier === 'warning_75'
            ? 'bg-amber-100/70 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 font-semibold text-amber-950 dark:text-amber-200 shadow-2xs'
            : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
        }`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-bold text-slate-900 dark:text-slate-200">75%–89% Caution</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-300">
            135–161 days. Plan subsequent travel cautiously before booking.
          </p>
        </div>

        <div className={`p-2 rounded-lg border ${
          tier === 'critical_90' || tier === 'breached_100'
            ? 'bg-orange-100/70 dark:bg-orange-950/40 border-orange-400 dark:border-orange-700 font-semibold text-orange-950 dark:text-orange-200 shadow-2xs'
            : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
        }`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span className="font-bold text-slate-900 dark:text-slate-200">90%–100%+ Critical</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-300">
            162–180+ days. Risk of breaching CR 2.2 statutory limit.
          </p>
        </div>
      </div>
    </div>
  );
};
