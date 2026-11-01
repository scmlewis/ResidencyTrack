import React from 'react';
import {
  LayoutDashboard,
  PlaneTakeoff,
  LineChart,
  CalendarDays,
  Milestone,
  SlidersHorizontal,
  Settings,
  ShieldCheck,
  UserCheck,
  Menu,
  X,
  Sun,
  Moon,
  BookOpen,
  Info
} from 'lucide-react';
import { ImmigrationProfile } from '../types';

export type NavTab = 
  | 'dashboard'
  | 'travel_log'
  | 'analytics'
  | 'calendar'
  | 'timeline'
  | 'simulator'
  | 'settings'
  | 'tutorial'
  | 'about';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  profile: ImmigrationProfile;
  onOpenProfile: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  profile,
  onOpenProfile,
  isDarkMode,
  onToggleTheme
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'travel_log', label: 'Travel Log', icon: PlaneTakeoff },
    { id: 'analytics', label: 'Absence Analytics', icon: LineChart },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'timeline', label: 'Immigration Timeline', icon: Milestone },
    { id: 'simulator', label: 'Travel Simulator', icon: SlidersHorizontal },
    { id: 'settings', label: 'Settings & Policy Rules', icon: Settings },
  { id: 'tutorial', label: 'Tutorial & Onboarding', icon: BookOpen },
  { id: 'about', label: 'About & Credits', icon: Info },
  ];

  const handleSelectTab = (tab: NavTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-2.5 bg-slate-900/90 backdrop-blur-md text-white border-b border-slate-700/60 shadow-2xl transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold text-xs tracking-wider">
            RT
          </div>
          <div>
            <span className="font-bold tracking-tight text-sm text-slate-100">ResidencyTrack</span>
            <span className="text-[10px] text-teal-400/80 block leading-none">BN(O) 5-Year Route</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
              title={isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>
          )}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-300 bg-teal-950/60 border border-teal-800/60 rounded-lg hover:bg-teal-900/40 transition-colors"
          >
            <span>Profile</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
            aria-label="Toggle All Pages Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu (Full List of Views) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[49px] bg-slate-950/70 backdrop-blur-sm z-50 flex flex-col">
          <div className="bg-slate-900 p-4 border-b border-slate-800 shadow-2xl space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 pb-1">
              All Sections
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Mobile Bottom Thumb Navigation Bar */}
      <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-slate-700/60 shadow-2xl py-1 px-2 flex justify-around items-center">
        {[
          { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
          { id: 'travel_log' as NavTab, label: 'Trips', icon: PlaneTakeoff },
          { id: 'analytics' as NavTab, label: 'Analytics', icon: LineChart },
          { id: 'timeline' as NavTab, label: 'Timeline', icon: Milestone },
        ].map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-lg transition-all min-w-[56px] ${
                isActive
                  ? 'text-teal-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 transition-transform ${isActive ? 'scale-110 text-teal-400' : ''}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-lg transition-all min-w-[56px] ${
            mobileMenuOpen ? 'text-teal-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </nav>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/95 text-white border-r border-slate-700/60 shrink-0 select-none backdrop-blur-md fixed top-0 left-0 bottom-0 z-40 overflow-hidden shadow-2xl">
        {/* Brand Zone */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-[#173B57] font-extrabold text-base shadow-sm">
              RT
            </div>
            <div>
              <div className="font-bold tracking-tight text-white text-lg leading-tight">
                ResidencyTrack
              </div>
              <div className="text-[11px] font-medium text-teal-300/90 tracking-wide uppercase">
                UK BN(O) Compliance
              </div>
            </div>
          </div>
        </div>

        {/* Profile Card Summary */}
        <div className="p-4 mx-3 my-3 bg-slate-800/60 border border-slate-700/70 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Route: BN(O) 5-Year
            </span>
            <button
              onClick={onOpenProfile}
              className="text-[11px] font-medium text-slate-300 hover:text-teal-200 transition-colors"
            >
              Edit
            </button>
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Arrival:</span>
              <span className="font-mono tabular-nums text-slate-200">{profile.firstUKArrivalDate || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Qualifying:</span>
              <span className="font-mono tabular-nums text-slate-200">{profile.qualifyingPeriodStartDate || 'Not set'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile & Verification Disclaimer */}
        <div className="p-4 border-t border-slate-700/70 bg-slate-900/40 text-xs text-slate-400 space-y-3">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 border border-slate-700/60 transition-colors text-xs font-medium"
            >
              <span className="flex items-center gap-2">
                {isDarkMode ? <Moon className="w-3.5 h-3.5 text-teal-300" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                <span>Theme: {isDarkMode ? 'Dark (Default)' : 'Light'}</span>
              </span>
              <span className="text-[10px] text-teal-300 underline font-normal">Switch</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2 mb-1 text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-medium text-[11px]">Local Browser Storage</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Data is saved locally in this browser. Not professional legal advice.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
