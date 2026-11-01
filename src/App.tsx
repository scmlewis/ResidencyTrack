import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  User,
  SlidersHorizontal,
  FileText,
  Sun,
  Moon
} from 'lucide-react';
import { ImmigrationProfile, TravelRecord } from './types';
import {
  getStoredProfile,
  saveStoredProfile,
  getStoredTravelRecords,
  saveStoredTravelRecords
} from './data/storage';
import {
  calculateILRContinuousResidence,
  calculateNaturalisationRequirements,
  calculateMilestones
} from './engine/calculations';
import { Navigation, NavTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { TravelLogView } from './components/TravelLogView';
import { AbsenceAnalyticsView } from './components/AbsenceAnalyticsView';
import { InteractiveCalendarView } from './components/InteractiveCalendarView';
import { ImmigrationTimelineView } from './components/ImmigrationTimelineView';
import { TravelSimulatorView } from './components/TravelSimulatorView';
import { SettingsAndDataView } from './components/SettingsAndDataView';
import { ImmigrationProfileModal } from './components/ImmigrationProfileModal';
import { AboutView } from './components/AboutView';
import { TutorialView } from './components/TutorialView';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [profile, setProfile] = useState<ImmigrationProfile>(getStoredProfile);
  const [records, setRecords] = useState<TravelRecord[]>(getStoredTravelRecords);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddTripModalOpen, setIsAddTripModalOpen] = useState(false);

  // Default to Dark Mode as requested
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('residencytrack_theme');
      return saved ? saved === 'dark' : true; // Default dark
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('residencytrack_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('residencytrack_theme', 'light');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // Synchronize state with calculations
  const ilrResult = useMemo(() => {
    return calculateILRContinuousResidence(records, profile);
  }, [records, profile]);

  const natResult = useMemo(() => {
    return calculateNaturalisationRequirements(records, profile);
  }, [records, profile]);

  const milestones = useMemo(() => {
    return calculateMilestones(profile);
  }, [profile]);

  // Handlers for profile
  const handleSaveProfile = (updated: ImmigrationProfile) => {
    setProfile(updated);
    saveStoredProfile(updated);
  };

  // Handlers for travel records
  const handleAddTrip = (tripData: Omit<TravelRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTrip: TravelRecord = {
      ...tripData,
      id: 'trip_' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [newTrip, ...records];
    setRecords(updated);
    saveStoredTravelRecords(updated);
  };

  const handleUpdateTrip = (updatedTrip: TravelRecord) => {
    const updated = records.map(r => (r.id === updatedTrip.id ? updatedTrip : r));
    setRecords(updated);
    saveStoredTravelRecords(updated);
  };

  const handleDeleteTrip = (tripId: string) => {
    const updated = records.filter(r => r.id !== tripId);
    setRecords(updated);
    saveStoredTravelRecords(updated);
  };

  const handleDataLoaded = (newProfile: ImmigrationProfile, newRecords: TravelRecord[]) => {
    setProfile(newProfile);
    setRecords(newRecords);
  };

  const pageTitles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Compliance Dashboard',
      subtitle: 'Overview of rolling 180-day ILR limits and British naturalisation progression'
    },
    travel_log: {
      title: 'Travel Absence Log',
      subtitle: 'Comprehensive record of all UK overseas departures and returns'
    },
    analytics: {
      title: 'Absence Analytics Engine',
      subtitle: 'Detailed mathematical breakdown of continuous residence and final-year limits'
    },
    calendar: {
      title: 'Interactive Residence Calendar',
      subtitle: 'Monthly visual mapping of UK presence, overseas travel, and milestones'
    },
    timeline: {
      title: 'Immigration Journey Timeline',
      subtitle: 'Five-year continuous residence milestones and earliest settlement eligibility'
    },
    simulator: {
      title: 'Travel Impact Simulator',
      subtitle: 'Test proposed flight bookings and evaluate absence impact in real time'
    },
    settings: {
      title: 'Settings, Data & Policy Rules',
      subtitle: 'JSON backups, CSV exports, official statutory references, and test suite'
    },
    tutorial: {
      title: 'Tutorial & Onboarding',
      subtitle: 'Step-by-step guide to get started with ResidencyTrack'
    },
    about: {
      title: 'About & Credits',
      subtitle: 'Creator information and source code links'
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B132B] flex flex-col lg:flex-row text-slate-800 dark:text-slate-100 transition-colors overflow-x-hidden max-w-full">
      {/* Sidebar Navigation */}
      <Navigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        profile={profile}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white/90 dark:bg-[#111C38]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/60 shrink-0 z-30 shadow-lg rounded-xl fixed top-4 left-[18rem] right-4 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              {currentTab.replace('_', ' ')}
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {pageTitles[currentTab].title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
              title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-[11px]">Dark</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setCurrentTab('travel_log');
                setIsAddTripModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Overseas Trip</span>
            </button>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Immigration Profile</span>
            </button>
          </div>
        </header>

        {/* View Content Viewport */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 pt-16 sm:pt-6 lg:pt-20 lg:ml-[18rem] lg:mr-4 pb-24 sm:pb-6 lg:pb-8 max-w-7xl w-full mx-auto min-w-0 overflow-x-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              profile={profile}
              records={records}
              ilrResult={ilrResult}
              natResult={natResult}
              milestones={milestones}
              onNavigate={setCurrentTab}
              onOpenAddTrip={() => {
                setCurrentTab('travel_log');
                setIsAddTripModalOpen(true);
              }}
              onOpenProfile={() => setIsProfileModalOpen(true)}
            />
          )}

          {currentTab === 'travel_log' && (
            <TravelLogView
              records={records}
              profile={profile}
              onAddTrip={handleAddTrip}
              onUpdateTrip={handleUpdateTrip}
              onDeleteTrip={handleDeleteTrip}
              isAddModalOpenInitially={isAddTripModalOpen}
              onCloseAddModalInitially={() => setIsAddTripModalOpen(false)}
            />
          )}

          {currentTab === 'analytics' && (
            <AbsenceAnalyticsView
              profile={profile}
              records={records}
              ilrResult={ilrResult}
              natResult={natResult}
            />
          )}

          {currentTab === 'calendar' && (
            <InteractiveCalendarView
              records={records}
              profile={profile}
              milestones={milestones}
            />
          )}

          {currentTab === 'timeline' && (
            <ImmigrationTimelineView
              profile={profile}
              milestones={milestones}
              onOpenProfile={() => setIsProfileModalOpen(true)}
            />
          )}

          {currentTab === 'simulator' && (
            <TravelSimulatorView
              records={records}
              profile={profile}
              onSaveSimulatedTrip={handleAddTrip}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsAndDataView
              profile={profile}
              records={records}
              onDataLoaded={handleDataLoaded}
            />
          )}
          {currentTab === 'tutorial' && <TutorialView />}
          {currentTab === 'about' && <AboutView />}
        </main>
      </div>

      {/* Global Immigration Profile Modal */}
      <ImmigrationProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
    </div>
  );
};

export default App;
