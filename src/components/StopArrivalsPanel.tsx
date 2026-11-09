import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import { getDistanceKm } from '../data/mockTransitData';
import { MapPin, Star, Bell, ChevronRight, Navigation, LocateFixed } from 'lucide-react';

export const StopArrivalsPanel: React.FC = () => {
  const {
    routes,
    vehicles,
    selectedStopId,
    selectStop,
    selectVehicle,
    userLocation,
    toggleFavorite,
    isFavorite,
    trackVehicle,
    trackedVehicleId,
  } = useTransit();

  const [searchQuery, setSearchQuery] = useState('');
  const [alertSetStopId, setAlertSetStopId] = useState<string | null>(null);

  // Flatten all stops with route info
  const allStops = routes.flatMap((r) =>
    r.stops.map((s) => ({
      ...s,
      routeColor: r.color,
      routeCode: r.code,
      routeName: r.name,
      routeId: r.id,
      distanceKm: userLocation ? getDistanceKm(userLocation.lat, userLocation.lng, s.lat, s.lng) : null,
    }))
  );

  // Filter stops
  const filteredStops = allStops.filter((stop) =>
    stop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stop.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Active selected stop
  const selectedStop = allStops.find((s) => s.id === selectedStopId) || allStops[0];

  // Vehicles heading to this stop or serving this line
  const approachingVehicles = vehicles
    .filter((v) => {
      const route = routes.find((r) => r.id === v.routeId);
      return route?.stops.some((s) => s.id === selectedStop?.id);
    })
    .map((v) => {
      const isNextStop = v.nextStopId === selectedStop?.id;
      // Approximate ETA in minutes
      const etaMin = isNextStop ? Math.ceil(v.nextStopEtaSeconds / 60) : Math.floor(4 + Math.random() * 8);
      return {
        ...v,
        etaMinutes: etaMin,
        isNextStop,
      };
    })
    .sort((a, b) => a.etaMinutes - b.etaMinutes);

  const handleToggleAlert = (stopId: string) => {
    if (alertSetStopId === stopId) {
      setAlertSetStopId(null);
    } else {
      setAlertSetStopId(stopId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
          Transit Stations & Arrival Boards
        </h3>
        <input
          type="text"
          placeholder="Search by stop name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-lg border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition-colors"
        />
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {/* Selected Stop Hero Display */}
        {selectedStop && (
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedStop.name}
                  </h4>
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono">{selectedStop.code}</span>
                  <span aria-hidden="true">·</span>
                  <span>Line {selectedStop.routeCode}</span>
                  {selectedStop.distanceKm !== null && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{selectedStop.distanceKm.toFixed(2)} km away</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Alert notify button */}
                <button
                  onClick={() => handleToggleAlert(selectedStop.id)}
                  title="Notify when vehicle approaches"
                  className={`p-1.5 rounded-md transition-colors ${
                    alertSetStopId === selectedStop.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </button>

                {/* Star favorite */}
                <button
                  onClick={() =>
                    toggleFavorite({
                      id: selectedStop.id,
                      type: 'stop',
                      name: selectedStop.name,
                      code: selectedStop.code,
                    })
                  }
                  className={`p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                    isFavorite(selectedStop.id) ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'
                  }`}
                >
                  <Star className={`w-4 h-4 ${isFavorite(selectedStop.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Stop Amenities */}
            <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
              {selectedStop.shelter && <span>Sheltered</span>}
              {selectedStop.wheelchair && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>ADA Ramp</span>
                </>
              )}
              {selectedStop.realtimeDisplay && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Live Signage</span>
                </>
              )}
              {selectedStop.transfers.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Connect: {selectedStop.transfers.join(', ')}</span>
                </>
              )}
            </div>

            {alertSetStopId === selectedStop.id && (
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 shrink-0" />
                <span>Arrival alert active: You will be notified when your vehicle is 1 stop away.</span>
              </div>
            )}
          </div>
        )}

        {/* Live Approaching Departures Board */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Next Live Arrivals</span>
            <span className="font-mono tabular-nums">Auto-updating</span>
          </div>

          {approachingVehicles.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">
              No vehicles currently approaching this station.
            </div>
          ) : (
            <div className="space-y-2">
              {approachingVehicles.map((vehicle) => {
                const route = routes.find((r) => r.id === vehicle.routeId);
                return (
                  <div
                    key={vehicle.id}
                    onClick={() => selectVehicle(vehicle.id)}
                    className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-9 rounded-full shrink-0"
                        style={{ backgroundColor: route?.color || '#3B82F6' }}
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white text-xs">
                          {vehicle.label}
                        </div>
                        <div className="text-slate-500 text-[11px] font-mono tabular-nums">
                          {vehicle.occupancyPercent}% full · Driver {vehicle.driverName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
                          {vehicle.etaMinutes} min
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {(!vehicle.delayMinutes || vehicle.delayMinutes === 0) ? 'On Schedule' : `+${vehicle.delayMinutes}m delay`}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (vehicle.isTripStarted) {
                            trackVehicle(trackedVehicleId === vehicle.id ? null : vehicle.id);
                          }
                        }}
                        title={vehicle.isTripStarted ? "Track real vehicle location on map" : "Trip awaiting driver start"}
                        className={`p-1.5 rounded-md transition-colors flex items-center gap-1 text-[11px] font-semibold ${
                          trackedVehicleId === vehicle.id
                            ? 'bg-blue-600 text-white'
                            : vehicle.isTripStarted
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <LocateFixed className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {trackedVehicleId === vehicle.id ? 'Tracking' : 'Track'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stations Directory List */}
        <div className="p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            All Network Stations ({filteredStops.length})
          </div>

          <div className="space-y-1">
            {filteredStops.map((stop) => {
              const isSelected = selectedStop?.id === stop.id;
              return (
                <div
                  key={`${stop.id}-${stop.routeCode}`}
                  onClick={() => selectStop(stop.id)}
                  className={`p-2.5 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: stop.routeColor }}
                    />
                    <span>{stop.name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] tabular-nums">
                    <span>{stop.code}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
