import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  TransitRoute,
  TransitVehicle,
  TransitStop,
  VehicleStatus,
  FavoriteItem,
} from '../types/transit';
import {
  INITIAL_ROUTES,
  INITIAL_VEHICLES,
  getDistanceKm,
  calculateBearing,
} from '../data/mockTransitData';

interface TransitContextType {
  routes: TransitRoute[];
  vehicles: TransitVehicle[];
  selectedRouteId: string | null;
  selectedVehicleId: string | null;
  selectedStopId: string | null;
  userLocation: { lat: number; lng: number } | null;
  favorites: FavoriteItem[];
  theme: 'light' | 'dark';
  activeTab: 'tracker' | 'stops' | 'driver_cockpit';
  
  // Real-Time Driver Trip & Passenger Live Tracking
  trackedVehicleId: string | null;
  trackVehicle: (id: string | null) => void;
  startDriverTrip: (vehicleId: string) => void;
  endDriverTrip: (vehicleId: string) => void;
  liveTripToast: { vehicleLabel: string; routeName: string; message: string } | null;
  dismissTripToast: () => void;

  // Selection & Navigation
  selectRoute: (id: string | null) => void;
  selectVehicle: (id: string | null) => void;
  selectStop: (id: string | null) => void;
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (id: string) => boolean;
  setActiveTab: (tab: 'tracker' | 'stops' | 'driver_cockpit') => void;
  toggleTheme: () => void;
  
  // Getters
  getSelectedRoute: () => TransitRoute | undefined;
  getSelectedVehicle: () => TransitVehicle | undefined;
  getSelectedStop: () => TransitStop | undefined;
}

const TransitContext = createContext<TransitContextType | undefined>(undefined);

