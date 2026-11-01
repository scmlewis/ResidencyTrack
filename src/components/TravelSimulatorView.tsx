import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Plane,
  Save,
  RotateCcw,
  Sparkles,
  MapPin,
  Calendar
} from 'lucide-react';
import {
  TravelRecord,
  ImmigrationProfile,
  SimulationComparison,
  TripStatus
} from '../types';
import { simulateTravelImpact } from '../engine/calculations';
import { formatDisplayDate, isValidIsoDate, addDays } from '../engine/dateUtils';

interface TravelSimulatorViewProps {
  records: TravelRecord[];
  profile: ImmigrationProfile;
  onSaveSimulatedTrip: (trip: Omit<TravelRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const TravelSimulatorView: React.FC<TravelSimulatorViewProps> = ({
  records,
  profile,
  onSaveSimulatedTrip
}) => {
  const [departureDate, setDepartureDate] = useState('2026-09-10');
  const [returnDate, setReturnDate] = useState('2026-09-28');
  const [destination, setDestination] = useState('Japan');
  const [purpose, setPurpose] = useState('Autumn Vacation (Tokyo & Kyoto)');
  const [error, setError] = useState<string | null>(null);

  // Simulation execution state
  const [simulationResult, setSimulationResult] = useState<SimulationComparison | null>(() => {
    // Run initial simulation on default sample input
    return simulateTravelImpact(
      records,
      {
        departureDate: '2026-09-10',
        returnDate: '2026-09-28',
        destination: 'Japan',
        purpose: 'Autumn Vacation (Tokyo & Kyoto)'
      },
      profile
    );
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSimulate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSavedSuccess(false);

    if (!departureDate || !isValidIsoDate(departureDate)) {
      setError('Please provide a valid departure date.');
      return;
    }

    if (!returnDate || !isValidIsoDate(returnDate)) {
      setError('Please provide a valid return date.');
      return;
    }

    if (returnDate < departureDate) {
      setError('Return date cannot be earlier than departure date.');
      return;
    }

    const sim = simulateTravelImpact(
      records,
      {
        departureDate,
        returnDate,
        destination: destination.trim() || 'Abroad',
        purpose: purpose.trim() || 'Simulated Travel'
      },
      profile
    );

    setSimulationResult(sim);
  };

  const handleApplyPreset = (daysDuration: number, dest: string, purp: string) => {
    const dep = '2026-09-15';
    const ret = addDays(dep, daysDuration);
    setDepartureDate(dep);
    setReturnDate(ret);
    setDestination(dest);
    setPurpose(purp);
    setError(null);
    setSavedSuccess(false);

    const sim = simulateTravelImpact(
      records,
      {
        departureDate: dep,
        returnDate: ret,
        destination: dest,
        purpose: purp
      },
      profile
    );
    setSimulationResult(sim);
  };

  const handleSaveToLog = () => {
    if (!departureDate || !returnDate) return;
    onSaveSimulatedTrip({
      departureDate,
      returnDate,
      destination: destination.trim() || 'Abroad',
      purpose: purpose.trim() || 'Travel',
      status: 'planned',
      notes: 'Added from Travel Impact Simulator'
    });
    setSavedSuccess(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Travel Impact Simulator
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulate proposed overseas travel itineraries before booking flights to ensure continuous residence compliance
            </p>
          </div>
        </div>

        {/* Preset quick test buttons */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Quick Scenarios:</span>
          <button
            onClick={() => handleApplyPreset(14, 'Spain', '2-Week Mediterranean Holiday')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
          >
            2-Week Holiday (14d)
          </button>
          <button
            onClick={() => handleApplyPreset(25, 'Hong Kong', 'Family Visit & Gathering')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
          >
            3.5-Week HK Visit (25d)
          </button>
          <button
            onClick={() => handleApplyPreset(70, 'Canada', 'Extended Remote Work Stay')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Long 70-Day Remote Work
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Parameters Form (1 col) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-xs flex flex-col justify-between transition-colors">
          <form onSubmit={handleSimulate} className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Proposed Travel Parameters</span>
            </h2>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Departure Date
              </label>
              <input
                type="date"
                required
                value={departureDate}
                onChange={e => setDepartureDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Return Date
              </label>
              <input
                type="date"
                required
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destination
              </label>
              <input
                type="text"
                placeholder="e.g. Hong Kong, Japan"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Travel Purpose
              </label>
              <input
                type="text"
                placeholder="e.g. Holiday, Family visit"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Run Simulation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-400 dark:text-slate-500">
            Simulations are computed strictly in memory. Your saved travel log will not be altered unless you click "Save to Travel Log".
          </div>
        </div>

        {/* Simulation Impact Results (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {simulationResult ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-6 shadow-xs space-y-6 transition-colors">
              {/* Breach banner or safe banner */}
              {simulationResult.createsThresholdBreach ? (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-xs text-red-900 dark:text-red-200 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm text-red-900 dark:text-red-200 mb-0.5">
                      Statutory Limit Breach Detected
                    </h3>
                    <p className="leading-relaxed">
                      This proposed travel itinerary would cause your absences to exceed the standard Home Office threshold. Review the comparative table below.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200 mb-0.5">
                      Itinerary Compliant with Standard Limits
                    </h3>
                    <p className="leading-relaxed">
                      All rolling 12-month periods and naturalisation absence limits remain within normal guidelines with this trip added.
                    </p>
                  </div>
                </div>
              )}

              {/* Trip Counted Days Summary */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs flex items-center justify-between font-mono">
                <span className="text-slate-600 dark:text-slate-400">Simulated Whole Days Outside UK:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  +{simulationResult.simulatedTripAbsenceDays} days
                </span>
              </div>

              {/* Mobile Comparison Cards (md:hidden) */}
              <div className="md:hidden space-y-2.5">
                {/* Metric 1: ILR Rolling Peak */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <span>ILR Peak Rolling 12M</span>
                    <span className="font-mono text-slate-400">Limit: 180d</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs pt-0.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Current: <strong className="text-slate-800 dark:text-slate-200">{simulationResult.ilr.beforePeak}d</strong>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className={`font-bold ${
                      simulationResult.ilr.afterPeak > 180 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      After: {simulationResult.ilr.afterPeak}d
                    </span>
                    <span className="text-teal-700 dark:text-teal-400 font-bold">
                      +{simulationResult.ilr.delta}d
                    </span>
                  </div>
                </div>

                {/* Metric 2: Naturalisation 5-Year */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <span>Naturalisation 5-Year</span>
                    <span className="font-mono text-slate-400">Limit: 450d</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs pt-0.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Current: <strong className="text-slate-800 dark:text-slate-200">{simulationResult.naturalisation5Year.beforeDays}d</strong>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className={`font-bold ${
                      simulationResult.naturalisation5Year.afterDays > 450 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      After: {simulationResult.naturalisation5Year.afterDays}d
                    </span>
                    <span className="text-teal-700 dark:text-teal-400 font-bold">
                      +{simulationResult.naturalisation5Year.delta}d
                    </span>
                  </div>
                </div>

                {/* Metric 3: Naturalisation Final 12M */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <span>Naturalisation Final 12M</span>
                    <span className="font-mono text-slate-400">Limit: 90d</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs pt-0.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Current: <strong className="text-slate-800 dark:text-slate-200">{simulationResult.naturalisationFinal12.beforeDays}d</strong>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className={`font-bold ${
                      simulationResult.naturalisationFinal12.afterDays > 90 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      After: {simulationResult.naturalisationFinal12.afterDays}d
                    </span>
                    <span className="text-teal-700 dark:text-teal-400 font-bold">
                      +{simulationResult.naturalisationFinal12.delta}d
                    </span>
                  </div>
                </div>
              </div>

              {/* Desktop Comparison Table (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="py-2.5 px-3">Statutory Metric</th>
                      <th className="py-2.5 px-3 text-center">Current Total</th>
                      <th className="py-2.5 px-3 text-center">Simulated Total</th>
                      <th className="py-2.5 px-3 text-right">Delta Change</th>
                      <th className="py-2.5 px-3 text-right">Normal Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                    {/* Metric 1: ILR Rolling Peak */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                        ILR — Peak Rolling 12M Absence
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700 dark:text-slate-300">
                        {simulationResult.ilr.beforePeak} d
                      </td>
                      <td className={`py-3 px-3 text-center font-bold ${
                        simulationResult.ilr.afterPeak > 180 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {simulationResult.ilr.afterPeak} d
                      </td>
                      <td className="py-3 px-3 text-right text-teal-700 dark:text-teal-400 font-semibold">
                        +{simulationResult.ilr.delta} d
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 dark:text-slate-500">180 d</td>
                    </tr>

                    {/* Metric 2: Naturalisation 5-Year */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                        Naturalisation — 5-Year Total
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700 dark:text-slate-300">
                        {simulationResult.naturalisation5Year.beforeDays} d
                      </td>
                      <td className={`py-3 px-3 text-center font-bold ${
                        simulationResult.naturalisation5Year.afterDays > 450 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {simulationResult.naturalisation5Year.afterDays} d
                      </td>
                      <td className="py-3 px-3 text-right text-teal-700 dark:text-teal-400 font-semibold">
                        +{simulationResult.naturalisation5Year.delta} d
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 dark:text-slate-500">450 d</td>
                    </tr>

                    {/* Metric 3: Naturalisation Final 12M */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                        Naturalisation — Final 12M
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700 dark:text-slate-300">
                        {simulationResult.naturalisationFinal12.beforeDays} d
                      </td>
                      <td className={`py-3 px-3 text-center font-bold ${
                        simulationResult.naturalisationFinal12.afterDays > 90 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {simulationResult.naturalisationFinal12.afterDays} d
                      </td>
                      <td className="py-3 px-3 text-right text-teal-700 dark:text-teal-400 font-semibold">
                        +{simulationResult.naturalisationFinal12.delta} d
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 dark:text-slate-500">90 d</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setDepartureDate('2026-09-10');
                    setReturnDate('2026-09-28');
                    setDestination('Japan');
                    setPurpose('Vacation');
                    handleSimulate();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  {savedSuccess && (
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Saved as Planned Trip!</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveToLog}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to Travel Log</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-12 text-center text-xs text-slate-400 dark:text-slate-500 transition-colors">
              Enter proposed travel dates on the left and click "Run Simulation" to inspect compliance impact.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
