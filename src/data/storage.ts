import { ImmigrationProfile, TravelRecord } from '../types';

export const STORAGE_KEYS = {
  PROFILE: 'residencytrack_profile_v1',
  RECORDS: 'residencytrack_records_v1',
  IS_DEMO: 'residencytrack_is_demo_v1'
};

export const DEFAULT_DEMO_PROFILE: ImmigrationProfile = {
  id: 'demo-profile-bno-01',
  visaRoute: 'BNO',
  visaGrantDate: '2021-07-20',
  firstUKArrivalDate: '2021-08-15',
  qualifyingPeriodStartDate: '2021-08-15',
  qualifyingPeriodStartConfirmed: true,
  travelHistoryCompleteness: 'NOT_CONFIRMED',
  actualILRGrantDate: null,
  naturalisationRoute: 'standard_5_year',
  createdAt: '2021-08-15T10:00:00.000Z',
  updatedAt: '2026-11-01T08:00:00.000Z'
};

export const DEFAULT_DEMO_RECORDS: TravelRecord[] = [
  {
    id: 'demo-trip-01',
    departureDate: '2021-12-20',
    returnDate: '2022-01-05',
    destination: 'Hong Kong',
    purpose: 'Family Christmas Reunion',
    status: 'completed',
    notes: 'First trip back home after arriving in the UK in August 2021.',
    createdAt: '2022-01-06T12:00:00.000Z',
    updatedAt: '2022-01-06T12:00:00.000Z'
  },
  {
    id: 'demo-trip-02',
    departureDate: '2022-04-12',
    returnDate: '2022-04-19',
    destination: 'France',
    purpose: 'Easter Holiday (Paris)',
    status: 'completed',
    notes: 'Short Eurostar trip over Easter bank holiday.',
    createdAt: '2022-04-20T09:00:00.000Z',
    updatedAt: '2022-04-20T09:00:00.000Z'
  },
  {
    id: 'demo-trip-03',
    departureDate: '2022-08-05',
    returnDate: '2022-08-22',
    destination: 'Hong Kong',
    purpose: 'Summer Family Visit',
    status: 'completed',
    notes: 'Annual summer trip to visit parents and handle property handover.',
    createdAt: '2022-08-23T11:00:00.000Z',
    updatedAt: '2022-08-23T11:00:00.000Z'
  },
  {
    id: 'demo-trip-04',
    departureDate: '2023-02-10',
    returnDate: '2023-02-18',
    destination: 'Japan',
    purpose: 'Ski Trip in Hokkaido',
    status: 'completed',
    notes: 'Winter sports holiday with UK friends.',
    createdAt: '2023-02-19T14:00:00.000Z',
    updatedAt: '2023-02-19T14:00:00.000Z'
  },
  {
    id: 'demo-trip-05',
    departureDate: '2023-06-25',
    returnDate: '2023-07-02',
    destination: 'Spain',
    purpose: 'Tech Conference & Break',
    status: 'completed',
    notes: 'Work-sponsored conference in Barcelona followed by weekend in Sitges.',
    createdAt: '2023-07-03T16:00:00.000Z',
    updatedAt: '2023-07-03T16:00:00.000Z'
  },
  {
    id: 'demo-trip-06',
    departureDate: '2023-12-18',
    returnDate: '2024-01-08',
    destination: 'Hong Kong',
    purpose: 'Winter Holidays & Family',
    status: 'completed',
    notes: '3-week visit across Christmas and New Year.',
    createdAt: '2024-01-09T10:00:00.000Z',
    updatedAt: '2024-01-09T10:00:00.000Z'
  },
  {
    id: 'demo-trip-07',
    departureDate: '2024-05-24',
    returnDate: '2024-06-02',
    destination: 'Italy',
    purpose: 'Amalfi Coast Vacation',
    status: 'completed',
    notes: 'Late spring break in Naples and Sorrento.',
    createdAt: '2024-06-03T08:30:00.000Z',
    updatedAt: '2024-06-03T08:30:00.000Z'
  },
  {
    id: 'demo-trip-08',
    departureDate: '2024-10-10',
    returnDate: '2024-10-24',
    destination: 'Canada',
    purpose: 'Client Meetings & Toronto Visit',
    status: 'completed',
    notes: 'Company business meetings in Toronto and visiting relatives in Markham.',
    createdAt: '2024-10-25T13:00:00.000Z',
    updatedAt: '2024-10-25T13:00:00.000Z'
  },
  {
    id: 'demo-trip-09',
    departureDate: '2025-01-18',
    returnDate: '2025-02-05',
    destination: 'Hong Kong',
    purpose: 'Lunar New Year',
    status: 'completed',
    notes: 'Family celebrations for Lunar New Year.',
    createdAt: '2025-02-06T15:00:00.000Z',
    updatedAt: '2025-02-06T15:00:00.000Z'
  },
  {
    id: 'demo-trip-10',
    departureDate: '2025-07-12',
    returnDate: '2025-07-27',
    destination: 'Greece',
    purpose: 'Summer Holiday (Crete)',
    status: 'completed',
    notes: 'Island holiday with family.',
    createdAt: '2025-07-28T09:00:00.000Z',
    updatedAt: '2025-07-28T09:00:00.000Z'
  },
  {
    id: 'demo-trip-11',
    departureDate: '2026-03-28',
    returnDate: '2026-04-06',
    destination: 'Germany',
    purpose: 'Spring Break in Berlin',
    status: 'completed',
    notes: 'Visiting friends and museum tour.',
    createdAt: '2026-04-07T14:00:00.000Z',
    updatedAt: '2026-04-07T14:00:00.000Z'
  },
  {
    id: 'demo-trip-12',
    departureDate: '2026-08-01',
    returnDate: '2026-08-14',
    destination: 'Hong Kong',
    purpose: 'Final Pre-Settlement Trip',
    status: 'planned',
    notes: 'Planned visit before submitting ILR application.',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z'
  }
];

