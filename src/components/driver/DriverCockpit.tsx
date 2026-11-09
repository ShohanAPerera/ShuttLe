import React, { useState } from 'react';
import { useTransit } from '../../context/TransitContext';
import { useAuth } from '../../context/AuthContext';
import {
  Bus,
  Gauge,
  Users,
  Play,
  Square,
  Coffee,
  CheckCircle2,
  MapPin,
  Clock,
  Radio,
  LocateFixed,
} from 'lucide-react';

export const DriverCockpit: React.FC = () => {
  const {
    vehicles,
    routes,
    startDriverTrip,
    endDriverTrip,
    trackVehicle,
    setActiveTab,
  } = useTransit();
  const { user } = useAuth();

  // Find driver's assigned vehicle or fallback to first vehicle
  const assignedVehicle =
    vehicles.find((v) => v.id === user?.assignedVehicleId) || vehicles[0];

  const route = routes.find((r) => r.id === assignedVehicle?.routeId);
  const nextStop = route?.stops.find((s) => s.id === assignedVehicle?.nextStopId);

  const [shiftStatus, setShiftStatus] = useState<'active' | 'break'>('active');
  const [passengerCount, setPassengerCount] = useState<number>(assignedVehicle?.currentPassengers || 24);

  if (!assignedVehicle) return null;

  const handleToggleTrip = () => {
    if (assignedVehicle.isTripStarted) {
      endDriverTrip(assignedVehicle.id);
    } else {
      startDriverTrip(assignedVehicle.id);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 space-y-6">
      {/* Trip Transmission Status Banner */}
      <div
        className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          assignedVehicle.isTripStarted
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 shadow-sm'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              assignedVehicle.isTripStarted
                ? 'bg-emerald-500 animate-ping'
                : 'bg-amber-500'
            }`}
          />
          <div>
            <div className="font-bold text-sm flex items-center gap-2">
              <span>{assignedVehicle.isTripStarted ? 'Trip Active · Live GPS Broadcasting' : 'Trip Idle · Awaiting Departure'}</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80">
                {assignedVehicle.tripCode || `TRIP-${assignedVehicle.vehicleNumber}`}
              </span>
            </div>
            <p className="text-xs opacity-80 mt-0.5">
              {assignedVehicle.isTripStarted
                ? 'GPS coordinates are streaming to passengers in real-time. Commuters can track your bus on OpenStreetMap.'
                : 'Passengers cannot track this bus until you start the trip. Ready to depart?'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {assignedVehicle.isTripStarted && (
            <button
              onClick={() => {
                trackVehicle(assignedVehicle.id);
                setActiveTab('tracker');
              }}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5"
            >
              <LocateFixed className="w-4 h-4 text-blue-600" />
              <span>View Map</span>
            </button>
          )}

          <button
            onClick={handleToggleTrip}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md transition-all whitespace-nowrap shrink-0 flex items-center justify-center gap-2 ${
              assignedVehicle.isTripStarted
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-400/50'
            }`}
          >
            {assignedVehicle.isTripStarted ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>End Current Trip</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start Trip (Go Live)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Driver Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <Bus className="w-6 h-6" />
          </div>

          <div>
            <div className="text-xs text-slate-500 font-mono">
              Driver Shift Cockpit · GPS Telemetry
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Operator {user?.name || assignedVehicle.driverName} (Unit #{assignedVehicle.vehicleNumber})
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {route?.name}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{assignedVehicle.currentLat.toFixed(4)}, {assignedVehicle.currentLng.toFixed(4)}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                {shiftStatus === 'active' ? '● On Active Shift' : '⏸ On Rest Break'}
              </span>
            </div>
          </div>
        </div>

        {/* Shift Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShiftStatus(shiftStatus === 'active' ? 'break' : 'active')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              shiftStatus === 'break'
                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>{shiftStatus === 'break' ? 'Resume Driving' : 'Take Break'}</span>
          </button>
        </div>
      </div>

      {/* Primary Telemetry & Vehicle Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Speed & Heading Gauge Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-blue-600" />
              <span>Speed & Telemetry</span>
            </span>
            <span className="font-mono">{assignedVehicle.bearing}° N</span>
          </div>

          <div className="text-center py-2">
            <div className="text-5xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {assignedVehicle.speedKmH}
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
              Kilometers / Hour
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">Vehicle Status</span>
            <span className="font-bold font-mono uppercase text-blue-600 dark:text-blue-400">
              {assignedVehicle.status === 'at_stop' ? 'Station Dwell' : assignedVehicle.status === 'depot' ? 'Depot Standby' : 'Line Cruise'}
            </span>
          </div>
        </div>

        {/* GPS Live Stream Status Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-600" />
              <span>GPS Stream Transmitter</span>
            </span>
            <span className={`font-bold font-mono text-xs ${assignedVehicle.isTripStarted ? 'text-emerald-600' : 'text-amber-500'}`}>
              {assignedVehicle.isTripStarted ? 'BROADCASTING LIVE' : 'OFFLINE (DEPOT)'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
            <div className="text-slate-400 text-[10px] uppercase font-semibold">Active Coordinates</div>
            <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {assignedVehicle.currentLat.toFixed(5)}, {assignedVehicle.currentLng.toFixed(5)}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              Corridor: {route?.name}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">Transmitter Ping</span>
            <span className="font-mono text-slate-600 dark:text-slate-300">Every 1.0s</span>
          </div>
        </div>

        {/* Passenger Load & Capacity */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Passenger Headcount</span>
            </span>
            <span className="font-mono tabular-nums">{passengerCount} / {assignedVehicle.capacity} max</span>
          </div>

          <div className="flex items-center justify-center gap-4 py-1">
            <button
              onClick={() => setPassengerCount((prev) => Math.max(0, prev - 1))}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-lg hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              -
            </button>
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
              {passengerCount}
            </div>
            <button
              onClick={() => setPassengerCount((prev) => Math.min(assignedVehicle.capacity, prev + 1))}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-lg hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                passengerCount > assignedVehicle.capacity * 0.8 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${(passengerCount / assignedVehicle.capacity) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Next Station Progression List */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Upcoming Route Stops & Schedule
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Line {route?.code} Corridor
          </span>
        </div>

        <div className="space-y-2">
          {route?.stops.map((stop, index) => {
            const isNext = stop.id === assignedVehicle.nextStopId;
            return (
              <div
                key={stop.id}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                  isNext
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100'
                    : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                      isNext
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {stop.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Station Code: {stop.code}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {isNext ? (
                    <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                      NEXT ARRIVAL (~{Math.ceil(assignedVehicle.nextStopEtaSeconds / 60)}m)
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono">Scheduled</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
