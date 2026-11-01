import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  PlaneTakeoff,
  Clock,
  Calendar,
  X,
  MapPin,
  FileSpreadsheet
} from 'lucide-react';
import { TravelRecord, TripStatus, ImmigrationProfile } from '../types';
import { validateTravelRecords } from '../engine/calculations';
import { formatDisplayDate, isValidIsoDate } from '../engine/dateUtils';
import { exportTravelRecordsAsCSV } from '../data/storage';

interface TravelLogViewProps {
  records: TravelRecord[];
  profile: ImmigrationProfile;
  onAddTrip: (trip: Omit<TravelRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTrip: (trip: TravelRecord) => void;
  onDeleteTrip: (tripId: string) => void;
  isAddModalOpenInitially?: boolean;
  onCloseAddModalInitially?: () => void;
}

export const TravelLogView: React.FC<TravelLogViewProps> = ({
  records,
  profile,
  onAddTrip,
  onUpdateTrip,
  onDeleteTrip,
  isAddModalOpenInitially,
  onCloseAddModalInitially
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'departure' | 'destination' | 'days'>('departure');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(Boolean(isAddModalOpenInitially));
  const [editingTrip, setEditingTrip] = useState<TravelRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    departureDate: '',
    returnDate: '',
    destination: '',
    purpose: '',
    status: 'completed' as TripStatus,
    notes: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Sync initial open prop
  React.useEffect(() => {
    if (isAddModalOpenInitially) {
      setIsModalOpen(true);
      if (onCloseAddModalInitially) onCloseAddModalInitially();
    }
  }, [isAddModalOpenInitially]);

  // Validated records with completeness and issue detection
  const validatedRecords = useMemo(() => {
    return validateTravelRecords(records, profile);
  }, [records, profile]);

  // Unique years for filter dropdown
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    records.forEach(r => {
      if (r.departureDate) years.add(r.departureDate.slice(0, 4));
      if (r.returnDate) years.add(r.returnDate.slice(0, 4));
    });
    return Array.from(years).sort().reverse();
  }, [records]);

  // Summary stats
  const stats = useMemo(() => {
    const completed = validatedRecords.filter(r => r.status === 'completed');
    const planned = validatedRecords.filter(r => r.status === 'planned');
    const totalAbsenceDays = validatedRecords.reduce((acc, curr) => acc + curr.naturalisationDays, 0);
    const incompleteCount = validatedRecords.filter(r => r.completeness !== 'COMPLETE').length;

    return {
      total: validatedRecords.length,
      completedCount: completed.length,
      plannedCount: planned.length,
      totalAbsenceDays,
      incompleteCount
    };
  }, [validatedRecords]);