export function migrateLegacyStorageKeys(): void {
  try {
    const legacyProfile = localStorage.getItem('residencytrack_profile');
    if (legacyProfile && !localStorage.getItem(STORAGE_KEYS.PROFILE)) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, legacyProfile);
      localStorage.removeItem('residencytrack_profile');
    }
    const legacyRecords = localStorage.getItem('residencytrack_records');
    if (legacyRecords && !localStorage.getItem(STORAGE_KEYS.RECORDS)) {
      localStorage.setItem(STORAGE_KEYS.RECORDS, legacyRecords);
      localStorage.removeItem('residencytrack_records');
    }
  } catch (err) {
    console.error('Failed to migrate legacy storage keys', err);
  }
}

export function getStoredProfile(): ImmigrationProfile {
  migrateLegacyStorageKeys();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.travelHistoryCompleteness !== 'CONFIRMED_COMPLETE') {
        parsed.travelHistoryCompleteness = 'NOT_CONFIRMED';
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load profile from localStorage', err);
  }
  const blankProfile: ImmigrationProfile = {
    id: 'profile_' + Date.now(),
    visaRoute: 'BNO',
    visaGrantDate: null,
    firstUKArrivalDate: null,
    qualifyingPeriodStartDate: null,
    qualifyingPeriodStartConfirmed: false,
    travelHistoryCompleteness: 'NOT_CONFIRMED',
    actualILRGrantDate: null,
    naturalisationRoute: 'standard_5_year',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveStoredProfile(blankProfile);
  return blankProfile;
}

export function saveStoredProfile(profile: ImmigrationProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile to localStorage', err);
  }
}

export function getStoredTravelRecords(): TravelRecord[] {
  migrateLegacyStorageKeys();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load travel records from localStorage', err);
  }
  saveStoredTravelRecords([]);
  return [];
}

export function saveStoredTravelRecords(records: TravelRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save travel records to localStorage', err);
  }
}