export const TransitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [routes] = useState<TransitRoute[]>(INITIAL_ROUTES);
  const [vehicles, setVehicles] = useState<TransitVehicle[]>(INITIAL_VEHICLES);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tracker' | 'stops' | 'driver_cockpit'>('tracker');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Passenger Real-time tracking & notifications
  const [trackedVehicleId, setTrackedVehicleId] = useState<string | null>(null);
  const [liveTripToast, setLiveTripToast] = useState<{ vehicleLabel: string; routeName: string; message: string } | null>(null);

  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const saved = localStorage.getItem('daily_commute_favs');
      return saved ? JSON.parse(saved) : [
        { id: 'route-101', type: 'route', name: 'Rapid Transit Line 101', code: '101', routeColor: '#2563EB' },
        { id: 'stop-101-3', type: 'stop', name: 'Downtown Metro Station', code: 'DMS-3' },
      ];
    } catch {
      return [];
    }
  });

  // User simulated GPS (e.g. Near Downtown Station by default)
  const [userLocation] = useState<{ lat: number; lng: number } | null>({
    lat: 37.7872,
    lng: -122.4045,
  });

  // Sync theme with HTML document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Save favorites
  useEffect(() => {
    try {
      localStorage.setItem('daily_commute_favs', JSON.stringify(favorites));
    } catch {
      // Storage unavailable
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback((item: FavoriteItem) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === item.id);
      if (exists) {
        return prev.filter((f) => f.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  }, []);

  const selectRoute = useCallback((id: string | null) => {
    setSelectedRouteId(id);
    if (id) {
      setSelectedVehicleId((prev) => {
        const v = vehicles.find((item) => item.id === prev);
        return v && v.routeId === id ? prev : null;
      });
    }
  }, [vehicles]);

  const selectVehicle = useCallback((id: string | null) => {
    setSelectedVehicleId(id);
    if (id) {
      const v = vehicles.find((item) => item.id === id);
      if (v) {
        setSelectedRouteId(v.routeId);
      }
    }
  }, [vehicles]);

  const selectStop = useCallback((id: string | null) => {
    setSelectedStopId(id);
  }, []);

  const trackVehicle = useCallback((id: string | null) => {
    setTrackedVehicleId(id);
    if (id) {
      setSelectedVehicleId(id);
      const v = vehicles.find((item) => item.id === id);
      if (v) {
        setSelectedRouteId(v.routeId);
      }
    }
  }, [vehicles]);

  const dismissTripToast = useCallback(() => {
    setLiveTripToast(null);
  }, []);

  const startDriverTrip = useCallback((vehicleId: string) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          return {
            ...v,
            isTripStarted: true,
            tripStartedAt: Date.now(),
            tripCode: v.tripCode || `TRIP-${v.vehicleNumber}`,
            status: 'in_transit',
            speedKmH: 34,
          };
        }
        return v;
      })
    );

    const targetVehicle = vehicles.find((v) => v.id === vehicleId);
    const targetRoute = routes.find((r) => r.id === targetVehicle?.routeId);

    if (targetVehicle) {
      setLiveTripToast({
        vehicleLabel: targetVehicle.label,
        routeName: targetRoute?.name || 'Transit Route',
        message: `Driver ${targetVehicle.driverName} has started Trip #${targetVehicle.tripCode || targetVehicle.vehicleNumber}. Real-time GPS broadcasting is now live!`,
      });
      setTrackedVehicleId(vehicleId);
      setSelectedVehicleId(vehicleId);
    }
  }, [vehicles, routes]);

  const endDriverTrip = useCallback((vehicleId: string) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          return {
            ...v,
            isTripStarted: false,
            status: 'depot',
            speedKmH: 0,
          };
        }
        return v;
      })
    );
  }, []);

  // Track vehicles state with ref for tick calculation
  const routesRef = useRef(routes);
  routesRef.current = routes;

  // Real-time GPS movement simulation tick
  useEffect(() => {
    const timer = setInterval(() => {
      setVehicles((prevVehicles) => {
        return prevVehicles.map((vehicle) => {
          // If vehicle has not started trip or is in depot, stay stationary
          if (!vehicle.isTripStarted || vehicle.status === 'depot') {
            return vehicle;
          }

          const route = routesRef.current.find((r) => r.id === vehicle.routeId);
          if (!route || route.waypoints.length < 2) return vehicle;

          // If at stop, countdown dwell time
          if (vehicle.status === 'at_stop') {
            if (vehicle.nextStopEtaSeconds <= 0) {
              return {
                ...vehicle,
                status: 'in_transit',
                speedKmH: Math.floor(28 + Math.random() * 12),
                nextStopEtaSeconds: Math.floor(100 + Math.random() * 60),
              };
            }
            return {
              ...vehicle,
              nextStopEtaSeconds: Math.max(0, vehicle.nextStopEtaSeconds - 1),
            };
          }

          // Advance along route waypoints
          const waypoints = route.waypoints;
          const currentIndex = vehicle.waypointIndex;
          const nextIndex = (currentIndex + 1) % waypoints.length;

          const p1 = waypoints[currentIndex];
          const p2 = waypoints[nextIndex];

          const bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
          const stepRatio = 0.08 * (vehicle.speedKmH / 35);

          const latDiff = p2[0] - vehicle.currentLat;
          const lngDiff = p2[1] - vehicle.currentLng;
          const distToNextWaypoint = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

          let newLat = vehicle.currentLat;
          let newLng = vehicle.currentLng;
          let newWaypointIndex = currentIndex;
          let newStatus: VehicleStatus = vehicle.status;
          let newSpeed = vehicle.speedKmH;
          let newEta = Math.max(10, vehicle.nextStopEtaSeconds - 1);
          let newNextStopId = vehicle.nextStopId;

          if (distToNextWaypoint < 0.0006) {
            newWaypointIndex = nextIndex;
            newLat = p2[0];
            newLng = p2[1];

            const nearbyStop = route.stops.find((s) => {
              return getDistanceKm(s.lat, s.lng, newLat, newLng) < 0.08;
            });

            if (nearbyStop) {
              newStatus = 'at_stop';
              newSpeed = 0;
              newEta = 6; // 6s station dwell

              const stopIndex = route.stops.findIndex((s) => s.id === nearbyStop.id);
              const followingStop = route.stops[(stopIndex + 1) % route.stops.length];
              newNextStopId = followingStop.id;
            } else {
              newSpeed = Math.floor(30 + Math.random() * 14);
            }
          } else {
            newLat = vehicle.currentLat + latDiff * Math.min(1, stepRatio);
            newLng = vehicle.currentLng + lngDiff * Math.min(1, stepRatio);
          }

          const totalWaypoints = waypoints.length;
          const progressPercent = Math.round(((newWaypointIndex + 0.5) / totalWaypoints) * 100);

          return {
            ...vehicle,
            currentLat: newLat,
            currentLng: newLng,
            bearing: Math.round(bearing),
            speedKmH: newSpeed,
            status: newStatus,
            waypointIndex: newWaypointIndex,
            nextStopId: newNextStopId,
            nextStopEtaSeconds: newEta,
            progressPercent,
            lastPing: Date.now(),
          };
        });
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getSelectedRoute = useCallback(() => {
    return routes.find((r) => r.id === selectedRouteId);
  }, [routes, selectedRouteId]);

  const getSelectedVehicle = useCallback(() => {
    return vehicles.find((v) => v.id === selectedVehicleId);
  }, [vehicles, selectedVehicleId]);

  const getSelectedStop = useCallback(() => {
    if (!selectedStopId) return undefined;
    for (const r of routes) {
      const stop = r.stops.find((s) => s.id === selectedStopId);
      if (stop) return stop;
    }
    return undefined;
  }, [routes, selectedStopId]);

  return (
    <TransitContext.Provider
      value={{
        routes,
        vehicles,
        selectedRouteId,
        selectedVehicleId,
        selectedStopId,
        userLocation,
        favorites,
        theme,
        activeTab,
        trackedVehicleId,
        trackVehicle,
        startDriverTrip,
        endDriverTrip,
        liveTripToast,
        dismissTripToast,
        selectRoute,
        selectVehicle,
        selectStop,
        toggleFavorite,
        isFavorite,
        setActiveTab,
        toggleTheme,
        getSelectedRoute,
        getSelectedVehicle,
        getSelectedStop,
      }}
    >
      {children}
    </TransitContext.Provider>
  );
};

export const useTransit = () => {
  const context = useContext(TransitContext);
  if (!context) {
    throw new Error('useTransit must be used within a TransitProvider');
  }
  return context;
};
