import React from 'react';
import { useTransit } from '../context/TransitContext';
import { getDistanceKm } from '../data/mockTransitData';
import {
  X,
  Navigation,
  Gauge,
  BatteryCharging,
  Users,
  Wifi,
  Wind,
  Bike,
  Star,
  CheckCircle2,
  Clock,
  Radio,
  DoorOpen,
  MapPin,
  LocateFixed,
} from 'lucide-react';

export const VehicleDetailDrawer: React.FC = () => {
  const {
    vehicles,
    routes,
    selectedVehicleId,
    selectVehicle,
    trackedVehicleId,
    trackVehicle,
    userLocation,
  } = useTransit();

  const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
  if (!vehicle) return null;

  const route = routes.find((r) => r.id === vehicle.routeId);
  const nextStop = route?.stops.find((s) => s.id === vehicle.nextStopId);
  const isTracked = trackedVehicleId === vehicle.id;
  const distanceKm = userLocation
    ? getDistanceKm(userLocation.lat, userLocation.lng, vehicle.currentLat, vehicle.currentLng)
    : null;

  return (
    <div className="absolute bottom-6 right-6 z-30 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-3 h-8 rounded-full"
            style={{ backgroundColor: route?.color || '#3B82F6' }}
          />
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {vehicle.label}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Unit #{vehicle.vehicleNumber} · {route?.name}
            </p>
          </div>
        </div>

        <button
          onClick={() => selectVehicle(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Next Stop ETA banner */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              NEXT STOP
            </span>
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              {nextStop?.name || 'In Transit'}
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
              {Math.ceil(vehicle.nextStopEtaSeconds / 60)} min
            </span>
            <div className="text-[10px] text-slate-500 font-mono">
              {(!vehicle.delayMinutes || vehicle.delayMinutes === 0) ? 'On Time' : `+${vehicle.delayMinutes}m`}
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <Gauge className="w-3.5 h-3.5" />
              <span>Speed</span>
            </div>
            <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums text-sm">
              {vehicle.speedKmH} <span className="text-[10px] text-slate-400">km/h</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Load</span>
            </div>
            <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums text-sm">
              {vehicle.occupancyPercent}%
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <BatteryCharging className="w-3.5 h-3.5" />
              <span>Energy</span>
            </div>
            <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-sm">
              {vehicle.batteryOrFuelPercent ?? 94}%
            </div>
          </div>
        </div>

        {/* Driver Card */}
        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
              {vehicle.driverName.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                {vehicle.driverName}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Star className="w-3 h-3 text-amber-500 fill-current" />
                <span className="font-mono tabular-nums">{vehicle.driverRating.toFixed(2)}</span>
                <span aria-hidden="true">·</span>
                <span>{vehicle.driverTrips} trips</span>
              </div>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            Verified Driver
          </span>
        </div>

        {/* Vehicle Amenities */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-500">
            AMENITIES & ACCESSIBILITY
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            {vehicle.features?.wheelchair && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>ADA Accessible</span>
              </span>
            )}
            {vehicle.features?.ac && (
              <span className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-slate-500" />
                <span>Air Conditioned</span>
              </span>
            )}
            {vehicle.features?.wifi && (
              <span className="flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-slate-500" />
                <span>Free Wi-Fi</span>
              </span>
            )}
          </div>
        </div>

        {/* Real Location Telemetry Card */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <LocateFixed className="w-3.5 h-3.5" />
              <span>Real-Time Coordinates</span>
            </span>
            <span className={`font-mono text-[10px] font-bold ${vehicle.isTripStarted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
              {vehicle.isTripStarted ? 'GPS Stream Active' : 'Trip Idle in Depot'}
            </span>
          </div>

          <div className="text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums">
            {vehicle.currentLat.toFixed(5)}, {vehicle.currentLng.toFixed(5)}
          </div>

          {vehicle.currentRoad && (
            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              {vehicle.currentRoad}
            </div>
          )}

          {distanceKm !== null && vehicle.isTripStarted && (
            <div className="text-[11px] text-slate-500 font-mono">
              Approx. <strong className="text-blue-600 dark:text-blue-400">{distanceKm.toFixed(2)} km</strong> from your location
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          {vehicle.isTripStarted ? (
            <button
              onClick={() => trackVehicle(isTracked ? null : vehicle.id)}
              className={`w-full py-2.5 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                isTracked
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
              }`}
            >
              <LocateFixed className="w-4 h-4" />
              <span>{isTracked ? 'Camera Tracking Live Location (Active) ✓' : 'Track Real Vehicle Location on Map'}</span>
            </button>
          ) : (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-lg text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>This vehicle is waiting for the assigned driver to start the trip.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