export function resetToDemoData(): { profile: ImmigrationProfile; records: TravelRecord[] } {
  saveStoredProfile(DEFAULT_DEMO_PROFILE);
  saveStoredTravelRecords(DEFAULT_DEMO_RECORDS);
  localStorage.setItem(STORAGE_KEYS.IS_DEMO, 'true');
  return { profile: DEFAULT_DEMO_PROFILE, records: DEFAULT_DEMO_RECORDS };
}

export function clearAllData(): { profile: ImmigrationProfile; records: TravelRecord[] } {
  const blankProfile: ImmigrationProfile = {
    id: 'profile_' + Date.now(),
    visaRoute: 'BNO',
    visaGrantDate: null,
    firstUKArrivalDate: null,
    qualifyingPeriodStartDate: null,
    qualifyingPeriodStartConfirmed: false,
    travelHistoryCompleteness: 'NOT_CONFIRMED',
    actualILRGrantDate: null,
    naturalisationRoute: 'standard_5_year',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveStoredProfile(blankProfile);
  saveStoredTravelRecords([]);
  localStorage.removeItem(STORAGE_KEYS.IS_DEMO);
  return { profile: blankProfile, records: [] };
}

export function exportDataAsJSON(profile: ImmigrationProfile, records: TravelRecord[]): string {
  const exportPayload = {
    appName: 'ResidencyTrack',
    version: '0.1',
    exportedAt: new Date().toISOString(),
    profile,
    travelRecords: records
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function importDataFromJSON(jsonString: string): {
  success: boolean;
  profile?: ImmigrationProfile;
  records?: TravelRecord[];
  error?: string;
} {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Uploaded file is not a valid JSON object.' };
    }
    if (!data.profile || !Array.isArray(data.travelRecords)) {
      return { success: false, error: 'Invalid file format. Missing "profile" or "travelRecords" array.' };
    }

    const importedProfile: ImmigrationProfile = {
      id: data.profile.id || 'imported_profile_' + Date.now(),
      visaRoute: 'BNO',
      visaGrantDate: data.profile.visaGrantDate || null,
      firstUKArrivalDate: data.profile.firstUKArrivalDate || null,
      qualifyingPeriodStartDate: data.profile.qualifyingPeriodStartDate || null,
      qualifyingPeriodStartConfirmed: Boolean(data.profile.qualifyingPeriodStartConfirmed),
      travelHistoryCompleteness: data.profile.travelHistoryCompleteness === 'CONFIRMED_COMPLETE' ? 'CONFIRMED_COMPLETE' : 'NOT_CONFIRMED',
      actualILRGrantDate: data.profile.actualILRGrantDate || null,
      naturalisationRoute: 'standard_5_year',
      createdAt: data.profile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const importedRecords: TravelRecord[] = data.travelRecords.map((r: any, idx: number) => ({
      id: r.id || `imported_trip_${idx}_${Date.now()}`,
      departureDate: r.departureDate || '',
      returnDate: r.returnDate || null,
      destination: r.destination || 'Unspecified',
      purpose: r.purpose || 'Travel',
      status: r.status === 'planned' || r.status === 'ongoing' ? r.status : 'completed',
      notes: r.notes || '',
      createdAt: r.createdAt || new Date().toISOString(),
      updatedAt: r.updatedAt || new Date().toISOString()
    }));

    saveStoredProfile(importedProfile);
    saveStoredTravelRecords(importedRecords);

    return {
      success: true,
      profile: importedProfile,
      records: importedRecords
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to parse JSON file.' };
  }
}

export function exportTravelRecordsAsCSV(records: TravelRecord[]): string {
  const headers = ['ID', 'Departure Date', 'Return Date', 'Destination', 'Purpose', 'Status', 'Notes'];
  const rows = records.map(r => [
    `"${r.id}"`,
    `"${r.departureDate || ''}"`,
    `"${r.returnDate || ''}"`,
    `"${(r.destination || '').replace(/"/g, '""')}"`,
    `"${(r.purpose || '').replace(/"/g, '""')}"`,
    `"${r.status}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}
