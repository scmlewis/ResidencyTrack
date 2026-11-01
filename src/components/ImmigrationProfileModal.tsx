import React, { useState } from 'react';
import { X, ShieldAlert, Check, Calendar, Info } from 'lucide-react';
import { ImmigrationProfile } from '../types';

interface ImmigrationProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ImmigrationProfile;
  onSave: (updated: ImmigrationProfile) => void;
  fullPage?: boolean;
}

export const ImmigrationProfileModal: React.FC<ImmigrationProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
    fullPage = false
  }) => {
  const [formData, setFormData] = useState<ImmigrationProfile>(profile);
  const [error, setError] = useState<string | null>(null);

if (!isOpen && !fullPage) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.visaGrantDate && formData.firstUKArrivalDate) {
      if (formData.firstUKArrivalDate < formData.visaGrantDate) {
        setError('First physical arrival in the UK cannot be earlier than visa grant date.');
        return;
      }
    }

    if (!formData.qualifyingPeriodStartDate) {
      setError('Qualifying period start date is required for continuous residence calculations.');
      return;
    }

    onSave({
      ...formData,
      updatedAt: new Date().toISOString()
    });
    onClose();
  };

  const handleUseArrivalAsQualifying = () => {
    if (formData.firstUKArrivalDate) {
      setFormData(prev => ({
        ...prev,
        qualifyingPeriodStartDate: prev.firstUKArrivalDate,
        qualifyingPeriodStartConfirmed: true
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto my-4 sm:my-8 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Immigration Profile</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure your British National (Overseas) qualifying timeline
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Visa Route (Fixed for v0.1) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Immigration Route
            </label>
            <input
              type="text"
              disabled
              value="British National (Overseas) — Standard 5-Year Settlement"
              className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 cursor-not-allowed font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visa Grant Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Visa Grant Date
              </label>
              <input
                type="date"
                value={formData.visaGrantDate || ''}
                onChange={e => setFormData({ ...formData, visaGrantDate: e.target.value || null })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Official approval date on grant letter.
              </span>
            </div>

            {/* First Arrival Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First UK Arrival Date
              </label>
              <input
                type="date"
                value={formData.firstUKArrivalDate || ''}
                onChange={e => setFormData({ ...formData, firstUKArrivalDate: e.target.value || null })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Physical arrival stamp / e-gate entry.
              </span>
            </div>
          </div>

          {/* Qualifying Period Start Date */}
          <div className="p-4 bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-800/60 rounded-xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                  Qualifying Period Start Date <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Date used to measure 5 continuous years. Note: Visa grant date and arrival date are stored separately and not automatically assumed interchangeable.
                </p>
              </div>
              {formData.firstUKArrivalDate && (
                <button
                  type="button"
                  onClick={handleUseArrivalAsQualifying}
                  className="px-2.5 py-1 text-[11px] font-medium text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 rounded-md hover:bg-teal-50 dark:hover:bg-slate-700 shrink-0 transition-colors"
                >
                  Use Arrival Date
                </button>
              )}
            </div>

            <input
              type="date"
              required
              value={formData.qualifyingPeriodStartDate || ''}
              onChange={e => setFormData({ ...formData, qualifyingPeriodStartDate: e.target.value || null })}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formData.qualifyingPeriodStartConfirmed}
                onChange={e => setFormData({ ...formData, qualifyingPeriodStartConfirmed: e.target.checked })}
                className="w-4 h-4 text-teal-600 border-slate-300 dark:border-slate-700 rounded focus:ring-teal-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                I confirm this date represents my intended continuous residence start
              </span>
            </label>
          </div>

          {/* Actual ILR Grant Date (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Actual ILR Grant Date <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional if already granted)</span>
            </label>
            <input
              type="date"
              value={formData.actualILRGrantDate || ''}
              onChange={e => setFormData({ ...formData, actualILRGrantDate: e.target.value || null })}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              Leave blank if still completing 5 years. Used to accurately anchor citizenship eligibility.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
