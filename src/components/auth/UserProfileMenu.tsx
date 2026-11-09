import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import {
  User,
  Bus,
  LogOut,
  ChevronDown,
  Check,
  Sparkles,
} from 'lucide-react';

interface UserProfileMenuProps {
  onOpenAuth: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ onOpenAuth }) => {
  const { user, isAuthenticated, role, switchRole, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={onOpenAuth}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
      >
        <User className="w-3.5 h-3.5" />
        <span>Sign In</span>
      </button>
    );
  }

  const roleColors: Record<UserRole, { bg: string; text: string; label: string }> = {
    commuter: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-700 dark:text-blue-300', label: 'Commuter' },
    driver: { bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-700 dark:text-emerald-300', label: 'Driver' },
  };

  const currentRoleConfig = roleColors[role];

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
      >
        <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
          {user.name.charAt(0)}
        </div>

        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
            {user.name}
          </span>
          <span className={`text-[10px] font-medium leading-none ${currentRoleConfig.text}`}>
            {currentRoleConfig.label}
          </span>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Info Header */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="font-bold text-xs text-slate-900 dark:text-white">
              {user.name}
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              {user.email}
            </div>
            {user.assignedVehicleId && (
              <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                Assigned Unit: {user.assignedVehicleId}
              </div>
            )}
            {user.homeStation && (
              <div className="mt-1 text-[11px] text-slate-400">
                Home: {user.homeStation}
              </div>
            )}
          </div>

          {/* Quick Role Switcher */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Switch Active Role</span>
            </div>

            <div className="space-y-1">
              {(['commuter', 'driver'] as UserRole[]).map((r) => {
                const isCurrent = role === r;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors capitalize ${
                      isCurrent
                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {r === 'commuter' && <User className="w-3.5 h-3.5" />}
                      {r === 'driver' && <Bus className="w-3.5 h-3.5" />}
                      <span>{r === 'commuter' ? 'Commuter (Passenger)' : 'Bus Driver'} View</span>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-1 px-1">
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
                onOpenAuth();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out / Switch User</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
