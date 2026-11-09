import React from 'react';
import { useTransit } from '../context/TransitContext';
import { useAuth } from '../context/AuthContext';
import { UserProfileMenu } from './auth/UserProfileMenu';
import { Sun, Moon } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
  } = useTransit();

  const { role } = useAuth();

  return (
    <header className="flex items-center justify-between gap-6 px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors z-30">
      {/* Brand Wordmark (Urban Blue) */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm">
          DC
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
          Daily Commute
        </span>
      </div>

      {/* Role-Based Navigation */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
        {role === 'driver' ? (
          <>
            <button
              onClick={() => setActiveTab('driver_cockpit')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'driver_cockpit'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Driver Cockpit
            </button>
            <button
              onClick={() => setActiveTab('tracker')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'tracker'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Route Map
            </button>
            <button
              onClick={() => setActiveTab('stops')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'stops'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Stations
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('tracker')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'tracker'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Live Tracker
            </button>
            <button
              onClick={() => setActiveTab('stops')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'stops'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Stations & Stops
            </button>
          </>
        )}
      </nav>

      {/* Utilities: Theme Toggle & User Auth */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={toggleTheme}
          title="Toggle Light/Dark Theme"
          className="flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        <UserProfileMenu onOpenAuth={onOpenAuth} />
      </div>
    </header>
  );
};
