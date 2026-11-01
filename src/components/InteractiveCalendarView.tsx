import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plane,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Info,
  Flag
} from 'lucide-react';
import { TravelRecord, ImmigrationProfile, TimelineMilestone } from '../types';
import {
  formatIsoDate,
  formatDisplayDate,
  getDaysInMonth,
  addDays,
  subDays,
  isValidIsoDate
} from '../engine/dateUtils';

interface InteractiveCalendarViewProps {
  records: TravelRecord[];
  profile: ImmigrationProfile;
  milestones: TimelineMilestone[];
}

export const InteractiveCalendarView: React.FC<InteractiveCalendarViewProps> = ({
  records,
  profile,
  milestones
}) => {
  // Current calendar view year & month (default to recent 2026 or today)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // August 2026 (5-yr anniversary month in demo)
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-08-01');

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Map trips to dates
  const daysData = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const result = [];

    // First day of month day of week (0 = Sun, 1 = Mon, ..., 6 = Sat)
    // In UK standard calendars, Monday is often index 0
    const firstDayUtc = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const firstDayOfWeek = (firstDayUtc.getUTCDay() + 6) % 7; // Monday = 0, Sunday = 6

    for (let day = 1; day <= daysInMonth; day++) {
      const isoDate = formatIsoDate(currentYear, currentMonth, day);

      // Find trips that cover this day
      const activeTrips = records.filter(r => {
        if (!r.departureDate || !r.returnDate) return false;
        return isoDate >= r.departureDate && isoDate <= r.returnDate;
      });

      // Find milestones on this day
      const dayMilestones = milestones.filter(m => m.date === isoDate);

      // Determine day category
      let category: 'uk_resident' | 'completed_travel' | 'planned_travel' | 'boundary_day' = 'uk_resident';
      if (activeTrips.length > 0) {
        const isPlanned = activeTrips.some(t => t.status === 'planned');
        const isBoundary = activeTrips.some(t => t.departureDate === isoDate || t.returnDate === isoDate);

        if (isBoundary) {
          category = 'boundary_day';
        } else if (isPlanned) {
          category = 'planned_travel';
        } else {
          category = 'completed_travel';
        }
      }

      result.push({
        day,
        isoDate,
        activeTrips,
        milestones: dayMilestones,
        category
      });
    }

    return { firstDayOfWeek, days: result, daysInMonth };
  }, [currentYear, currentMonth, records, milestones]);

  // Selected date details
  const selectedDetails = useMemo(() => {
    if (!selectedDate) return null;

    const tripsOnDate = records.filter(r => {
      if (!r.departureDate || !r.returnDate) return false;
      return selectedDate >= r.departureDate && selectedDate <= r.returnDate;
    });

    const milestonesOnDate = milestones.filter(m => m.date === selectedDate);

    return {
      date: selectedDate,
      trips: tripsOnDate,
      milestones: milestonesOnDate
    };
  }, [selectedDate, records, milestones]);

  // Monthly summary of absence days
  const monthlyAbsenceDays = useMemo(() => {
    let count = 0;
    daysData.days.forEach(d => {
      if (d.category === 'completed_travel' || d.category === 'planned_travel') {
        count++;
      }
    });
    return count;
  }, [daysData]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Interactive Calendar</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualise UK physical presence, overseas travel periods, and immigration milestones
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Year & Month selectors */}
            <div className="flex items-center gap-2">
              <select
                value={currentMonth}
                onChange={e => setCurrentMonth(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {monthNames.map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={e => setCurrentYear(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              >
                {[2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 overflow-hidden">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border-l border-slate-200 dark:border-slate-700"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <span className="text-slate-600 dark:text-slate-400">UK Presence</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800" />
            <span className="text-slate-600 dark:text-slate-400">Completed Overseas Travel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800" />
            <span className="text-slate-600 dark:text-slate-400">Planned Travel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-teal-100 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800" />
            <span className="text-slate-600 dark:text-slate-400">Departure / Arrival Day (UK Day)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-600 dark:text-slate-400">Immigration Milestone</span>
          </div>
          <div className="ml-auto text-xs font-mono text-slate-500 dark:text-slate-400">
            Monthly Absence:{' '}
            <strong className="text-slate-900 dark:text-slate-100 font-bold">{monthlyAbsenceDays} days</strong>
          </div>
        </div>
      </div>

      {/* Calendar Grid + Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-400 dark:text-slate-500 mb-2">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank cells before start of month */}
            {Array.from({ length: daysData.firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="h-16 md:h-20 bg-slate-50/40 dark:bg-slate-800/30 rounded-lg border border-transparent" />
            ))}

            {/* Days of current month */}
            {daysData.days.map((dayObj) => {
              const isSelected = selectedDate === dayObj.isoDate;
              const hasTrips = dayObj.activeTrips.length > 0;
              const hasMilestone = dayObj.milestones.length > 0;

              let bgClasses = 'bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/70 dark:border-slate-700/80 text-slate-700 dark:text-slate-300';
              if (dayObj.category === 'completed_travel') {
                bgClasses = 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/80 text-blue-900 dark:text-blue-300';
              } else if (dayObj.category === 'planned_travel') {
                bgClasses = 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/80 text-purple-900 dark:text-purple-300';
              } else if (dayObj.category === 'boundary_day') {
                bgClasses = 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/80 text-teal-900 dark:text-teal-300';
              }

              if (isSelected) {
                bgClasses += ' ring-2 ring-teal-600 dark:ring-teal-400 ring-offset-1 dark:ring-offset-slate-900 font-bold';
              }

              return (
                <button
                  key={dayObj.isoDate}
                  onClick={() => setSelectedDate(dayObj.isoDate)}
                  className={`h-16 md:h-20 p-1.5 rounded-lg border text-left flex flex-col justify-between transition-all ${bgClasses}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono tabular-nums">{dayObj.day}</span>
                    {hasMilestone && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" title="Immigration Milestone" />
                    )}
                  </div>

                  {hasTrips && (
                    <div className="text-[10px] truncate font-medium">
                      {dayObj.activeTrips[0].destination}
                    </div>
                  )}

                  {hasMilestone && !hasTrips && (
                    <div className="text-[10px] truncate text-amber-700 dark:text-amber-400 font-semibold">
                      Milestone
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Inspector (1 col) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <CalendarIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {selectedDate ? formatDisplayDate(selectedDate, { fullMonth: true, showDayOfWeek: true }) : 'Select a date'}
              </h2>
            </div>

            {selectedDetails ? (
              <div className="space-y-4">
                {/* Milestones on Date */}
                {selectedDetails.milestones.length > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <Flag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{selectedDetails.milestones[0].title}</span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      {selectedDetails.milestones[0].description}
                    </p>
                  </div>
                )}

                {/* Trips on Date */}
                {selectedDetails.trips.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Active Overseas Travel
                    </div>
                    {selectedDetails.trips.map(trip => (
                      <div key={trip.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{trip.destination}</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                              trip.status === 'completed'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:border dark:border-blue-800/40'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 dark:border dark:border-purple-800/40'
                            }`}
                          >
                            {trip.status === 'completed' ? 'Completed' : 'Planned'}
                          </span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-300">
                          {trip.purpose}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {formatDisplayDate(trip.departureDate)} → {formatDisplayDate(trip.returnDate)}
                        </div>

                        {/* Counting rule notice */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                          {selectedDate === trip.departureDate ? (
                            <span className="text-teal-700 dark:text-teal-400 font-medium">Departure day: partial day in UK, not counted as absence.</span>
                          ) : selectedDate === trip.returnDate ? (
                            <span className="text-teal-700 dark:text-teal-400 font-medium">Arrival day: partial day in UK, not counted as absence.</span>
                          ) : (
                            <span className="text-blue-700 dark:text-blue-400 font-medium">Whole day spent outside UK: counted as absence day.</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Physically in the United Kingdom</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      No overseas travel recorded on this calendar day. Counts fully towards your qualifying continuous residence.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                Click any calendar cell to view daily residence breakdown.
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
            Navigation tip: Select a month & year from the dropdown above to view past or future periods.
          </div>
        </div>
      </div>
    </div>
  );
};
