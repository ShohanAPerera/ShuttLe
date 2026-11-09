import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole, AuthState } from '../types/auth';

export const DEMO_USERS: Record<UserRole, UserProfile> = {
  commuter: {
    id: 'usr-commuter-01',
    name: 'Alex Morgan',
    email: 'alex.morgan@commute.net',
    role: 'commuter',
    memberSince: 'March 2024',
    homeStation: 'Downtown Metro Station',
    notificationsEnabled: true,
  },
  driver: {
    id: 'usr-driver-01',
    name: 'Marcus Vance',
    email: 'm.vance@transit.city',
    role: 'driver',
    memberSince: 'Jan 2022',
    assignedVehicleId: 'BUS-101A',
    driverRating: 4.96,
    notificationsEnabled: true,
  },
};

interface AuthContextType extends AuthState {
  role: UserRole;
  login: (email: string, password: string, role?: UserRole) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  loginAsDemoRole: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('daily_commute_user');
      if (saved) return JSON.parse(saved);
      return DEMO_USERS.commuter;
    } catch {
      return DEMO_USERS.commuter;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('daily_commute_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('daily_commute_user');
      }
    } catch {
      // storage unavailable
    }
  }, [user]);

  const login = useCallback(async (email: string, _password: string, preferredRole: UserRole = 'commuter') => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((res) => setTimeout(res, 200));
      const matched = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        setUser(matched);
      } else {
        const newUser: UserProfile = {
          id: `usr-${Date.now()}`,
          name: email.split('@')[0],
          email,
          role: preferredRole,
          memberSince: 'Today',
          assignedVehicleId: preferredRole === 'driver' ? 'BUS-101A' : undefined,
          notificationsEnabled: true,
        };
        setUser(newUser);
      }
      setIsLoading(false);
      return true;
    } catch {
      setError('Failed to authenticate');
      setIsLoading(false);
      return false;
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, _password: string, role: UserRole) => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((res) => setTimeout(res, 200));
      const newUser: UserProfile = {
        id: `usr-${Date.now()}`,
        name,
        email,
        role,
        memberSince: 'Just now',
        assignedVehicleId: role === 'driver' ? 'BUS-101A' : undefined,
        driverRating: role === 'driver' ? 5.0 : undefined,
        notificationsEnabled: true,
      };
      setUser(newUser);
      setIsLoading(false);
      return true;
    } catch {
      setError('Registration failed');
      setIsLoading(false);
      return false;
    }
  }, []);

  const loginAsDemoRole = useCallback((role: UserRole) => {
    setUser(DEMO_USERS[role]);
    setError(null);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const switchRole = useCallback((newRole: UserRole) => {
    setUser((prev) => {
      if (!prev) return DEMO_USERS[newRole];
      return {
        ...prev,
        role: newRole,
        assignedVehicleId: newRole === 'driver' ? 'BUS-101A' : undefined,
      };
    });
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        role: user?.role || 'commuter',
        login,
        signup,
        loginAsDemoRole,
        logout,
        switchRole,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