  // Filtered & sorted records
  const filteredRecords = useMemo(() => {
    return validatedRecords.filter(trip => {
      // Search
      const matchesSearch =
        trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trip.notes && trip.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status
      const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;

      // Year
      const tripYear = trip.departureDate ? trip.departureDate.slice(0, 4) : '';
      const matchesYear = yearFilter === 'all' || tripYear === yearFilter;

      return matchesSearch && matchesStatus && matchesYear;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'departure') {
        comparison = (a.departureDate || '').localeCompare(b.departureDate || '');
      } else if (sortField === 'destination') {
        comparison = a.destination.localeCompare(b.destination);
      } else if (sortField === 'days') {
        comparison = a.naturalisationDays - b.naturalisationDays;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [validatedRecords, searchTerm, statusFilter, yearFilter, sortField, sortOrder]);

  const handleOpenAddModal = () => {
    setEditingTrip(null);
    setFormData({
      departureDate: '',
      returnDate: '',
      destination: '',
      purpose: '',
      status: 'completed',
      notes: ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (trip: TravelRecord) => {
    setEditingTrip(trip);
    setFormData({
      departureDate: trip.departureDate || '',
      returnDate: trip.returnDate || '',
      destination: trip.destination,
      purpose: trip.purpose,
      status: trip.status,
      notes: trip.notes || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.departureDate || !isValidIsoDate(formData.departureDate)) {
      setFormError('Valid departure date is required (YYYY-MM-DD).');
      return;
    }

    if (formData.status !== 'ongoing' && (!formData.returnDate || !isValidIsoDate(formData.returnDate))) {
      setFormError('Valid return date is required for planned or completed trips.');
      return;
    }

    if (formData.returnDate && formData.returnDate < formData.departureDate) {
      setFormError('Return date cannot be earlier than departure date.');
      return;
    }

    if (!formData.destination.trim()) {
      setFormError('Destination country or city is required.');
      return;
    }

    if (editingTrip) {
      onUpdateTrip({
        ...editingTrip,
        departureDate: formData.departureDate,
        returnDate: formData.returnDate || null,
        destination: formData.destination.trim(),
        purpose: formData.purpose.trim() || 'Travel',
        status: formData.status,
        notes: formData.notes.trim(),
        updatedAt: new Date().toISOString()
      });
    } else {
      onAddTrip({
        departureDate: formData.departureDate,
        returnDate: formData.returnDate || null,
        destination: formData.destination.trim(),
        purpose: formData.purpose.trim() || 'Travel',
        status: formData.status,
        notes: formData.notes.trim()
      });
    }

    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const csv = exportTravelRecordsAsCSV(records);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `residencytrack_travel_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header and Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Travel Absence Log</h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-300 mt-0.5">
              Maintain an accurate record of all overseas departures and returns from the UK
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors"
              title="Download CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Trip</span>
            </button>
          </div>
        </div>

        {/* Summary Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-3 sm:mt-5 sm:pt-4 border-t border-slate-100 dark:border-slate-700 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Total Trips</span>
            <span className="text-base sm:text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {stats.total}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Completed</span>
            <span className="text-base sm:text-lg font-bold tabular-nums text-teal-700 dark:text-teal-400">
              {stats.completedCount}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Planned</span>
            <span className="text-base sm:text-lg font-bold tabular-nums text-teal-700 dark:text-teal-400">
              {stats.plannedCount}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Total Counted</span>
            <span className="text-base sm:text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {stats.totalAbsenceDays} <span className="text-xs font-normal text-slate-400">days</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3 transition-colors">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search destination, purpose..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Filters and Sorters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300 flex-1 sm:flex-initial">
            <span className="text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="planned">Planned</option>
              <option value="ongoing">Ongoing</option>
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300 flex-1 sm:flex-initial">
            <span className="text-[11px]">Year:</span>
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="w-full sm:w-auto px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Years</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <button
            onClick={() => {
              if (sortField === 'departure') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortField('departure');
                setSortOrder('desc');
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <span>Date</span>
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Trips Content: Dedicated Mobile Cards + Desktop Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden transition-colors">
        {/* Mobile Card List View (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((trip) => {
              const hasIssues = trip.validationIssues && trip.validationIssues.length > 0;
              const isInvalid = trip.completeness === 'INVALID';
              const isIncomplete = trip.completeness === 'INCOMPLETE';

              return (
                <div
                  key={trip.id}
                  className={`p-3.5 space-y-2 transition-colors ${
                    isInvalid
                      ? 'bg-red-50/40 dark:bg-red-950/20'
                      : isIncomplete
                      ? 'bg-amber-50/40 dark:bg-amber-950/20'
                      : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {/* Top row: Destination, Status & Action buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>{trip.destination}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          trip.status === 'completed'
                            ? 'text-teal-700 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/40'
                            : trip.status === 'planned'
                            ? 'text-teal-700 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/40'
                            : 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40'
                        }`}
                      >
                        {trip.status === 'completed' ? 'Completed' : trip.status === 'planned' ? 'Planned' : 'Ongoing'}
                      </span>
                      <button
                        onClick={() => handleOpenEditModal(trip)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        title="Edit trip"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(trip.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors"
                        title="Delete trip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dates & Counted Absences */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                      {formatDisplayDate(trip.departureDate)}
                      <span className="text-slate-400 dark:text-slate-500 mx-1">→</span>
                      {trip.returnDate ? formatDisplayDate(trip.returnDate) : 'Not returned'}
                    </div>
                    <div className="text-right">
                      <span className="tabular-nums text-sm font-bold text-slate-900 dark:text-slate-100">
                        {trip.naturalisationDays}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-300 ml-1">days absence</span>
                    </div>
                  </div>

                  {/* Purpose & Notes */}
                  {(trip.purpose || trip.notes) && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-300 flex items-center justify-between gap-2">
                      <span className="truncate">{trip.purpose}</span>
                      {trip.notes && <span className="italic truncate text-[10px] max-w-[140px]">"{trip.notes}"</span>}
                    </div>
                  )}

                  {/* Validation issues */}
                  {hasIssues && (
                    <div className="mt-1 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-700">
                      {trip.validationIssues.map((issue, idx) => (
                        <div
                          key={idx}
                          className={`text-[10px] flex items-center gap-1 font-medium ${
                            issue.severity === 'error'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{issue.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-300">
              No overseas trips matched the current filter.
            </div>
          )}
        </div>

        {/* Desktop Table View (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-700/60 text-slate-500 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">Dates & Duration</th>
                <th className="py-3 px-4">Destination & Purpose</th>
                <th className="py-3 px-4 text-center">Counting Breakdown</th>
                <th className="py-3 px-4 text-right">Counted Absence</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((trip) => {
                  const hasIssues = trip.validationIssues && trip.validationIssues.length > 0;
                  const isInvalid = trip.completeness === 'INVALID';
                  const isIncomplete = trip.completeness === 'INCOMPLETE';

                  return (
                    <tr
                      key={trip.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${
                        isInvalid
                          ? 'bg-red-50/40 dark:bg-red-950/20'
                          : isIncomplete
                          ? 'bg-amber-50/40 dark:bg-amber-950/20'
                          : ''
                      }`}
                    >
                      {/* Dates */}
                      <td className="py-3 px-4 tabular-nums">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatDisplayDate(trip.departureDate)}
                          <span className="text-slate-400 dark:text-slate-500 mx-1.5">→</span>
                          {trip.returnDate ? formatDisplayDate(trip.returnDate) : 'Not returned'}
                        </div>
                        {hasIssues && (
                          <div className="mt-1 space-y-0.5">
                            {trip.validationIssues.map((issue, idx) => (
                              <div
                                key={idx}
                                className={`text-[10px] flex items-center gap-1 font-sans font-medium ${
                                  issue.severity === 'error'
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>{issue.message}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Destination & Purpose */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{trip.destination}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-300">{trip.purpose}</div>
                            {trip.notes && (
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-0.5 max-w-xs">
                                "{trip.notes}"
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Counting Rule Breakdown */}
                      <td className="py-3 px-4 text-center">
                        <div className="text-[11px] text-slate-500 dark:text-slate-300">
                          Dep & Ret excluded
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          (CR 2.2 / Form AN)
                        </div>
                      </td>

                      {/* Counted Absence Days */}
                      <td className="py-3 px-4 text-right">
                        <span className="tabular-nums text-sm font-bold text-slate-900 dark:text-slate-100">
                          {trip.naturalisationDays}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-1">days</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-md ${
                            trip.status === 'completed'
                              ? 'text-teal-700 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-300 dark:border dark:border-teal-800/40'
                              : trip.status === 'planned'
                              ? 'text-teal-700 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-300 dark:border dark:border-teal-800/40'
                              : 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800/40'
                          }`}
                        >
                          {trip.status === 'completed'
                            ? 'Completed'
                            : trip.status === 'planned'
                            ? 'Planned'
                            : 'Ongoing'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(trip)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title="Edit trip"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(trip.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors"
                            title="Delete trip"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500 dark:text-slate-300">
                    No overseas trips matched the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70  overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl  border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden my-8 transition-colors">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/70">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingTrip ? 'Edit Overseas Trip' : 'Log Overseas Trip'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Departure Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.departureDate}
                    onChange={e => setFormData({ ...formData, departureDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Date you left UK</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Return Date
                  </label>
                  <input
                    type="date"
                    value={formData.returnDate}
                    onChange={e => setFormData({ ...formData, returnDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Date you landed in UK</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination Country / City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hong Kong, Japan, France"
                  value={formData.destination}
                  onChange={e => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trip Purpose
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Family, Holiday, Business"
                    value={formData.purpose}
                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trip Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as TripStatus })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="completed">Completed</option>
                    <option value="planned">Planned</option>
                    <option value="ongoing">Ongoing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Flight numbers, reason for travel, etc."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Counting preview */}
              {formData.departureDate && formData.returnDate && formData.departureDate <= formData.returnDate && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>Counted Absence Days:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {Math.max(0, (new Date(formData.returnDate).getTime() - new Date(formData.departureDate).getTime()) / 86400000 - 1)} days
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
                >
                  {editingTrip ? 'Save Changes' : 'Log Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 ">
          <div className="bg-white dark:bg-slate-800 rounded-xl  border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full space-y-4 transition-colors">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2 bg-red-100 dark:bg-red-950/60 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Delete Overseas Trip?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove this trip from your immigration record? This will immediately recalculate your continuous residence metrics.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmId) {
                    onDeleteTrip(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
