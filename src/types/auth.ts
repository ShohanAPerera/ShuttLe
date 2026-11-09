export type UserRole = 'commuter' | 'driver';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  memberSince: string;
  assignedVehicleId?: string; // for drivers
  driverRating?: number; // for drivers
  homeStation?: string; // for commuters
  notificationsEnabled: boolean;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
