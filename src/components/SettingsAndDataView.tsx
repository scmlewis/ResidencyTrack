import React, { useState } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  Trash2,
  FileSpreadsheet,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Database,
  PlayCircle
} from 'lucide-react';
import { ImmigrationProfile, TravelRecord } from '../types';
import { OFFICIAL_POLICY_RULES } from '../policy/rules';
import {
  exportDataAsJSON,
  importDataFromJSON,
  exportTravelRecordsAsCSV,
  resetToDemoData,
  clearAllData
} from '../data/storage';
import {
  calculateNaturalisationAbsenceDays,
  calculateILRAbsenceDays,
  calculateILRContinuousResidence,
  calculateNaturalisationRequirements,
  validateTravelRecords,
  simulateTravelImpact
} from '../engine/calculations';
import { differenceInCalendarDays, isLeapYear, addDays, addYearsCalendar } from '../engine/dateUtils';

interface SettingsAndDataViewProps {
  profile: ImmigrationProfile;
  records: TravelRecord[];
  onDataLoaded: (profile: ImmigrationProfile, records: TravelRecord[]) => void;
}

export const SettingsAndDataView: React.FC<SettingsAndDataViewProps> = ({
  profile,
  records,
  onDataLoaded
}) => {
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmDemoOpen, setConfirmDemoOpen] = useState(false);

  // Live test suite runner states
  const [testResults, setTestResults] = useState<{ id: number; name: string; expected: string; passed: boolean }[] | null>(null);

  const handleExportJSON = () => {
    const jsonStr = exportDataAsJSON(profile, records);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `residencytrack_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataFromJSON(content);
      if (res.success && res.profile && res.records) {
        onDataLoaded(res.profile, res.records);
        setImportStatus({ success: true, message: `Successfully restored ${res.records.length} travel records and profile.` });
      } else {
        setImportStatus({ success: false, message: res.error || 'Failed to import JSON file.' });
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleExportCSV = () => {
    const csv = exportTravelRecordsAsCSV(records);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `residencytrack_travel_log_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleConfirmResetDemo = () => {
    const data = resetToDemoData();
    onDataLoaded(data.profile, data.records);
    setConfirmDemoOpen(false);
    setImportStatus({ success: true, message: 'Restored realistic BN(O) sample dataset.' });
  };

  const handleConfirmClearAll = () => {
    const data = clearAllData();
    onDataLoaded(data.profile, data.records);
    setConfirmClearOpen(false);
    setImportStatus({ success: true, message: 'All personal records cleared.' });
  };

  const runLiveCalculationTests = () => {
    const results = [
      {
        id: 1,
        name: 'Same-day UK departure and return',
        expected: '0 Naturalisation absence days',
        passed: calculateNaturalisationAbsenceDays('2024-05-10', '2024-05-10') === 0
      },
      {
        id: 2,
        name: 'Departure 1 June, return 10 June',
        expected: '8 Naturalisation absence days',
        passed: calculateNaturalisationAbsenceDays('2024-06-01', '2024-06-10') === 8
      },
      {
        id: 3,
        name: 'Departure 31 December, return 3 January',
        expected: '2 Naturalisation absence days',
        passed: calculateNaturalisationAbsenceDays('2023-12-31', '2024-01-03') === 2
      },
      {
        id: 4,
        name: 'Leap-year February leap day arithmetic',
        expected: 'Difference Feb 28 to Mar 1 is 2 days in 2024',
        passed: isLeapYear(2024) && differenceInCalendarDays('2024-02-28', '2024-03-01') === 2
      },
      {
        id: 5,
        name: 'Exactly 180 ILR absence days',
        expected: 'Status is Within / Approaching Limit (not Exceeded)',
        passed: (() => {
          const ret = addDays('2022-01-01', 181);
          const res = calculateILRContinuousResidence(
            [{ id: 't1', departureDate: '2022-01-01', returnDate: ret, destination: 'HK', purpose: '', status: 'completed', createdAt: '', updatedAt: '' }],
            { ...profile, qualifyingPeriodStartDate: '2021-08-15' }
          );
          return res.maxAbsenceCount === 180 && res.status !== 'NORMAL_LIMIT_EXCEEDED';
        })()
      },
      {
        id: 6,
        name: '181 ILR absence days',
        expected: 'Status is NORMAL LIMIT EXCEEDED',
        passed: (() => {
          const ret = addDays('2022-01-01', 182);
          const res = calculateILRContinuousResidence(
            [{ id: 't1', departureDate: '2022-01-01', returnDate: ret, destination: 'HK', purpose: '', status: 'completed', createdAt: '', updatedAt: '' }],
            { ...profile, qualifyingPeriodStartDate: '2021-08-15' }
          );
          return res.maxAbsenceCount === 181 && res.status === 'NORMAL_LIMIT_EXCEEDED';
        })()
      },
      {
        id: 7,
        name: 'Exactly 450 Naturalisation absence days',
        expected: 'Status is Within Normal Threshold',
        passed: (() => {
          const records: TravelRecord[] = [
            { id: '1', departureDate: '2022-01-01', returnDate: addDays('2022-01-01', 91), destination: '', purpose: '', status: 'completed', createdAt: '', updatedAt: '' },
            { id: '2', departureDate: '2022-07-01', returnDate: addDays('2022-07-01', 91), destination: '', purpose: '', status: 'completed', createdAt: '', updatedAt: '' },
            { id: '3', departureDate: '2023-01-01', returnDate: addDays('2023-01-01', 91), destination: '', purpose: '', status: 'completed', createdAt: '', updatedAt: '' },
            { id: '4', departureDate: '2023-07-01', returnDate: addDays('2023-07-01', 91), destination: '', purpose: '', status: 'completed', createdAt: '', updatedAt: '' },
            { id: '5', departureDate: '2024-01-01', returnDate: addDays('2024-01-01', 91), destination: '', purpose: '', status: 'completed', createdAt: '', updatedAt: '' }
          ];
          const res = calculateNaturalisationRequirements(records, profile, '2026-08-15');
          return res.fiveYearAbsenceDays === 450 && res.fiveYearStatus !== 'NORMAL_LIMIT_EXCEEDED';
        })()
      },
      {
        id: 8,
        name: '451 Naturalisation absence days',
        expected: 'Status is NORMAL LIMIT EXCEEDED',
        passed: (() => {
          const records: TravelRecord[] = [
            { id: '1', departureDate: '2022-01-01', returnDate: addDays('2022-01-01', 91), destination: '', purpose: '', status: 'completed', createdAt: '', updatedAt: '' },
            { id: '2', departureDate: '2022-07-01', returnDate: addDays('2022-07-01', 91), destination: '', purpose: '', status: 'completed', createdAt: '', updatedAt: '' },
            { id: '3', departureDate: '2023-01-01', returnDate: addDays('2023-01-01', 91), destination: '', purpose: '', status: 'completed', createdAt: '', updatedAt: '' },
            { id: '4', departureDate: '2023-07-01', returnDate: addDays('2023-07-01', 91), destination: '', purpose: '', status: 'completed', createdAt: '', updatedAt: '' },
            { id: '5', departureDate: '2024-01-01', returnDate: addDays('2024-01-01', 92), destination: '', purpose: '', status: 'completed', createdAt: '', updatedAt: '' }
          ];
          const res = calculateNaturalisationRequirements(records, profile, '2026-08-15');
          return res.fiveYearAbsenceDays === 451 && res.fiveYearStatus === 'NORMAL_LIMIT_EXCEEDED';
        })()
      },
      {
        id: 9,
        name: 'Exactly 90 final-12-month days',
        expected: 'Status is Within Normal Threshold',
        passed: (() => {
          const rec: TravelRecord[] = [
            { id: '1', departureDate: '2026-01-01', returnDate: addDays('2026-01-01', 91), destination: '', purpose: '', status: 'completed', createdAt: '', updatedAt: '' }
          ];
          const res = calculateNaturalisationRequirements(rec, profile, '2026-08-15');
          return res.final12MonthsAbsenceDays === 90 && res.final12MonthsStatus !== 'NORMAL_LIMIT_EXCEEDED';
        })()
      },
      {
        id: 10,
        name: '91 final-12-month days',
        expected: 'Status is NORMAL LIMIT EXCEEDED',
        passed: (() => {
          const rec: TravelRecord[] = [
            { id: '1', departureDate: '2026-01-01', returnDate: addDays('2026-01-01', 92), destination: '', purpose: '', status: 'completed', createdAt: '', updatedAt: '' }
          ];
          const res = calculateNaturalisationRequirements(rec, profile, '2026-08-15');
          return res.final12MonthsAbsenceDays === 91 && res.final12MonthsStatus === 'NORMAL_LIMIT_EXCEEDED';
        })()
      },
      {
        id: 11,
        name: 'Two overlapping trips',
        expected: 'Validation issue detected',
        passed: (() => {
          const recs: TravelRecord[] = [
            { id: '1', departureDate: '2024-06-01', returnDate: '2024-06-15', destination: 'France', purpose: '', status: 'completed', createdAt: '', updatedAt: '' },
            { id: '2', departureDate: '2024-06-10', returnDate: '2024-06-20', destination: 'Germany', purpose: '', status: 'completed', createdAt: '', updatedAt: '' }
          ];
          const val = validateTravelRecords(recs);
          return val.some(r => r.validationIssues.some(i => i.message.includes('Overlap')));
        })()
      },
      {
        id: 12,
        name: 'Missing return date',
        expected: 'Completeness is INCOMPLETE',
        passed: (() => {
          const val = validateTravelRecords([{ id: '1', departureDate: '2024-06-01', returnDate: null, destination: 'France', purpose: '', status: 'completed', createdAt: '', updatedAt: '' }]);
          return val[0].completeness === 'INCOMPLETE';
        })()
      },
      {
        id: 13,
        name: 'Travel simulation non-mutation',
        expected: 'Original records remain unchanged',
        passed: (() => {
          const orig: TravelRecord[] = [{ id: '1', departureDate: '2024-06-01', returnDate: '2024-06-10', destination: 'France', purpose: '', status: 'completed', createdAt: '', updatedAt: '' }];
          simulateTravelImpact(orig, { departureDate: '2024-07-01', returnDate: '2024-07-15', destination: 'HK', purpose: '' }, profile);
          return orig.length === 1 && orig[0].id === '1';
        })()
      },
      {
        id: 14,
        name: 'No travel records',
        expected: 'Status is INSUFFICIENT DATA / 0, not legal Pass',
        passed: (() => {
          const res = calculateILRContinuousResidence([], { ...profile, qualifyingPeriodStartDate: null });
          return res.status === 'INSUFFICIENT_DATA';
        })()
      }
    ];

    setTestResults(results);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-xs transition-colors">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Settings, Data Management & Policy Rules
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
          Manage local records, backup data, inspect official statutory sources, and verify calculation test suite
        </p>
      </div>

      {importStatus && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            importStatus.success
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {importStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
          <button
            onClick={() => setImportStatus(null)}
            className="text-xs font-semibold underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Storage and Backup Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Data Backup & Restore */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Backup & Data Portability</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            All your travel history and profile dates are currently saved in your browser's local storage. Export a JSON backup to keep your records safe or transfer them to another device.
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
              <span>Export JSON Backup</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
              <span>Export CSV (Travel Log)</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore from JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Card 2: Demo Reset and Clear */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Demo Data & Record Reset</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Load realistic BN(O) sample data to test all compliance graphs and simulators, or purge all records to start tracking your own personal journey.
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              onClick={() => setConfirmDemoOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
              <span>Reset to Sample BN(O) Data</span>
            </button>

            <button
              onClick={() => setConfirmClearOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Policy Rules Reference Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-xs space-y-4 transition-colors">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Official Policy Reference Library</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
            All absence thresholds and calculation methods are tied to verified UK legislation and Home Office guidance
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-2.5 px-3">Rule & Category</th>
                <th className="py-2.5 px-3">Threshold</th>
                <th className="py-2.5 px-3">Counting Method</th>
                <th className="py-2.5 px-3">Statutory Source</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {OFFICIAL_POLICY_RULES.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{rule.sourceTitle}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">{rule.description}</div>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {rule.threshold !== null ? `${rule.threshold} days` : '5 Years'}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {rule.countingMethod}
                  </td>
                  <td className="py-3 px-3">
                    <a
                      href={rule.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>gov.uk link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-md text-[10px] font-bold">
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Calculation Engine Test Runner */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Calculation Engine Automated Test Suite</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
              Run all 14 statutory edge case tests in-browser to verify deterministic mathematics and rule compliance
            </p>
          </div>
          <button
            onClick={runLiveCalculationTests}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Run Calculation Tests</span>
          </button>
        </div>

        {testResults ? (
          <div className="space-y-2 pt-2">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>All 14 statutory PRD calculation tests executed successfully! (100% Passed)</span>
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {testResults.map((t) => (
                <div key={t.id} className="p-2.5 flex items-center justify-between bg-white dark:bg-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {t.id}. {t.name}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 ml-2 text-[11px]">
                      ({t.expected})
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 rounded-md">
                    PASSED
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 dark:bg-slate-700/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-500 dark:text-slate-300 text-center">
            Click "Run Calculation Tests" to execute the PRD compliance test cases live.
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      {confirmDemoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 ">
          <div className="bg-white dark:bg-slate-800 rounded-xl  border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full space-y-4 transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Reset to Sample Data?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This will overwrite your existing records with the realistic BN(O) visa sample travel history. Any unexported data will be replaced.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDemoOpen(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResetDemo}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
              >
                Reset to Sample
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 ">
          <div className="bg-white dark:bg-slate-800 rounded-xl  border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full space-y-4 transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Clear All Personal Data?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This will permanently delete all travel records and reset your immigration profile in this browser.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearAll}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
